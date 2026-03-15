import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Message, Participant } from '../types';

interface UseSupabaseChatProps {
  roomId: string;
  userName: string;
}

export function useSupabaseChat({ roomId, userName }: UseSupabaseChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userName.trim() || !roomId.trim()) {
      return;
    }

    let mounted = true;

    const initializeRoom = async () => {
      try {
        const { error: roomError } = await supabase
          .from('rooms')
          .upsert({
            id: roomId,
            last_activity: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (roomError) {
          console.error('Error creating/updating room:', roomError);
          setConnectionError('Failed to initialize room');
          return;
        }

        const { data: existingParticipant } = await supabase
          .from('participants')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_name', userName)
          .maybeSingle();

        if (existingParticipant) {
          participantIdRef.current = existingParticipant.id;

          const { error: updateError } = await supabase
            .from('participants')
            .update({
              is_online: true,
              last_seen: new Date().toISOString()
            })
            .eq('id', existingParticipant.id);

          if (updateError) {
            console.error('Error updating participant:', updateError);
          }
        } else {
          const { data: newParticipant, error: insertError } = await supabase
            .from('participants')
            .insert({
              room_id: roomId,
              user_name: userName,
              is_online: true
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating participant:', insertError);
            setConnectionError('Failed to join room');
            return;
          }

          participantIdRef.current = newParticipant.id;

          await supabase
            .from('messages')
            .insert({
              room_id: roomId,
              sender: 'System',
              content: `${userName} joined the room`,
              type: 'system',
              encrypted: false
            });
        }

        const { data: existingMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else if (mounted && existingMessages) {
          setMessages(existingMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            sender: msg.sender,
            type: msg.type as Message['type'],
            fileName: msg.file_name || undefined,
            fileSize: msg.file_size || undefined,
            encrypted: msg.encrypted
          })));
        }

        await loadParticipants();

        const channel = supabase.channel(`room:${roomId}`, {
          config: {
            broadcast: { self: true }
          }
        });

        channel
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `room_id=eq.${roomId}`
            },
            (payload) => {
              if (!mounted) return;

              const newMessage = payload.new;
              const message: Message = {
                id: newMessage.id,
                content: newMessage.content,
                timestamp: new Date(newMessage.created_at).getTime(),
                sender: newMessage.sender,
                type: newMessage.type,
                fileName: newMessage.file_name || undefined,
                fileSize: newMessage.file_size || undefined,
                encrypted: newMessage.encrypted
              };

              setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
            }
          )
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'participants',
              filter: `room_id=eq.${roomId}`
            },
            async () => {
              if (!mounted) return;
              await loadParticipants();
            }
          )
          .on('broadcast',
            { event: 'typing' },
            ({ payload }) => {
              if (!mounted || payload.userName === userName) return;

              setTypingUsers(prev => {
                if (payload.isTyping) {
                  return prev.includes(payload.userName) ? prev : [...prev, payload.userName];
                } else {
                  return prev.filter(name => name !== payload.userName);
                }
              });
            }
          )
          .subscribe((status) => {
            if (!mounted) return;

            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
              console.log('Connected to Supabase realtime');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              setConnectionError('Connection lost. Attempting to reconnect...');
            }
          });

        channelRef.current = channel;

        heartbeatIntervalRef.current = setInterval(async () => {
          if (participantIdRef.current) {
            await supabase
              .from('participants')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', participantIdRef.current);
          }
        }, 30000);

      } catch (error) {
        console.error('Error initializing room:', error);
        if (mounted) {
          setConnectionError('Failed to connect to chat');
        }
      }
    };

    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      if (mounted && data) {
        setParticipants(data.map(p => ({
          id: p.id,
          name: p.user_name,
          isOnline: p.is_online,
          joinedAt: new Date(p.joined_at).getTime()
        })));
      }
    };

    initializeRoom();

    return () => {
      mounted = false;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const cleanup = async () => {
        if (participantIdRef.current) {
          await supabase
            .from('participants')
            .update({ is_online: false })
            .eq('id', participantIdRef.current);

          await supabase
            .from('messages')
            .insert({
              room_id: roomId,
              sender: 'System',
              content: `${userName} left the room`,
              type: 'system',
              encrypted: false
            });
        }

        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }
      };

      cleanup();
    };
  }, [roomId, userName]);

  const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!isConnected) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender: message.sender,
          content: message.content,
          type: message.type,
          file_name: message.fileName || null,
          file_size: message.fileSize || null,
          encrypted: message.encrypted || false
        });

      if (error) {
        console.error('Error sending message:', error);
        setConnectionError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError('Failed to send message');
    }
  };

  const startTyping = () => {
    if (!channelRef.current || !isConnected) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userName, isTyping: true }
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!channelRef.current || !isConnected) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userName, isTyping: false }
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return {
    isConnected,
    connectionError,
    messages,
    participants,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Message, Participant } from '../types';

interface UseSupabaseChatProps {
  roomId: string;
  userName: string;
  isHost?: boolean;
  hostSessionId?: string;
}

type JoinStatus = 'idle' | 'checking' | 'pincode_required' | 'banned' | 'kicked' | 'joined' | 'error';

export function useSupabaseChat({ roomId, userName, isHost = false, hostSessionId = '' }: UseSupabaseChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle');
  const [roomHostName, setRoomHostName] = useState<string>('');
  const [roomIsLocked, setRoomIsLocked] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const participantSessionIdRef = useRef<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_online', true)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    if (mountedRef.current && data) {
      setParticipants(data.map(p => ({
        id: p.id,
        name: p.user_name,
        isOnline: p.is_online,
        joinedAt: new Date(p.joined_at).getTime(),
        sessionId: p.session_id || ''
      })));
    }
  }, [roomId]);

  useEffect(() => {
    if (!userName.trim() || !roomId.trim()) {
      return;
    }

    mountedRef.current = true;
    const sessionId = generateSessionId();
    participantSessionIdRef.current = sessionId;

    const initializeRoom = async () => {
      try {
        setJoinStatus('checking');

        const { data: roomData, error: roomFetchError } = await supabase
          .from('rooms')
          .select('id, host_name, host_session_id, is_locked, pincode')
          .eq('id', roomId)
          .maybeSingle();

        if (roomFetchError) {
          console.error('Error fetching room:', roomFetchError);
          if (mountedRef.current) setConnectionError('Failed to connect to room');
          setJoinStatus('error');
          return;
        }

        if (roomData) {
          setRoomHostName(roomData.host_name || '');
          setRoomIsLocked(roomData.is_locked || false);
        }

        if (!isHost) {
          const { data: banData } = await supabase
            .from('banned_participants')
            .select('id')
            .eq('room_id', roomId)
            .eq('user_name', userName)
            .maybeSingle();

          if (banData) {
            setJoinStatus('banned');
            return;
          }
        }

        if (isHost) {
          const { error: roomError } = await supabase
            .from('rooms')
            .upsert({
              id: roomId,
              last_activity: new Date().toISOString(),
              host_name: userName,
              host_session_id: hostSessionId
            }, { onConflict: 'id' });

          if (roomError) {
            console.error('Error creating room:', roomError);
            setConnectionError('Failed to initialize room');
            setJoinStatus('error');
            return;
          }
        } else {
          await supabase
            .from('rooms')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', roomId);
        }

        const { data: existingParticipant } = await supabase
          .from('participants')
          .select('id, session_id')
          .eq('room_id', roomId)
          .eq('user_name', userName)
          .maybeSingle();

        if (existingParticipant) {
          participantIdRef.current = existingParticipant.id;

          await supabase
            .from('participants')
            .update({
              is_online: true,
              last_seen: new Date().toISOString(),
              session_id: sessionId
            })
            .eq('id', existingParticipant.id);
        } else {
          const { data: newParticipant, error: insertError } = await supabase
            .from('participants')
            .insert({
              room_id: roomId,
              user_name: userName,
              is_online: true,
              session_id: sessionId
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating participant:', insertError);
            setConnectionError('Failed to join room');
            setJoinStatus('error');
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
        } else if (mountedRef.current && existingMessages) {
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
          config: { broadcast: { self: true } }
        });

        channel
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
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
            { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
            async (payload) => {
              if (!mountedRef.current) return;

              if (payload.eventType === 'UPDATE' && payload.new) {
                const updated = payload.new as { user_name: string; is_online: boolean; session_id: string };
                if (
                  updated.user_name === userName &&
                  !updated.is_online &&
                  updated.session_id === sessionId
                ) {
                  setJoinStatus('kicked');
                  return;
                }
              }

              await loadParticipants();
            }
          )
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'banned_participants', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
              const banned = payload.new as { user_name: string };
              if (banned.user_name === userName) {
                setJoinStatus('banned');
              }
            }
          )
          .on('broadcast',
            { event: 'typing' },
            ({ payload }) => {
              if (!mountedRef.current || payload.userName === userName) return;
              setTypingUsers(prev => {
                if (payload.isTyping) {
                  return prev.includes(payload.userName) ? prev : [...prev, payload.userName];
                } else {
                  return prev.filter((name: string) => name !== payload.userName);
                }
              });
            }
          )
          .subscribe((status) => {
            if (!mountedRef.current) return;
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
              setJoinStatus('joined');
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

            await supabase.rpc('cleanup_inactive_participants');
          }
        }, 30000);

      } catch (error) {
        console.error('Error initializing room:', error);
        if (mountedRef.current) {
          setConnectionError('Failed to connect to chat');
          setJoinStatus('error');
        }
      }
    };

    initializeRoom();

    return () => {
      mountedRef.current = false;

      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
  }, [roomId, userName, isHost, hostSessionId, loadParticipants]);

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

  const kickParticipant = async (participantName: string) => {
    const { error } = await supabase
      .from('participants')
      .update({ is_online: false })
      .eq('room_id', roomId)
      .eq('user_name', participantName);

    if (!error) {
      await supabase.from('messages').insert({
        room_id: roomId,
        sender: 'System',
        content: `${participantName} was removed from the room`,
        type: 'system',
        encrypted: false
      });
    }
  };

  const banParticipant = async (participantName: string) => {
    await kickParticipant(participantName);

    await supabase
      .from('banned_participants')
      .insert({ room_id: roomId, user_name: participantName });

    await supabase.from('messages').insert({
      room_id: roomId,
      sender: 'System',
      content: `${participantName} was banned from the room`,
      type: 'system',
      encrypted: false
    });
  };

  const updateRoomLock = async (locked: boolean, pincode: string) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_locked: locked, pincode: locked ? pincode : null })
      .eq('id', roomId);

    if (!error) {
      setRoomIsLocked(locked);
    }

    return !error;
  };

  const verifyPincode = async (pin: string): Promise<boolean> => {
    const { data } = await supabase
      .from('rooms')
      .select('pincode')
      .eq('id', roomId)
      .maybeSingle();

    return data?.pincode === pin;
  };

  const startTyping = () => {
    if (!channelRef.current || !isConnected) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userName, isTyping: true }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
    joinStatus,
    roomHostName,
    roomIsLocked,
    sendMessage,
    kickParticipant,
    banParticipant,
    updateRoomLock,
    verifyPincode,
    startTyping,
    stopTyping
  };
}

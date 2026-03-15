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
  const sessionIdRef = useRef<string>('');
  const loadedMessageIdsRef = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const rowToMessage = (msg: Record<string, unknown>): Message => ({
    id: msg.id as string,
    content: msg.content as string,
    timestamp: new Date(msg.created_at as string).getTime(),
    sender: msg.sender as string,
    type: msg.type as Message['type'],
    fileName: (msg.file_name as string) || undefined,
    fileSize: (msg.file_size as number) || undefined,
    encrypted: msg.encrypted as boolean
  });

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_online', true)
      .order('joined_at', { ascending: true });

    if (error || !mountedRef.current) return;

    if (data) {
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
    if (!userName.trim() || !roomId.trim()) return;

    mountedRef.current = true;
    loadedMessageIdsRef.current = new Set();
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;

    const markOfflineSync = () => {
      if (!participantIdRef.current) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/mark_participant_offline`;
      const body = JSON.stringify({
        p_participant_id: participantIdRef.current,
        p_room_id: roomId,
        p_user_name: userName
      });
      navigator.sendBeacon(
        url + '?apikey=' + import.meta.env.VITE_SUPABASE_ANON_KEY,
        new Blob([body], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', markOfflineSync);
    window.addEventListener('pagehide', markOfflineSync);

    const initializeRoom = async () => {
      try {
        setJoinStatus('checking');

        const { data: roomData, error: roomFetchError } = await supabase
          .from('rooms')
          .select('id, host_name, is_locked, pincode')
          .eq('id', roomId)
          .maybeSingle();

        if (roomFetchError) {
          if (mountedRef.current) {
            setConnectionError('Failed to connect to room');
            setJoinStatus('error');
          }
          return;
        }

        if (roomData) {
          if (mountedRef.current) {
            setRoomHostName(roomData.host_name || '');
            setRoomIsLocked(roomData.is_locked || false);
          }
        }

        if (!isHost) {
          const { data: banData } = await supabase
            .from('banned_participants')
            .select('id')
            .eq('room_id', roomId)
            .eq('user_name', userName)
            .maybeSingle();

          if (banData) {
            if (mountedRef.current) setJoinStatus('banned');
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
            if (mountedRef.current) {
              setConnectionError('Failed to initialize room');
              setJoinStatus('error');
            }
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
          .select('id, is_online')
          .eq('room_id', roomId)
          .eq('user_name', userName)
          .maybeSingle();

        if (existingParticipant) {
          participantIdRef.current = existingParticipant.id;
          const wasOffline = !existingParticipant.is_online;

          await supabase
            .from('participants')
            .update({ is_online: true, last_seen: new Date().toISOString(), session_id: sessionId })
            .eq('id', existingParticipant.id);

          if (wasOffline) {
            if (isHost) {
              await supabase.from('rooms').update({ host_name: userName }).eq('id', roomId);
            }
            await supabase.from('messages').insert({
              room_id: roomId, sender: 'System',
              content: `${userName} rejoined the room`, type: 'system', encrypted: false
            });
          }
        } else {
          const { data: newParticipant, error: insertError } = await supabase
            .from('participants')
            .insert({ room_id: roomId, user_name: userName, is_online: true, session_id: sessionId })
            .select()
            .single();

          if (insertError || !newParticipant) {
            if (mountedRef.current) {
              setConnectionError('Failed to join room');
              setJoinStatus('error');
            }
            return;
          }

          participantIdRef.current = newParticipant.id;
          await supabase.from('messages').insert({
            room_id: roomId, sender: 'System',
            content: `${userName} joined the room`, type: 'system', encrypted: false
          });
        }

        await loadParticipants();

        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (mountedRef.current && existingMessages) {
          const mapped = existingMessages.map(rowToMessage);
          mapped.forEach(m => loadedMessageIdsRef.current.add(m.id));
          setMessages(mapped);
        }

        const channel = supabase.channel(`room:${roomId}`);

        channel
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
              const msg = rowToMessage(payload.new as Record<string, unknown>);
              if (loadedMessageIdsRef.current.has(msg.id)) return;
              loadedMessageIdsRef.current.add(msg.id);
              setMessages(prev => [...prev, msg]);
            }
          )
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
            () => { if (mountedRef.current) loadParticipants(); }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
              const updated = payload.new as { user_name: string; is_online: boolean; session_id: string };
              if (
                updated.user_name === userName &&
                !updated.is_online &&
                updated.session_id === sessionId
              ) {
                setJoinStatus('kicked');
                return;
              }
              loadParticipants();
            }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
              const updated = payload.new as { host_name: string; is_locked: boolean };
              setRoomHostName(updated.host_name ?? '');
              setRoomIsLocked(updated.is_locked ?? false);
            }
          )
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'banned_participants', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (!mountedRef.current) return;
              const banned = payload.new as { user_name: string };
              if (banned.user_name === userName) setJoinStatus('banned');
            }
          )
          .on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (!mountedRef.current || payload.userName === userName) return;
            setTypingUsers(prev => {
              if (payload.isTyping) {
                return prev.includes(payload.userName) ? prev : [...prev, payload.userName];
              }
              return prev.filter((n: string) => n !== payload.userName);
            });
          })
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
          if (participantIdRef.current && mountedRef.current) {
            await supabase
              .from('participants')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', participantIdRef.current);
          }
        }, 20000);

      } catch (err) {
        console.error('Error initializing room:', err);
        if (mountedRef.current) {
          setConnectionError('Failed to connect to chat');
          setJoinStatus('error');
        }
      }
    };

    initializeRoom();

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeunload', markOfflineSync);
      window.removeEventListener('pagehide', markOfflineSync);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      const cleanup = async () => {
        if (participantIdRef.current) {
          await supabase.rpc('mark_participant_offline', {
            p_participant_id: participantIdRef.current,
            p_room_id: roomId,
            p_user_name: userName
          });

          await supabase.from('messages').insert({
            room_id: roomId, sender: 'System',
            content: `${userName} left the room`, type: 'system', encrypted: false
          });
        }
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };

      cleanup();
    };
  }, [roomId, userName, isHost, hostSessionId, loadParticipants]);

  const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!isConnected) return;
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender: message.sender,
      content: message.content,
      type: message.type,
      file_name: message.fileName || null,
      file_size: message.fileSize || null,
      encrypted: message.encrypted || false
    });
    if (error) setConnectionError('Failed to send message');
  };

  const kickParticipant = async (participantName: string) => {
    await supabase
      .from('participants')
      .update({ is_online: false })
      .eq('room_id', roomId)
      .eq('user_name', participantName);

    await supabase.from('messages').insert({
      room_id: roomId, sender: 'System',
      content: `${participantName} was removed from the room`, type: 'system', encrypted: false
    });
  };

  const banParticipant = async (participantName: string) => {
    await kickParticipant(participantName);
    await supabase.from('banned_participants').insert({ room_id: roomId, user_name: participantName });
    await supabase.from('messages').insert({
      room_id: roomId, sender: 'System',
      content: `${participantName} was banned from the room`, type: 'system', encrypted: false
    });
  };

  const updateRoomLock = async (locked: boolean, pincode: string) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_locked: locked, pincode: locked ? pincode : null })
      .eq('id', roomId);
    if (!error) setRoomIsLocked(locked);
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
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userName, isTyping: true } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 3000);
  };

  const stopTyping = () => {
    if (!channelRef.current || !isConnected) return;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userName, isTyping: false } });
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
  };

  return {
    isConnected, connectionError, messages, participants, typingUsers,
    joinStatus, roomHostName, roomIsLocked,
    sendMessage, kickParticipant, banParticipant, updateRoomLock, verifyPincode,
    startTyping, stopTyping
  };
}

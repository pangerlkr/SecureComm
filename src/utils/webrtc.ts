import { supabase } from '../lib/supabase';

export interface WebRTCSignal {
  from_user: string;
  to_user: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end' | 'call-reject';
  signal_data?: unknown;
}

type SignalCallback = (signal: WebRTCSignal) => void;
type StreamCallback = (stream: MediaStream) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteUser: string | null = null;
  private readonly roomId: string;
  private readonly userName: string;
  private signalChannel: ReturnType<typeof supabase.channel> | null = null;
  private onRemoteStreamCb?: StreamCallback;
  private onSignalCb?: SignalCallback;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescSet = false;
  private pendingOffer: RTCSessionDescriptionInit | null = null;

  constructor(roomId: string, userName: string) {
    this.roomId = roomId;
    this.userName = userName;
  }

  initialize() {
    if (this.signalChannel) return;

    this.signalChannel = supabase.channel(`webrtc:${this.roomId}:${this.userName}`);
    this.signalChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `to_user=eq.${this.userName}`
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            from_user: string;
            to_user: string;
            signal_type: WebRTCSignal['signal_type'];
            signal_data: unknown;
          };
          await this.handleSignal({
            from_user: row.from_user,
            to_user: row.to_user,
            signal_type: row.signal_type,
            signal_data: row.signal_data
          });
          await supabase.from('webrtc_signals').update({ processed: true }).eq('id', row.id);
        }
      )
      .subscribe();
  }

  onRemoteStream(cb: StreamCallback) { this.onRemoteStreamCb = cb; }
  onSignal(cb: SignalCallback) { this.onSignalCb = cb; }

  private createPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      this.pc.close();
    }

    this.remoteDescSet = false;
    this.pendingCandidates = [];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (e) => {
      if (e.candidate && this.remoteUser) {
        await this.sendSignal({
          from_user: this.userName,
          to_user: this.remoteUser,
          signal_type: 'ice-candidate',
          signal_data: e.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream && this.onRemoteStreamCb) {
        this.onRemoteStreamCb(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    this.pc = pc;
    return pc;
  }

  private async drainPendingCandidates() {
    for (const candidate of this.pendingCandidates) {
      try {
        await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* ignore stale candidates */ }
    }
    this.pendingCandidates = [];
  }

  private async sendSignal(signal: WebRTCSignal) {
    await supabase.from('webrtc_signals').insert({
      room_id: this.roomId,
      from_user: signal.from_user,
      to_user: signal.to_user,
      signal_type: signal.signal_type,
      signal_data: signal.signal_data ?? null
    });
  }

  private async handleSignal(signal: WebRTCSignal) {
    try {
      switch (signal.signal_type) {
        case 'call-start':
          this.onSignalCb?.(signal);
          break;

        case 'offer': {
          this.remoteUser = signal.from_user;
          this.pendingOffer = signal.signal_data as RTCSessionDescriptionInit;
          const pc = this.createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));
          this.remoteDescSet = true;
          await this.drainPendingCandidates();
          break;
        }

        case 'answer': {
          if (!this.pc) return;
          await this.pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as RTCSessionDescriptionInit));
          this.remoteDescSet = true;
          await this.drainPendingCandidates();
          break;
        }

        case 'ice-candidate': {
          const candidate = signal.signal_data as RTCIceCandidateInit;
          if (!candidate) return;
          if (this.pc && this.remoteDescSet) {
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch { /* ignore */ }
          } else {
            this.pendingCandidates.push(candidate);
          }
          break;
        }

        case 'call-end':
        case 'call-reject':
          this.onSignalCb?.(signal);
          break;
      }
    } catch (err) {
      console.error('Error handling WebRTC signal:', err);
    }
  }

  async startCall(toUser: string, isVideo: boolean): Promise<MediaStream | null> {
    try {
      this.remoteUser = toUser;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      const pc = this.createPeerConnection();
      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream!));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
      await pc.setLocalDescription(offer);

      await this.sendSignal({
        from_user: this.userName,
        to_user: toUser,
        signal_type: 'call-start',
        signal_data: { isVideo }
      });

      await this.sendSignal({
        from_user: this.userName,
        to_user: toUser,
        signal_type: 'offer',
        signal_data: offer
      });

      return this.localStream;
    } catch (err) {
      console.error('Error starting call:', err);
      this.stopMedia();
      return null;
    }
  }

  async acceptCall(fromUser: string, isVideo: boolean): Promise<MediaStream | null> {
    try {
      this.remoteUser = fromUser;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      if (!this.pc) {
        this.createPeerConnection();
      }
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      await this.sendSignal({
        from_user: this.userName,
        to_user: fromUser,
        signal_type: 'answer',
        signal_data: answer
      });

      this.pendingOffer = null;
      return this.localStream;
    } catch (err) {
      console.error('Error accepting call:', err);
      this.stopMedia();
      return null;
    }
  }

  async rejectCall(fromUser: string) {
    await this.sendSignal({
      from_user: this.userName,
      to_user: fromUser,
      signal_type: 'call-reject'
    });
    this.cleanup();
  }

  async endCall(toUser: string) {
    await this.sendSignal({
      from_user: this.userName,
      to_user: toUser,
      signal_type: 'call-end'
    });
    this.cleanup();
  }

  private stopMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
  }

  private cleanup() {
    this.stopMedia();
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.remoteUser = null;
    this.remoteDescSet = false;
    this.pendingCandidates = [];
    this.pendingOffer = null;
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach(t => { t.enabled = enabled; });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach(t => { t.enabled = enabled; });
  }

  disconnect() {
    this.cleanup();
    if (this.signalChannel) {
      supabase.removeChannel(this.signalChannel);
      this.signalChannel = null;
    }
  }
}

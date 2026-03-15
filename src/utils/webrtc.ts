import { supabase } from '../lib/supabase';

export interface WebRTCSignal {
  from_user: string;
  to_user: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end' | 'call-reject';
  signal_data?: any;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private roomId: string;
  private userName: string;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onSignalCallback?: (signal: WebRTCSignal) => void;
  private signalChannel: any = null;

  constructor(roomId: string, userName: string) {
    this.roomId = roomId;
    this.userName = userName;
  }

  async initialize() {
    this.signalChannel = supabase.channel(`webrtc:${this.roomId}:${this.userName}`);

    this.signalChannel
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `to_user=eq.${this.userName}`
        },
        async (payload: any) => {
          const signal = payload.new;
          await this.handleSignal({
            from_user: signal.from_user,
            to_user: signal.to_user,
            signal_type: signal.signal_type,
            signal_data: signal.signal_data
          });

          await supabase
            .from('webrtc_signals')
            .update({ processed: true })
            .eq('id', signal.id);
        }
      )
      .subscribe();
  }

  private initializePeerConnection() {
    if (this.peerConnection) {
      return;
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal({
          from_user: this.userName,
          to_user: '',
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON()
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (this.onRemoteStreamCallback && event.streams[0]) {
        this.onRemoteStreamCallback(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onSignal(callback: (signal: WebRTCSignal) => void) {
    this.onSignalCallback = callback;
  }

  private async sendSignal(signal: WebRTCSignal) {
    try {
      await supabase.from('webrtc_signals').insert({
        room_id: this.roomId,
        from_user: signal.from_user,
        to_user: signal.to_user || null,
        signal_type: signal.signal_type,
        signal_data: signal.signal_data || null
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }

  private async handleSignal(signal: WebRTCSignal) {
    if (!this.peerConnection && signal.signal_type !== 'call-start') {
      return;
    }

    try {
      switch (signal.signal_type) {
        case 'call-start':
          if (this.onSignalCallback) {
            this.onSignalCallback(signal);
          }
          break;

        case 'offer':
          this.initializePeerConnection();
          await this.peerConnection!.setRemoteDescription(
            new RTCSessionDescription(signal.signal_data)
          );
          const answer = await this.peerConnection!.createAnswer();
          await this.peerConnection!.setLocalDescription(answer);
          await this.sendSignal({
            from_user: this.userName,
            to_user: signal.from_user,
            signal_type: 'answer',
            signal_data: answer
          });
          break;

        case 'answer':
          await this.peerConnection!.setRemoteDescription(
            new RTCSessionDescription(signal.signal_data)
          );
          break;

        case 'ice-candidate':
          if (signal.signal_data) {
            await this.peerConnection!.addIceCandidate(
              new RTCIceCandidate(signal.signal_data)
            );
          }
          break;

        case 'call-end':
        case 'call-reject':
          if (this.onSignalCallback) {
            this.onSignalCallback(signal);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  async startCall(toUser: string, isVideo: boolean): Promise<MediaStream | null> {
    try {
      await this.sendSignal({
        from_user: this.userName,
        to_user: toUser,
        signal_type: 'call-start',
        signal_data: { isVideo }
      });

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      this.initializePeerConnection();

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      await this.sendSignal({
        from_user: this.userName,
        to_user: toUser,
        signal_type: 'offer',
        signal_data: offer
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      return null;
    }
  }

  async acceptCall(fromUser: string, isVideo: boolean): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      this.initializePeerConnection();

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accepting call:', error);
      return null;
    }
  }

  async rejectCall(fromUser: string) {
    await this.sendSignal({
      from_user: this.userName,
      to_user: fromUser,
      signal_type: 'call-reject'
    });
  }

  async endCall(toUser: string) {
    await this.sendSignal({
      from_user: this.userName,
      to_user: toUser,
      signal_type: 'call-end'
    });

    this.stopCall();
  }

  stopCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  disconnect() {
    this.stopCall();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalChannel) {
      supabase.removeChannel(this.signalChannel);
      this.signalChannel = null;
    }
  }
}

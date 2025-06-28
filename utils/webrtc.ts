export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private onMessageCallback?: (message: string) => void;
  private onCallCallback?: (stream: MediaStream) => void;

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // Create data channel for messaging
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(event.data);
      }
    };

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(event.data);
        }
      };
    };

    // Handle incoming media stream
    this.peerConnection.ontrack = (event) => {
      if (this.onCallCallback) {
        this.onCallCallback(event.streams[0]);
      }
    };
  }

  onMessage(callback: (message: string) => void) {
    this.onMessageCallback = callback;
  }

  onCall(callback: (stream: MediaStream) => void) {
    this.onCallCallback = callback;
  }

  async sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    }
  }

  async startVideoCall(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting video call:', error);
      return null;
    }
  }

  async startVoiceCall(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting voice call:', error);
      return null;
    }
  }

  stopCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  disconnect() {
    this.stopCall();
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}
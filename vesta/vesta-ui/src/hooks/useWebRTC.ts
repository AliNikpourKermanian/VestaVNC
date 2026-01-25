import { useEffect, useRef, useState, useCallback } from 'react';

const SIGNALING_PORT = 6085;

export interface WebRTCState {
    status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
    error: string | null;
}

export const useWebRTC = (url: string) => {
    const [state, setState] = useState<WebRTCState>({
        status: 'disconnected',
        error: null
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);

    const cleanup = () => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
    };

    const handleOffer = async (msg: any) => {
        if (!ws.current) return;
        cleanup();

        const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        pc.current = new RTCPeerConnection(config);

        pc.current.onicecandidate = (event) => {
            if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                }));
            }
        };

        pc.current.ontrack = (event) => {
            if (videoRef.current && event.streams[0]) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        try {
            await pc.current.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp }));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            ws.current.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
        } catch (e: any) {
            console.error("WebRTC Error:", e);
            setState(s => ({ ...s, error: e.message }));
        }
    };

    const handleCandidate = async (msg: any) => {
        if (pc.current) {
            try {
                await pc.current.addIceCandidate(new RTCIceCandidate({
                    candidate: msg.candidate,
                    sdpMLineIndex: msg.sdpMLineIndex
                }));
            } catch (e) { }
        }
    };

    const connect = useCallback(() => {
        setState({ status: 'connecting', error: null });

        console.log("Connecting WebRTC Signaling to:", url);
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log("Signaling Connected");
            setState(s => ({ ...s, status: 'connected' }));
        };

        ws.current.onclose = () => {
            console.log("Signaling Disconnected");
            setState({ status: 'disconnected', error: 'Signaling closed' });
            cleanup();
        };

        ws.current.onerror = (e) => {
            console.error("Signaling Error:", e);
            setState({ status: 'disconnected', error: 'Signaling error' });
        };

        ws.current.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'offer') handleOffer(msg);
            else if (msg.type === 'candidate') handleCandidate(msg);
        };

    }, [url]);

    const disconnect = useCallback(() => {
        if (ws.current) ws.current.close();
        cleanup();
    }, []);

    const sendInput = useCallback((data: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'input', ...data }));
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => disconnect();
    }, [disconnect]);

    return {
        state,
        status: state.status,
        error: state.error,
        connect,
        disconnect,
        sendInput,
        videoRef
    };
};

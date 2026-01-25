import { useState, useCallback, useRef, useEffect } from 'react';

export const useAudio = () => {
    const [micActive, setMicActive] = useState(true); // Default to enabled
    const [speakerActive, setSpeakerActive] = useState(true); // Default to enabled

    // Refs to hold instances
    const micRef = useRef<{ ws: WebSocket | null, context: AudioContext | null, stream: MediaStream | null }>({ ws: null, context: null, stream: null });
    const speakerRef = useRef<{ ws: WebSocket | null, context: AudioContext | null, nextTime: number }>({ ws: null, context: null, nextTime: 0 });

    // --- Speaker Logic (Port 6082) ---
    const startSpeaker = useCallback(async () => {
        if (speakerRef.current.context?.state === 'suspended') {
            speakerRef.current.context.resume();
            setSpeakerActive(true);
            return;
        }
        if (speakerRef.current.ws) return; // Already running

        try {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new Ctx({ sampleRate: 44100 });
            const gain = ctx.createGain();
            gain.connect(ctx.destination);

            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            // Connect to port 6082
            const ws = new WebSocket(`${protocol}${window.location.hostname}:6082`, 'binary');
            ws.binaryType = 'arraybuffer';

            ws.onmessage = (e) => {
                if (e.data instanceof ArrayBuffer) {
                    const int16 = new Int16Array(e.data);
                    const float32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

                    const buffer = ctx.createBuffer(1, float32.length, 44100);
                    buffer.getChannelData(0).set(float32);

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(gain);

                    let time = ctx.currentTime;
                    // Simple jitter buffer logic
                    if (speakerRef.current.nextTime < time || (speakerRef.current.nextTime - time) > 0.2) {
                        speakerRef.current.nextTime = time;
                    }
                    source.start(speakerRef.current.nextTime);
                    speakerRef.current.nextTime += buffer.duration;
                }
            };

            ws.onerror = (e) => {
                console.error("Audio: Speaker WS Error", e);
            };
            ws.onclose = (e) => {
                console.log("Audio: Speaker WS Closed", e.code, e.reason);
            };

            speakerRef.current = { ws, context: ctx, nextTime: 0 };
            setSpeakerActive(true);

            // Resume on interaction if needed
            if (ctx.state === 'suspended') {
                const resume = () => {
                    console.log("Audio: Resuming context on interaction");
                    ctx.resume();
                    document.removeEventListener('click', resume);
                };
                document.addEventListener('click', resume);
            }

        } catch (e) {
            console.error("Speaker Start Failed", e);
        }
    }, []);

    const stopSpeaker = useCallback(() => {
        if (speakerRef.current.ws) speakerRef.current.ws.close();
        if (speakerRef.current.context) speakerRef.current.context.close();
        speakerRef.current = { ws: null, context: null, nextTime: 0 };
        setSpeakerActive(false);
    }, []);


    // --- Mic Logic (Port 6081) ---
    const startMic = useCallback(async (deviceId?: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: true }
            });

            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new Ctx({ sampleRate: 44100 });
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(ctx.destination); // Standard requirment for script processor to run

            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const ws = new WebSocket(`${protocol}${window.location.hostname}:6081`, 'binary');
            ws.binaryType = 'arraybuffer';

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const input = e.inputBuffer.getChannelData(0);
                    const pcm = new Int16Array(input.length);
                    for (let i = 0; i < input.length; i++) {
                        let s = Math.max(-1, Math.min(1, input[i]));
                        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    ws.send(pcm.buffer);
                }
            };

            micRef.current = { ws, context: ctx, stream };
            setMicActive(true);
        } catch (e) {
            console.error("Mic Start Failed", e);
            setMicActive(false);
        }
    }, []);

    const stopMic = useCallback(() => {
        micRef.current.stream?.getTracks().forEach(t => t.stop());
        micRef.current.context?.close();
        micRef.current.ws?.close();
        micRef.current = { ws: null, context: null, stream: null };
        setMicActive(false);
    }, []);

    // Attempt to start speaker and mic on mount since default is active
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // Auto-start Speaker
        if (speakerActive) {
            timer = setTimeout(() => {
                console.log("Audio: Attempting auto-start speaker...");
                startSpeaker();
            }, 1000);
        }

        // Auto-start Mic
        if (micActive) {
            setTimeout(() => {
                console.log("Audio: Attempting auto-start mic...");
                startMic();
            }, 1000);
        }

        return () => {
            clearTimeout(timer);
            // Cleanup on unmount
            stopSpeaker();
            stopMic();
        };
    }, []); // Run once on mount


    return {
        micActive,
        speakerActive,
        startMic,
        stopMic,
        startSpeaker,
        stopSpeaker
    };
}

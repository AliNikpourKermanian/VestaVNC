import { useRef, useEffect } from "react";

interface WebRTCScreenProps {
    className?: string;
    videoRef: React.RefObject<HTMLVideoElement>;
    sendInput: (data: any) => void;
    status: string;
    error: string | null;
}

export const WebRTCScreen = ({ className, videoRef, sendInput, status, error }: WebRTCScreenProps) => {

    // --- Input Capture ---

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!videoRef.current) return;
        const rect = videoRef.current.getBoundingClientRect();

        // Scale logic provided existing resolution knowledge or dynamic
        // Assuming 1280x720 base for now, or we can send 0-1 float coords
        // backend xdotool takes pixels. 
        // Better approach: Send pixels based on assumed resolution
        const width = 1280;
        const height = 720;

        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        const x = Math.max(0, Math.min(width, (e.clientX - rect.left) * scaleX));
        const y = Math.max(0, Math.min(height, (e.clientY - rect.top) * scaleY));

        sendInput({ event_type: 'mousemove', x: Math.round(x), y: Math.round(y) });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        let btn = 1; // Left
        if (e.button === 1) btn = 2; // Middle
        if (e.button === 2) btn = 3; // Right
        sendInput({ event_type: 'mousedown', button: btn });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        let btn = 1;
        if (e.button === 1) btn = 2;
        if (e.button === 2) btn = 3;
        sendInput({ event_type: 'mouseup', button: btn });
    };

    // Keyboard handlers need global attachment or focus. 
    // Attaching to window is safest for a full screen-like app.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid blocking F5/F12 unless in full immersive mode
            if (['Tab', 'Meta', 'Alt'].includes(e.key)) e.preventDefault();
            sendInput({ event_type: 'keydown', key: e.key });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['Tab', 'Meta', 'Alt'].includes(e.key)) e.preventDefault();
            sendInput({ event_type: 'keyup', key: e.key });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [sendInput]);

    return (
        <div className={`relative flex items-center justify-center bg-black overflow-hidden ${className}`}>
            {status === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black/50 gap-2 flex-col">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Vesta WebRTC...</span>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-red-500 z-10 bg-black/80">
                    Error: {error}
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-full object-contain cursor-none"
            />
        </div>
    );
};

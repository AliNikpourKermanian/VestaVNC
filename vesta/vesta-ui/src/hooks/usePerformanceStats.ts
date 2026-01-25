import { useState, useEffect, useRef } from 'react';

export interface PerformanceStats {
    fps: number;
    memory: number; // MB
    cpu: number; // Estimated percentage
}

export const usePerformanceStats = () => {
    const [stats, setStats] = useState<PerformanceStats>({
        fps: 0,
        memory: 0,
        cpu: 0
    });

    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const lastFrameTimeRef = useRef(performance.now());

    useEffect(() => {
        let animationFrameId: number;

        const updateStats = () => {
            const now = performance.now();
            frameCountRef.current++;

            // Calculate FPS every second
            const elapsed = now - lastTimeRef.current;
            if (elapsed >= 1000) {
                const fps = Math.round((frameCountRef.current * 1000) / elapsed);

                // Get memory (Chrome only)
                let memory = 0;
                if ('memory' in performance) {
                    const perfMemory = (performance as any).memory;
                    memory = Math.round(perfMemory.usedJSHeapSize / 1048576); // Convert to MB
                }

                // Estimate CPU based on frame timing
                const frameTime = now - lastFrameTimeRef.current;
                const targetFrameTime = 16.67; // 60 FPS target
                const cpu = Math.min(100, Math.round((frameTime / targetFrameTime) * 100));

                setStats({ fps, memory, cpu });

                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }

            lastFrameTimeRef.current = now;
            animationFrameId = requestAnimationFrame(updateStats);
        };

        animationFrameId = requestAnimationFrame(updateStats);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    return stats;
};

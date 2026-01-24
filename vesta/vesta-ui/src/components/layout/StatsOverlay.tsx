import { usePerformanceStats } from '@/hooks/usePerformanceStats';
import { Activity, Cpu, HardDrive } from 'lucide-react';

export const StatsOverlay = ({ visible }: { visible: boolean }) => {
    const stats = usePerformanceStats();

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
                <div className="space-y-2 text-xs font-mono">
                    {/* FPS */}
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-green-400" />
                        <span className="text-white/60">FPS:</span>
                        <span className={`font-bold ${stats.fps >= 30 ? 'text-green-400' : stats.fps >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {stats.fps}
                        </span>
                    </div>

                    {/* Memory */}
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-3 h-3 text-blue-400" />
                        <span className="text-white/60">MEM:</span>
                        <span className="text-blue-400 font-bold">
                            {stats.memory} MB
                        </span>
                    </div>

                    {/* CPU */}
                    <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-purple-400" />
                        <span className="text-white/60">CPU:</span>
                        <span className={`font-bold ${stats.cpu < 50 ? 'text-green-400' : stats.cpu < 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {stats.cpu}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

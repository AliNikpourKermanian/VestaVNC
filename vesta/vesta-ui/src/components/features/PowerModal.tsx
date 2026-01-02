import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Power, RefreshCw, Moon, LogOut } from "lucide-react"
import { useState } from "react"

interface PowerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPowerAction: (action: string) => Promise<void>;
    onSleep: () => void;
}

export function PowerModal({ open, onOpenChange, onPowerAction, onSleep }: PowerModalProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleAction = async (action: string) => {
        setLoading(action);
        if (action === 'sleep') {
            onSleep();
            onOpenChange(false);
            setLoading(null);
            return;
        }
        await onPowerAction(action);
        // We generally don't stop loading since the system will restart/shutdown
        if (action === 'logout') {
            setLoading(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-center">Power Options</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50"
                        onClick={() => handleAction('sleep')}
                        disabled={!!loading}
                    >
                        <Moon className="w-8 h-8" />
                        <span>Sleep</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-orange-500/50 hover:text-orange-400 disabled:opacity-50"
                        onClick={() => handleAction('reboot')}
                        disabled={!!loading}
                    >
                        <RefreshCw className={`w-8 h-8 ${loading === 'reboot' ? 'animate-spin' : ''}`} />
                        <span>{loading === 'reboot' ? 'Rebooting...' : 'Reboot'}</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-yellow-500/50 hover:text-yellow-400 disabled:opacity-50"
                        onClick={() => handleAction('logout')}
                        disabled={!!loading}
                    >
                        <LogOut className="w-8 h-8" />
                        <span>Logout</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                        onClick={() => handleAction('shutdown')}
                        disabled={!!loading}
                    >
                        <Power className="w-8 h-8" />
                        <span>{loading === 'shutdown' ? 'Shutting down...' : 'Shutdown'}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

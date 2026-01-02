import { useState } from "react"
import { cn } from "@/lib/utils"
import { VncState } from "@/hooks/useVNC"
import { Wifi, WifiOff, AlertCircle, ChevronDown, Mail, Globe, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopBarProps {
    state: VncState;
    onContact: () => void;
    onWebsite: () => void;
    onInfo: () => void;
}

export function TopBar({ state, onContact, onWebsite, onInfo }: TopBarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isConnected = state.status === 'connected';
    const isError = state.status === 'disconnected' && state.error;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            {/* Main Bar */}
            <div className={cn(
                "px-4 py-1.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-4 transition-all duration-300",
                isConnected ? "bg-black/30 border-white/10" :
                    isError ? "bg-red-900/40 border-red-500/50" :
                        "bg-black/40 border-white/10"
            )}>
                {/* Brand / Menu Trigger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 group outline-none"
                >
                    <span className="text-sm font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                        VestaVNC
                    </span>
                    <ChevronDown className={cn("w-3 h-3 text-white/50 transition-transform", menuOpen && "rotate-180")} />
                </button>

                <div className="w-[1px] h-4 bg-white/10"></div>

                {/* Status Part */}
                <div className={cn(
                    "flex items-center gap-2",
                    isConnected ? "text-green-400" : isError ? "text-red-400" : "text-white/70"
                )}>
                    {isConnected ? <Wifi className="w-3 h-3" /> :
                        isError ? <AlertCircle className="w-3 h-3" /> :
                            <WifiOff className="w-3 h-3" />}

                    <span className="text-[10px] uppercase font-bold tracking-widest">
                        {isError ? "Error" :
                            state.status === 'connected' ? 'Live' :
                                state.status === 'connecting' ? 'Connecting' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Vesta Menu "Dock" */}
            {menuOpen && (
                <div className="flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:bg-white/10 text-white gap-2 px-3"
                        onClick={() => { onContact(); setMenuOpen(false); }}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs">Contact</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:bg-white/10 text-white gap-2 px-3"
                        onClick={() => { onWebsite(); setMenuOpen(false); }}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-xs">Website</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:bg-white/10 text-white gap-2 px-3"
                        onClick={() => { onInfo(); setMenuOpen(false); }}
                    >
                        <Info className="w-3.5 h-3.5" />
                        <span className="text-xs">Info</span>
                    </Button>
                </div>
            )}
        </div>
    )
}

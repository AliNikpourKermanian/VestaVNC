import { Button } from "@/components/ui/button"
import { Monitor, Clipboard, Folder, Settings, Power, Maximize, Keyboard, Info, Activity } from "lucide-react"

interface DockProps {
    onClipboard: () => void;
    onFiles: () => void;
    onSettings: () => void;
    onDisconnect: () => void;
    onFullscreen: () => void;
    onStats: () => void;
    onPassword: () => void;
    onHelp: () => void;
    passwordEnabled: boolean;
}

export function Dock({ onClipboard, onFiles, onSettings, onDisconnect, onFullscreen, onStats, onPassword, onHelp, passwordEnabled }: DockProps) {
    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 transition-all hover:scale-105">
            <Button variant="dock" size="icon" onClick={onHelp} title="Help Station" className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 mb-2">
                <div className="w-5 h-5 flex items-center justify-center">?</div>
            </Button>
            <Button variant="dock" size="icon" onClick={onClipboard} title="Clipboard">
                <Clipboard className="w-5 h-5" />
            </Button>
            {passwordEnabled && (
                <Button variant="dock" size="icon" onClick={onPassword} title="Change Password" className="text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20">
                    <div className="w-5 h-5 flex items-center justify-center">🔐</div>
                </Button>
            )}
            <Button variant="dock" size="icon" onClick={onFiles} title="Files">
                <Folder className="w-5 h-5" />
            </Button>
            <Button variant="dock" size="icon" onClick={onStats} title="Performance Stats">
                <Activity className="w-5 h-5" />
            </Button>
            <div className="w-8 h-[1px] bg-white/10 my-1"></div>
            <Button variant="dock" size="icon" onClick={onFullscreen} title="Fullscreen">
                <Maximize className="w-5 h-5" />
            </Button>
            <Button variant="dock" size="icon" onClick={onSettings} title="Settings">
                <Settings className="w-5 h-5" />
            </Button>
            <Button variant="dock" size="icon" className="bg-red-500/20 hover:bg-red-500/40 border-red-500/30" onClick={onDisconnect} title="Disconnect">
                <Power className="w-5 h-5 text-red-400" />
            </Button>
        </div>
    )
}

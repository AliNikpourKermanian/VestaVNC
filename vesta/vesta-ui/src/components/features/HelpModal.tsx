import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Keyboard, Mouse, Command, Wifi, Shield, Monitor } from "lucide-react"

interface HelpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Help Station</DialogTitle>
                    <DialogDescription>Quick guide to using Vesta.</DialogDescription>
                </DialogHeader>
                <div className="h-full overflow-y-auto pr-4">
                    <div className="space-y-6 py-4">

                        {/* Section: Controls */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Keyboard className="w-5 h-5 text-blue-400" /> Controls & Shortcuts
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white font-medium">Ctrl + Alt + Delete</span>
                                    <p className="text-xs text-white/50 mt-1">Send secure attention sequence.</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white font-medium">Clipboard Sync</span>
                                    <p className="text-xs text-white/50 mt-1">Ctrl+C / Ctrl+V works natively (on supported browsers).</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <span className="text-white font-medium">Fullscreen</span>
                                    <p className="text-xs text-white/50 mt-1">Click the maximize icon in Dock.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Features */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Command className="w-5 h-5 text-purple-400" /> Features
                            </h3>
                            <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                                <li><strong className="text-white">File Transfer:</strong> Use the Folder icon to mount USB drives or upload/download files via the browser bridge.</li>
                                <li><strong className="text-white">Audio:</strong> Microphone and Speaker are bridged automatically. Toggle in Settings.</li>
                                <li><strong className="text-white">WebRTC:</strong> Connects via UDP/TCP for near-zero latency video.</li>
                            </ul>
                        </div>

                        {/* Section: Security */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-400" /> Security
                            </h3>
                            <p className="text-sm text-white/70">
                                Enable <strong>Password Protection</strong> in Settings to secure your session.
                                Your password is encrypted and stored locally in the container.
                            </p>
                        </div>

                        {/* Section: Network */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Wifi className="w-5 h-5 text-yellow-400" /> Connection Issues?
                            </h3>
                            <p className="text-sm text-white/70 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                                If you see "Disconnected", check if the container is running properly.
                                If you are on a restrictive network, WebRTC might fall back to WebSocket (slower).
                            </p>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

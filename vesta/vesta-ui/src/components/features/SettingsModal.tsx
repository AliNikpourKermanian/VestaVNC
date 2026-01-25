import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { VncSettings } from "@/hooks/useVNC"
import { Volume2, Mic, Zap } from "lucide-react"

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: VncSettings;
    updateSettings: (s: Partial<VncSettings>) => void;
    audio: {
        active: boolean;
        toggleSpeaker: () => void;
        volume: number; // Placeholder if not implemented in hook yet
    };
    mic: {
        active: boolean; // boolean
        toggleMic: () => void;
    };
}

export function SettingsModal({ open, onOpenChange, settings, updateSettings, audio, mic }: SettingsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>Adjust connection quality and audio.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Scaling */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Scaling Mode</label>
                        <select
                            className="bg-transparent border border-white/20 rounded p-1 text-sm text-white"
                            value={settings.resize}
                            onChange={(e) => updateSettings({ resize: e.target.value as any })}
                        >
                            <option value="off">None</option>
                            <option value="scale">Local Scaling</option>
                            <option value="remote">Remote Resizing</option>
                        </select>
                    </div>

                    {/* Quality */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-foreground">Quality</label>
                            <span className="text-xs text-muted-foreground">{settings.quality}</span>
                        </div>
                        <Slider
                            value={[settings.quality]}
                            min={0} max={9} step={1}
                            onValueChange={(v) => updateSettings({ quality: v[0] })}
                        />
                    </div>

                    {/* Compression */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-foreground">Compression</label>
                            <span className="text-xs text-muted-foreground">{settings.compression}</span>
                        </div>
                        <Slider
                            value={[settings.compression]}
                            min={0} max={9} step={1}
                            onValueChange={(v) => updateSettings({ compression: v[0] })}
                        />
                    </div>



                    {/* Audio Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <label className="text-sm font-medium text-foreground">Speaker</label>
                        </div>
                        <Switch checked={audio.active} onCheckedChange={audio.toggleSpeaker} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            <label className="text-sm font-medium text-foreground">Microphone</label>
                        </div>
                        <Switch checked={mic.active} onCheckedChange={mic.toggleMic} />
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}

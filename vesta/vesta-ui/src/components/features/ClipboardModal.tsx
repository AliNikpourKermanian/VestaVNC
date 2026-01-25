import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Need to create this or use standard textarea
import { useEffect, useState } from "react"
import { Copy, Send } from "lucide-react"

interface ClipboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sendClipboard: (text: string) => void;
}

export function ClipboardModal({ open, onOpenChange, sendClipboard }: ClipboardModalProps) {
    const [text, setText] = useState("");

    // Listen for incoming clipboard events
    useEffect(() => {
        const handler = (e: any) => {
            setText(e.detail.text);
        };
        window.addEventListener('vnc-clipboard', handler);
        return () => window.removeEventListener('vnc-clipboard', handler);
    }, []);

    const handleSend = () => {
        sendClipboard(text);
        onOpenChange(false);
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white p-6 rounded-2xl shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Copy className="w-5 h-5 text-blue-400" />
                        </div>
                        <DialogTitle className="text-xl">Smart Clipboard</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        Did you know that the clipboard is <span className="text-white font-medium">smart now</span> and works native?
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-zinc-400">
                        <p>
                            You can simply use <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">Ctrl+C</kbd> and <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">Ctrl+V</kbd> seamlessly between your PC and Vesta without opening this menu.
                        </p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={() => onOpenChange(false)} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            Got it
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

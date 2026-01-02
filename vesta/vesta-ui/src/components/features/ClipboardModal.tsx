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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Clipboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Text copied in the remote desktop will appear here. Type here and click Send to paste to remote.
                    </p>
                    <textarea
                        className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type here..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleSend}>
                            <Send className="w-4 h-4 mr-2" /> Send to Remote
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

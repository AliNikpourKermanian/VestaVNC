import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Lock } from "lucide-react"

interface PasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (password: string) => Promise<void>;
    mode: 'set' | 'login';
}

export function PasswordModal({ open, onOpenChange, onSave, mode }: PasswordModalProps) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (mode === 'set' && password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 1) {
            setError("Password cannot be empty");
            return;
        }

        setLoading(true);
        try {
            await onSave(password);
            onOpenChange(false);
            setPassword("");
            setConfirm("");
        } catch (err: any) {
            setError(err.message || "Failed to save password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-400" />
                        {mode === 'set' ? "Set Password" : "Login Required"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'set'
                            ? "Set a password to protect your VestaVNC session."
                            : "Please enter your password to connect."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                type={show ? "text" : "password"}
                                placeholder={mode === 'set' ? "New Password" : "Password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10 bg-white/5 border-white/10"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShow(!show)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                            >
                                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {mode === 'set' && (
                        <div className="space-y-2">
                            <Input
                                type={show ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        {mode === 'set' && (
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? "Saving..." : (mode === 'set' ? "Set Password" : "Login")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Monitor, Mail, Globe, Info, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export type AboutView = 'contact' | 'website' | 'info';

interface AboutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    view: AboutView;
}

export function AboutModal({ open, onOpenChange, view }: AboutModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white p-0 overflow-hidden rounded-3xl">
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                {view === 'contact' && <Mail className="w-5 h-5 text-blue-400" />}
                                {view === 'website' && <Globe className="w-5 h-5 text-blue-400" />}
                                {view === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight">
                                {view === 'contact' && "Contact Support"}
                                {view === 'website' && "NetVesta Website"}
                                {view === 'info' && "System Information"}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        {view === 'contact' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        If anything critical or anything you want to get added or just say your opinion, send an email to:
                                    </p>
                                    <a
                                        href="mailto:info@netvesta.com"
                                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors block py-1"
                                    >
                                        info@netvesta.com
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>We usually respond within 24 hours.</span>
                                </div>
                            </div>
                        )}

                        {view === 'website' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        This is our website. Get the latest news about our products or even this VNC instance.
                                    </p>
                                    <Button
                                        asChild
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11"
                                    >
                                        <a href="https://www.netvesta.com" target="_blank" rel="noopener noreferrer">
                                            Visit netvesta.com
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {view === 'info' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Version</span>
                                        <span className="text-sm font-semibold">1.0.0</span>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Build</span>
                                        <span className="text-sm font-semibold">2026.01.10</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Environment</span>
                                    <span className="text-sm font-semibold">Development (VestaOS)</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

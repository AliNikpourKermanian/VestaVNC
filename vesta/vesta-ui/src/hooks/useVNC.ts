import { useEffect, useRef, useState, useCallback } from 'react';
import RFB from '@novnc/novnc/lib/rfb';

export interface VncState {
    status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
    error: string | null;
    name: string;
}

export interface VncSettings {
    quality: number;
    compression: number;
    viewOnly: boolean;
    resize: 'off' | 'scale' | 'remote';
    shared: boolean;
}

export const useVNC = (container: HTMLDivElement | null, url: string, password?: string) => {
    const rfbModel = useRef<RFB | null>(null);
    const [state, setState] = useState<VncState>({
        status: 'disconnected',
        error: null,
        name: ''
    });
    const [settings, setSettings] = useState<VncSettings>({
        quality: 6,
        compression: 2,
        viewOnly: false,
        resize: 'scale',
        shared: true
    });

    const connect = useCallback((overridePassword?: string) => {
        if (!container || !url) return;

        if (rfbModel.current) {
            rfbModel.current.disconnect();
        }

        try {
            setState(s => ({ ...s, status: 'connecting', error: null }));

            const rfb = new RFB(container, url, {
                credentials: { password: overridePassword || password || 'netvesta' },
                shared: settings.shared,
            });

            rfb.addEventListener('connect', () => {
                setState(s => ({ ...s, status: 'connected', error: null }));
                // Apply initial settings
                rfb.qualityLevel = settings.quality;
                rfb.compressionLevel = settings.compression;
                rfb.viewOnly = settings.viewOnly;
                rfb.scaleViewport = settings.resize === 'scale';
                rfb.resizeSession = settings.resize === 'remote';
            });

            rfb.addEventListener('disconnect', (e: any) => {
                setState(s => ({ ...s, status: 'disconnected', error: e.detail?.clean ? null : (e.detail?.reason || "Disconnected") }));
            });

            rfb.addEventListener('credentialsrequired', () => {
                // Handle password prompt if needed, for now we assume auto-auth or fixed password
                setState(s => ({ ...s, status: 'disconnected', error: 'Password required' }));
            });

            rfb.addEventListener('clipboard', (e: any) => {
                // Native Sync (might require focus)
                if (navigator.clipboard && e.detail.text) {
                    navigator.clipboard.writeText(e.detail.text).catch(err => {
                        console.warn("Clipboard write failed (focus?)", err);
                    });
                }
                // Expose clipboard event if needed
                window.dispatchEvent(new CustomEvent('vnc-clipboard', { detail: { text: e.detail.text } }));
            });

            rfb.addEventListener('desktopname', (e: any) => {
                setState(s => ({ ...s, name: e.detail.name }));
            });

            rfbModel.current = rfb;

        } catch (e: any) {
            setState(s => ({ ...s, status: 'disconnected', error: e.message }));
        }
    }, [url, password, container, settings.shared]); // Re-connect only on critical param changes

    const disconnect = useCallback(() => {
        rfbModel.current?.disconnect();
    }, []);

    const sendCtrlAltDel = useCallback(() => {
        rfbModel.current?.sendCtrlAltDel();
    }, []);

    const sendClipboard = useCallback((text: string) => {
        rfbModel.current?.clipboardPasteFrom(text);
    }, []);

    const updateSettings = useCallback((newSettings: Partial<VncSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...newSettings };
            if (rfbModel.current) {
                if (newSettings.quality !== undefined) rfbModel.current.qualityLevel = next.quality;
                if (newSettings.compression !== undefined) rfbModel.current.compressionLevel = next.compression;
                if (newSettings.viewOnly !== undefined) rfbModel.current.viewOnly = next.viewOnly;
                if (newSettings.resize !== undefined) {
                    rfbModel.current.scaleViewport = next.resize === 'scale';
                    rfbModel.current.resizeSession = next.resize === 'remote';
                }
            }
            return next;
        });
    }, []);

    // Auto-connect on mount if URL provided
    useEffect(() => {
        connect();

        // Native Clipboard Integration
        const handlePaste = (e: ClipboardEvent) => {
            const text = e.clipboardData?.getData('text');
            if (text && rfbModel.current) {
                rfbModel.current.clipboardPasteFrom(text);
            }
        };

        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && rfbModel.current) {
                        rfbModel.current.clipboardPasteFrom(text);
                    }
                } catch (err) {
                    // Fallback to paste event (handled above)
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            rfbModel.current?.disconnect();
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [connect]);

    return { state, disconnect, connect, sendCtrlAltDel, sendClipboard, settings, updateSettings };
};

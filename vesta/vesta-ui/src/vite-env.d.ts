/// <reference types="vite/client" />

declare module '@novnc/novnc/lib/rfb' {
    export default class RFB {
        constructor(target: HTMLElement, url: string, options?: any);
        disconnect(): void;
        sendCtrlAltDel(): void;
        clipboardPasteFrom(text: string): void;
        qualityLevel: number;
        compressionLevel: number;
        viewOnly: boolean;
        scaleViewport: boolean;
        resizeSession: boolean;
        addEventListener(event: string, handler: (e: any) => void): void;
        removeEventListener(event: string, handler: (e: any) => void): void;
    }
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Folder, File, Download, ChevronLeft, RefreshCw, Upload, HardDrive, Plug, Laptop } from "lucide-react"
import { FileEntry } from "@/hooks/useUSB"
import { useEffect, useState, useRef } from "react"

// --- Browser Bridge (File System Access API) ---

class BrowserFS {
    ws: WebSocket | null = null;
    rootHandle: FileSystemDirectoryHandle | null = null;
    isConnected = false;

    constructor(onStatus: (status: boolean) => void) {
        this.onStatus = onStatus;
    }

    onStatus: (status: boolean) => void;

    async connect(handle: FileSystemDirectoryHandle) {
        this.rootHandle = handle;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.hostname;
        // Port 6084 is hardcoded for browser bridge
        const url = `${protocol}://${host}:6084`;

        console.log("Connecting Bridge to:", url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("Bridge Connected");
            this.isConnected = true;
            this.onStatus(true);
        };

        this.ws.onclose = () => {
            console.log("Bridge Disconnected");
            this.isConnected = false;
            this.onStatus(false);
            this.ws = null;
        };

        this.ws.onerror = (e) => {
            console.error("Bridge Error:", e);
        }

        this.ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            const { id, method, path, ...args } = msg;

            try {
                let result = null;
                // Path comes as /name/sub/file.
                // We need to traverse handles.
                const relativePath = path === '/' ? '' : path.substring(1); // strip leading /

                if (method === 'GETATTR') {
                    // Check if file/dir exists
                    try {
                        const h = await this.getHandle(relativePath);
                        const kind = h.kind;
                        // Stat mock
                        result = {
                            st_mode: kind === 'directory' ? 16877 : 33188, // 0o40755 : 0o100644
                            st_size: kind === 'file' ? await (h as FileSystemFileHandle).getFile().then(f => f.size) : 4096,
                            st_mtime: Date.now() / 1000
                        };
                    } catch (e) {
                        // Not found
                        this.respond(id, { error: 'ENOENT' });
                        return;
                    }
                } else if (method === 'READDIR') {
                    const dir = await this.getHandle(relativePath) as FileSystemDirectoryHandle;
                    const entries = [];
                    // @ts-ignore
                    for await (const [name] of (dir as any).entries()) {
                        entries.push(name);
                    }
                    result = entries;
                } else if (method === 'READ') {
                    const fileHandle = await this.getHandle(relativePath) as FileSystemFileHandle;
                    const file = await fileHandle.getFile();
                    const folder = file.slice(args.offset, args.offset + args.length);
                    const buffer = await folder.arrayBuffer();
                    // Convert to Base64
                    result = this.arrayBufferToBase64(buffer);
                } else if (method === 'WRITE') {
                    const fileHandle = await this.getHandle(relativePath) as FileSystemFileHandle;
                    const writable = await fileHandle.createWritable({ keepExistingData: true });
                    // Decode
                    const data = Uint8Array.from(atob(args.data), c => c.charCodeAt(0));
                    await writable.write({ type: 'write', position: args.offset, data: data });
                    await writable.close();
                    result = data.length;
                } else if (method === 'CREATE') {
                    // Get parent
                    const parts = relativePath.split('/');
                    const name = parts.pop();
                    const parentPath = parts.join('/');
                    const parent = await this.getHandle(parentPath) as FileSystemDirectoryHandle;
                    await parent.getFileHandle(name!, { create: true });
                    result = 0;
                }

                this.respond(id, { data: result });

            } catch (e: any) {
                console.error("FS Op Error:", e);
                this.respond(id, { error: 'EIO' });
            }
        };
    }

    respond(id: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ id, ...payload }));
        }
    }

    async getHandle(path: string): Promise<FileSystemHandle> {
        if (!path || path === '' || path === '.') return this.rootHandle!;
        const parts = path.split('/').filter(p => p);
        let current: any = this.rootHandle;

        for (const part of parts) {
            // Try dir then file
            try {
                current = await current.getDirectoryHandle(part);
            } catch {
                current = await current.getFileHandle(part);
            }
        }
        return current;
    }

    arrayBufferToBase64(buffer: ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// ----------------

interface FilesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: FileEntry[];
    currentPath: string;
    loading: boolean;
    fetchFiles: (path: string) => void;
    downloadFile: (path: string) => void;
    uploadFile: (path: string, file: File) => void;
    fetchDrives: () => Promise<{ portable: any[], host: any[], internal: any[] }>;
    fetchAvailableDevices: () => Promise<{ devices: any[] }>;
    mountDevice: (device: string) => Promise<boolean>;
    unmountDevice: (device: string) => Promise<boolean>;
    error: string | null;
    baseUrl: string;
}

export function FilesModal({ open, onOpenChange, files, currentPath, loading, fetchFiles, downloadFile, uploadFile, fetchDrives, fetchAvailableDevices, mountDevice, unmountDevice, error, baseUrl }: FilesModalProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [drives, setDrives] = useState<{ portable: any[], host: any[], internal: any[] }>({ portable: [], host: [], internal: [] });
    const [available, setAvailable] = useState<any[]>([]);

    // Bridge State
    const [bridgeStatus, setBridgeStatus] = useState(false);
    const bridgeRef = useRef<BrowserFS | null>(null);

    // Initial load
    useEffect(() => {
        if (open) {
            fetchFiles(currentPath);
            loadDrives();
        }
    }, [open]);

    const loadDrives = async () => {
        const d = await fetchDrives();
        const a = await fetchAvailableDevices();
        setDrives(d);
        setAvailable(a.devices || []);
    };

    const handleMount = async (deviceParams: any) => {
        const success = await mountDevice(deviceParams.name);
        if (success) loadDrives();
    };

    const handleUnmount = async (device: any) => {
        const success = await unmountDevice(device.name);
        if (success) loadDrives();
    };

    const handleMountLocal = async () => {
        try {
            // @ts-ignore
            const handle = await window.showDirectoryPicker();
            if (!bridgeRef.current) {
                bridgeRef.current = new BrowserFS(setBridgeStatus);
            }
            await bridgeRef.current.connect(handle);
        } catch (e) {
            console.error("Mount failed:", e);
            alert("Mount failed or cancelled.");
        }
    };

    const goBack = () => {
        if (currentPath === '/root' || currentPath === '/') return;
        const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/root';
        fetchFiles(parent);
    }

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(currentPath, e.target.files[0]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Files & Drives</DialogTitle>
                </DialogHeader>

                <input type="file" ref={fileInput} className="hidden" onChange={handleUpload} />

                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex bg-secondary/50 rounded-lg p-1 items-center flex-1">
                        <Button variant="ghost" size="icon" onClick={goBack} disabled={currentPath === '/root'}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <code className="text-xs flex-1 truncate text-muted-foreground px-2">{currentPath}</code>
                        <Button variant="ghost" size="icon" onClick={() => fetchFiles(currentPath)}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Upload
                    </Button>
                    <Button
                        variant={bridgeStatus ? "default" : "outline"}
                        size="sm"
                        onClick={handleMountLocal}
                        className={bridgeStatus ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        <Laptop className="w-4 h-4 mr-2" />
                        {bridgeStatus ? "Local Drive Active" : "Mount Local Drive"}
                    </Button>
                </div>

                <div className="flex gap-4 flex-1 overflow-hidden">
                    {/* Sidebar / Drive List */}
                    <div className="w-1/3 border-r border-white/10 pr-2 overflow-y-auto space-y-6">

                        {/* Connected/Mounted */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Connected</h4>
                            <div className="space-y-1">
                                {drives.internal.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer text-sm" onClick={() => fetchFiles(d.mountpoint)}>
                                        <HardDrive className="w-4 h-4 text-blue-400" />
                                        <span className="truncate">{d.label}</span>
                                    </div>
                                ))}
                                {/* Browser Mount Entry (Virtual) */}
                                <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer text-sm" onClick={() => fetchFiles('/mnt/browser')}>
                                    <Laptop className={`w-4 h-4 ${bridgeStatus ? 'text-green-400' : 'text-gray-600'}`} />
                                    <span className="truncate">Browser Bridge (/mnt/browser)</span>
                                </div>
                                {drives.host.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 border border-white/5 group">
                                        <div className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1" onClick={() => fetchFiles(d.mountpoint)}>
                                            <HardDrive className="w-4 h-4 text-green-400" />
                                            <span className="truncate text-sm">{d.label}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={(e) => { e.stopPropagation(); handleUnmount(d); }}
                                            title="Disconnect Drive"
                                        >
                                            <Plug className="w-3 h-3 rotate-45" />
                                        </Button>
                                    </div>
                                ))}
                                {drives.portable.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 border border-white/5 group">
                                        <div className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1" onClick={() => fetchFiles(d.mountpoint)}>
                                            <HardDrive className="w-4 h-4 text-purple-400" />
                                            <span className="truncate text-sm">{d.label}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={(e) => { e.stopPropagation(); handleUnmount(d); }}
                                            title="Unmount Drive"
                                        >
                                            <Plug className="w-3 h-3 rotate-45" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Available to Connect */}
                        {available.filter(d => !d.mounted && !drives.host.some(h => h.name === d.name)).length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Available to Mount</h4>
                                <div className="space-y-1">
                                    {available.filter(d => !d.mounted && !drives.host.some(h => h.name === d.name)).map((d, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Plug className="w-4 h-4 text-gray-400" />
                                                <span className="truncate text-xs text-gray-300" title={d.label}>{d.label}</span>
                                            </div>
                                            <Button variant="secondary" size="xs" className="h-6 text-[10px]" onClick={() => handleMount(d)}>Connect</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto border border-white/10 rounded-md bg-black/20">
                        {files.map((file, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors border-b last:border-0 border-white/5 cursor-pointer group"
                                onClick={() => file.isDir && fetchFiles(file.path)}
                            >
                                <div className="flex items-center gap-3">
                                    {file.isDir ? <Folder className="w-5 h-5 text-blue-400" /> : <File className="w-5 h-5 text-gray-400" />}
                                    <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-16 text-right whitespace-nowrap">{file.size}</span>
                                    {!file.isDir && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { e.stopPropagation(); downloadFile(file.path); }}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {files.length === 0 && !loading && (
                            <div className="p-8 text-center text-muted-foreground text-sm">Empty directory</div>
                        )}
                    </div>
                </div>

                <div className="p-2 border-t border-white/10 text-[10px] text-muted-foreground flex justify-between items-center bg-black/40">
                    <span>API: <code className="bg-black/40 px-1 rounded">{baseUrl}</code></span>
                    {error && <span className="text-red-400 font-bold bg-red-950/30 px-2 py-1 rounded">Error: {error}</span>}
                </div>
            </DialogContent>
        </Dialog>
    )
}


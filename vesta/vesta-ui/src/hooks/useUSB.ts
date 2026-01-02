import { useState, useCallback } from 'react';

export interface FileEntry {
    name: string;
    isDir: boolean;
    size: string;
    path: string;
}

export const useUSB = (baseUrl: string = '/api') => {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [currentPath, setCurrentPath] = useState('/root/Desktop');
    const [loading, setLoading] = useState(false);
    const [usbEnabled, setUsbEnabled] = useState(false);
    const [autoMount, setAutoMount] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            // Note: vite proxy should map /api to port 6083
            const res = await fetch(`${baseUrl}/files?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error(`Fetch failed: ${res.statusText} (${res.status})`);
            const data = await res.json();
            setFiles(data.map((f: any) => ({ ...f, path: `${path}/${f.name}` })));
            setCurrentPath(path);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Unknown error");
            setFiles([]); // Clear on error
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/settings`);
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            setUsbEnabled(data.usb_passthrough);
            setAutoMount(data.auto_mount);
        } catch (e: any) {
            console.error(e);
            // Don't set error here to avoid blocking main UI if just settings fail
        }
    }, [baseUrl]);

    const toggleUsb = useCallback(async (enabled: boolean) => {
        try {
            await fetch(`${baseUrl}/settings`, {
                method: 'POST',
                body: JSON.stringify({ usb_passthrough: enabled })
            });
            setUsbEnabled(enabled);
        } catch (e) { console.error(e); }
    }, [baseUrl]);

    const toggleAuto = useCallback(async (enabled: boolean) => {
        try {
            await fetch(`${baseUrl}/settings`, {
                method: 'POST',
                body: JSON.stringify({ auto_mount: enabled })
            });
            setAutoMount(enabled);
        } catch (e) { console.error(e); }
    }, [baseUrl]);

    const downloadFile = (path: string) => {
        window.open(`${baseUrl}/download?path=${encodeURIComponent(path)}`, '_blank');
    };

    const uploadFile = async (path: string, file: File) => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/upload?path=${encodeURIComponent(path)}`, {
                method: 'POST',
                headers: {
                    'X-File-Name': file.name,
                    'Content-Type': 'application/octet-stream'
                },
                body: file
            });
            if (!res.ok) throw new Error("Upload failed");
            await fetchFiles(path); // Refresh
        } catch (e: any) {
            console.error("Upload failed", e);
            setError(`Upload Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrives = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/usbs`);
            if (!res.ok) throw new Error("Failed to fetch drives");
            return await res.json();
        } catch (e: any) {
            console.error(e);
            setError(`Drive Error: ${e.message}`);
            return { portable: [], host: [], internal: [] };
        }
    }, [baseUrl]);

    const fetchAvailableDevices = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/list_usb_devices`);
            if (!res.ok) throw new Error("Failed to fetch devices");
            return await res.json();
        } catch (e: any) {
            console.error(e);
            return { devices: [] };
        }
    }, [baseUrl]);

    const mountDevice = async (device: string) => {
        try {
            const res = await fetch(`${baseUrl}/mount_usb?device=${encodeURIComponent(device)}`);
            if (!res.ok) throw new Error("Failed to mount");
            await fetchFiles(currentPath); // Refresh files if successful
            return true;
        } catch (e: any) {
            console.error(e);
            setError(`Mount Error: ${e.message}`);
            return false;
        }
    };

    const unmountDevice = async (device: string) => {
        try {
            const res = await fetch(`${baseUrl}/unmount_usb?device=${encodeURIComponent(device)}`);
            if (!res.ok) throw new Error("Failed to unmount");
            await fetchFiles(currentPath);
            return true;
        } catch (e: any) {
            console.error(e);
            setError(`Unmount Error: ${e.message}`);
            return false;
        }
    };

    return {
        files,
        currentPath,
        loading,
        usbEnabled,
        autoMount,
        error,
        baseUrl,
        fetchFiles,
        fetchSettings,
        toggleUsb,
        toggleAuto,
        downloadFile,
        uploadFile,
        fetchDrives,
        fetchAvailableDevices,
        mountDevice,
        unmountDevice
    };
};

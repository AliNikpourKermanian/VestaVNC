# VestaVNC USB Mount Guide

## How USB Mounting Works

VestaVNC now **automatically detects and mounts USB drives** when the container starts.

### Where to Find Your USB Drives

Inside the VNC desktop, USB drives are mounted at:
```
/media/USB_DRIVE/
```

There's also a desktop shortcut called **"USB Drive"** for easy access.

---

## Two Methods for USB Access

### Method 1: WSL Mounted Drives (Recommended for Windows)

If you're using WSL on Windows:
1. Plug in your USB drive
2. Windows will auto-mount it (e.g., as E:)
3. In WSL, it appears at `/mnt/e`
4. VestaVNC will create a symlink: `/media/USB_DRIVE/drive_e` → `/mnt/e`

**No manual mounting needed!**

### Method 2: Direct Device Mounting (Linux/Real USB)

For actual USB block devices:
1. Plug in USB drive
2. Container auto-detects devices like `/dev/sdb1`
3. Automatically mounts to `/media/USB_DRIVE/sdb1`
4. Supports NTFS, FAT32, exFAT

---

## Testing USB Detection

### Check what's detected:
```bash
# Inside the VNC desktop, open a terminal and run:
ls -la /media/USB_DRIVE/

# Check mounted devices:
mount | grep USB_DRIVE

# Check available block devices:
lsblk
```

---

## Troubleshooting

### "No USB drives found"
1. Make sure the container is run with `--privileged` and `-v /dev:/dev`
2. Check if USB is detected on host:
   ```bash
   # In WSL:
   ls /mnt/
   
   # Should show: c d e f ... (where d, e, f might be USB drives)
   ```

### "Permission denied"
- The auto-mount script sets `chmod 777` on all mount points
- If still denied, restart the container

### "Drive not showing"
1. Check container logs: `docker logs vestavnc`
2. Manually mount inside container:
   ```bash
   # In VNC terminal:
   sudo mount /dev/sdb1 /media/USB_DRIVE/usb1
   ```

---

## Manual Mounting (Advanced)

If auto-mount fails, you can manually mount inside the VNC desktop:

```bash
# List available devices
lsblk

# Create mount point
sudo mkdir -p /media/my_usb

# Mount the device (replace sdb1 with your device)
sudo mount -t ntfs-3g /dev/sdb1 /media/my_usb

# Or for FAT32/exFAT:
sudo mount /dev/sdb1 /media/my_usb

# Set permissions
sudo chmod 777 /media/my_usb
```

---

## File Transfer Workflow

### Upload to Container:
1. Double-click "USB Drive" on desktop
2. Open your USB drive folder (e.g., `drive_e` or `sdb1`)
3. Copy files to VNC desktop or any folder

### Download from Container:
1. Copy files to `/media/USB_DRIVE/drive_e/` (or your USB mount)
2. Files appear on your physical USB drive
3. Safely eject USB when done

---

## Requirements

For USB mounting to work, the container must be started with:
```bash
docker run --privileged -v /dev:/dev -v /mnt:/mnt ...
```

These flags are already included in `build_and_run.sh`.

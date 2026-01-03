#!/bin/bash

# VestaVNC Universal Run Script
# Works on Linux, WSL, and macOS
# USES LOCAL FILES (Hot-Swap) -> No Rebuild Needed for script changes!

echo "---------------------------------------------------"
echo "  VestaVNC Universal Launcher"
echo "---------------------------------------------------"

# 1. Check for Docker Image
if [[ "$(docker images -q vesta-vnc 2> /dev/null)" == "" ]]; then
  echo "Image 'vesta-vnc' not found. Attempting to build..."
  ./build_and_run.sh
  exit $?
fi

# 2. USB / Drive Detection (Host Side)
# 2. USB / Drive Detection (Host Side)
# Use arrays for proper argument handling (fixes quoting issues)
MOUNT_ARGS=()
echo "Scanning host for drives..."

# Linux / macOS common mount points
if [ -d "/media" ]; then MOUNT_ARGS+=(-v "/media:/media"); echo "  + Added /media"; fi
if [ -d "/run/media" ]; then MOUNT_ARGS+=(-v "/run/media:/run/media"); echo "  + Added /run/media"; fi
if [ -d "/Volumes" ]; then MOUNT_ARGS+=(-v "/Volumes:/Volumes"); echo "  + Added /Volumes"; fi

# WSL Detection & Auto-Mounting (The "Real OS" feel)
if grep -q microsoft /proc/version 2>/dev/null; then
    echo "  ! WSL Detected."
    
    # 2.1 Auto-Mount Unmounted Windows Drives (D-Z)
    echo "  ! Scanning for unmounted Windows drives..."
    # We check if a drive letter exists in Windows cmd.exe, then mount it in WSL
    for drive in {d..z}; do
        # Use cmd.exe to check if Drive:\ exists (fast check)
        # We assume cmd.exe is in path or /mnt/c/Windows/System32/cmd.exe
        if /mnt/c/Windows/System32/cmd.exe /c "if exist ${drive}:\\ (exit 0) else (exit 1)" 2>/dev/null; then 
             if [ ! -d "/mnt/${drive}" ] && [ ! -d "/mnt/${drive^}" ]; then
                 echo "  + Found Windows Drive ${drive^}:. Mounting to /mnt/${drive}..."
                 sudo mkdir -p "/mnt/${drive}"
                 sudo mount -t drvfs "${drive^}:" "/mnt/${drive}"
             fi
        fi
    done

    MOUNT_ARGS+=(-v "/mnt:/.host_raw")
    echo "  + Added /mnt (Access Windows drives at /mnt/c, /mnt/d, etc.)"
    
else
    # Non-WSL Linux: Just mount /mnt if it exists
    if [ -d "/mnt" ]; then MOUNT_ARGS+=(-v "/mnt:/.host_raw"); fi
fi

# 3. Hot-Swap Arguments (Mount local scripts into container)
# This allows testing 'start.sh' and 'usb_manager.py' changes WITHOUT rebuilding!
HOST_DIR=$(pwd)
# Use array to safely handle paths with spaces if needed
SWAP_ARGS=(-v "$HOST_DIR/start.sh:/start.sh" -v "$HOST_DIR/usb_manager.py:/usb_manager.py")

# 4. Run Container
echo "---------------------------------------------------"
echo "Starting Container..."
echo "Hot-swapping local scripts (No Rebuild Required)"
echo "---------------------------------------------------"

# Note: "winpty" might be needed for interactive TTY on some Windows Bash setups, 
# but usually plain docker run works in WSL2.
docker run --rm -it \
  --privileged \
  --shm-size=4g \
  --memory=4g \
  -v /dev:/dev \
  "${MOUNT_ARGS[@]}" \
  "${SWAP_ARGS[@]}" \
  -p 6080:6080 \
  -p 6081:6081 \
  -p 6082:6082 \
  -p 6083:6083 \
  -p 6084:6084 \
  vesta-vnc
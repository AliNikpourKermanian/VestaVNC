#!/bin/bash

# Set password for VNC
mkdir -p ~/.vnc
echo "${VNC_PASSWORD:-netvesta}" | vncpasswd -f > ~/.vnc/passwd
chmod 0600 ~/.vnc/passwd

# KDE Plasma xstartup for VNC
cat > ~/.vnc/xstartup <<EOF
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# Start D-Bus
export $(dbus-launch)

# Start KDE Plasma
exec startplasma-x11
EOF
chmod +x ~/.vnc/xstartup

# Cleanup locks and ensure X11 directory exists
rm -rf /tmp/.X11-unix /tmp/.X*-lock /tmp/.X1-lock
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix

# Start VNC server (Optimized to 16-bit to prevent CPU starvation)
echo "Starting VNC server..."
vncserver -kill :1 2>/dev/null || true
vncserver :1 -geometry 1280x720 -depth 16 -localhost no -SecurityTypes VncAuth

# --- PULSEAUDIO (Protected) ---
echo "Starting PulseAudio (Root Optimized)..."
pulseaudio -k 2>/dev/null || true

# Force system mode or root-user mode carefully
if id -u pulse >/dev/null 2>&1; then
    pulseaudio -D --system --disallow-exit --disallow-module-loading=0
else
    # Fallback to standard root mode with --system=false but no exiting
    pulseaudio -D --exit-idle-time=-1 --disallow-exit --disallow-module-loading=0 --system=false --realtime=false
fi

# Wait for PulseAudio to create a socket
echo "Waiting for PulseAudio socket..."
PULSE_SOCKET=""
for i in {1..15}; do
    for f in /var/run/pulse/native /run/user/$(id -u)/pulse/native /tmp/pulse-*/native; do
        if [ -S $(ls $f 2>/dev/null | head -n 1) ]; then
            PULSE_SOCKET=$(ls $f 2>/dev/null | head -n 1)
            break 2
        fi
    done
    sleep 1
done

if [ -n "$PULSE_SOCKET" ]; then
    export PULSE_SERVER=unix:$PULSE_SOCKET
    echo "PulseAudio socket found at $PULSE_SOCKET"
    chmod 777 "$PULSE_SOCKET" 2>/dev/null || true
else
    echo "WARNING: PulseAudio socket not found! Audio will likely fail."
fi

mkdir -p ~/.config/pulse
echo "default-server = $PULSE_SERVER" > ~/.config/pulse/client.conf

# Load Null Sinks
echo "Configuring Audio Sinks..."
pactl load-module module-null-sink sink_name=VNC_Mic sink_properties=device.description="VNC_Microphone_Input" || true
pactl set-default-source VNC_Mic.monitor 2>/dev/null || true
pactl load-module module-null-sink sink_name=VNC_Speaker sink_properties=device.description="VNC_Speaker_Output" || true
pactl set-default-sink VNC_Speaker 2>/dev/null || true

# Verification Loop
for i in {1..5}; do
    if pactl list sinks short | grep -q "VNC_Speaker"; then
        echo "Audio Sinks verified."
        break
    fi
    echo "Waiting for Sinks..."
    sleep 1
done

# Diagnostic info to logs
pactl info 2>/dev/null | head -n 5
pactl list sinks short 2>/dev/null

echo "Starting Audio Bridges (60ms Latency + Fork)..."
# Using -d -d for socat debugging in logs
# Added ',fork' to allow websockify to reconnect and multiple connections
socat -d -d TCP-LISTEN:5921,reuseaddr,fork,bind=127.0.0.1 EXEC:"/usr/bin/pacat --device=VNC_Mic --format=s16le --rate=44100 --channels=1 --latency-msec=60" 2>&1 | stdbuf -oL sed 's/^/[Socat-Mic] /' &
websockify 6081 127.0.0.1:5921 &

socat -d -d TCP-LISTEN:5922,reuseaddr,fork,bind=127.0.0.1 EXEC:"/usr/bin/parec --device=VNC_Speaker.monitor --format=s16le --rate=44100 --channels=1 --latency-msec=60" 2>&1 | stdbuf -oL sed 's/^/[Socat-Speaker] /' &
websockify 6082 127.0.0.1:5922 &

pactl set-sink-mute VNC_Speaker 0 2>/dev/null || true
pactl set-sink-volume VNC_Speaker 100% 2>/dev/null || true

# Routing Loop (Reduced frequency to save CPU)
(
    while true; do
        pactl list sink-inputs short 2>/dev/null | awk '{print $1}' | while read -r id; do
            pactl move-sink-input "$id" VNC_Speaker 2>/dev/null
        done
        sleep 5
    done
) &
# --- END AUDIO SECTION ---

# --- USB AUTO-MOUNT SECTION ---
echo "Detecting and mounting USB drives..."

# Create mount point
mkdir -p /media/USB_DRIVE
chmod 777 /media/USB_DRIVE

# Function to detect and mount USB drives
mount_usb() {
    # Clear any existing/persistent symlinks to ensure clean state
    rm -rf /media/USB_DRIVE
    
    # Auto-mounting disabled in favor of manual control via usb_manager.py
    echo "Auto-mount disabled. Use File Manager to mount drives."
}

# Mount USB drives
mount_usb

# Create desktop shortcut for USB access
if [ -d "/media/USB_DRIVE" ]; then
    mkdir -p ~/Desktop
    cat > ~/Desktop/USB_Drive.desktop <<EOF
[Desktop Entry]
Type=Link
Name=USB Drive
Icon=folder-cloud
URL=/media/USB_DRIVE
Comment=Access your USB drives and files
EOF
    chmod +x ~/Desktop/USB_Drive.desktop
fi

echo "USB mounting complete. Check /media/USB_DRIVE"

# Start USB / File Manager
echo "Starting File Manager on port 6083..."
python3 /usb_manager.py &

# Start Vesta
echo "Starting Vesta on port 6080..."
/vesta/utils/novnc_proxy --vnc 127.0.0.1:5901 --listen 0.0.0.0:6080 --web /vesta &
NOVNC_PID=$!

echo "-------------------------------------------------------"
echo "READY! Use: http://localhost:6080/vnc.html"
echo "-------------------------------------------------------"

wait $NOVNC_PID
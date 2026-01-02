#!/bin/bash
echo "=========================================="
echo "      AUDIO DEBUG DIAGNOSTIC TOOL"
echo "=========================================="
echo ""

echo "[1] Checking PulseAudio Daemon..."
if pgrep -x "pulseaudio" > /dev/null; then
    echo "OK: PulseAudio is running (PID: $(pgrep -x pulseaudio))"
else
    echo "ERROR: PulseAudio is NOT running!"
    exit 1
fi
echo ""

echo "[2] Listing Sinks (Output Devices)..."
pactl list sinks short
echo ""
echo "Default Sink: $(pactl get-default-sink)"
echo ""

echo "[3] Listing Sources (Input Devices)..."
pactl list sources short
echo ""

echo "[4] Testing Audio Capture from 'VNC_Speaker.monitor'..."
echo "    Recording 3 seconds of audio. Please play something in Firefox NOW..."
rm -f /tmp/debug_audio.raw
timeout 3s parec --device=VNC_Speaker.monitor --format=s16le --rate=44100 --channels=1 /tmp/debug_audio.raw

BYTES=$(stat -c%s /tmp/debug_audio.raw 2>/dev/null || echo 0)
echo ""
if [ "$BYTES" -gt 0 ]; then
    echo "SUCCESS: Captured $BYTES bytes of audio data."
    echo "Backend is working correctly. The issue is likely in the Browser or WebSocket connection."
else
    echo "FAILURE: Captured 0 bytes."
    echo "The Speaker Sink is empty. Applications might not be sending audio to 'VNC_Speaker'."
fi
echo "=========================================="
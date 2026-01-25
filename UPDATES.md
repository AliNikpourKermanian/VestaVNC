# VestaVNC Updates

## Latest Changes (Last 24 Hours)

### 🔊 Audio Enhancements
- **Microphone Enabled by Default**: The microphone is now active immediately upon connection, removing the need to manually toggle it.
- **Microphone & Speaker**: Both audio channels are initialized automatically.

### ⚙️ Configuration & Deployment (Selkies Compatibility)
- **Runtime Arguments**: The container now accepts standard flags for easy configuration:
  - `--toolkit-disable`: Hides the sidebar/dock.
  - `--name-vnc="My Vesta"`: Sets the browser tab title.
  - `--SecurityTypes=None`: Explicitly disables security types (handled internally).
  - `--basic-mode`: Hides the Dock and Top Bar (Clipboard **Enabled**).
  - `--secure-mode`: **[NEW]** Hides the Dock and Top Bar AND **Disables Clipboard** (for high security).
  - `--password-user="mysecret"`: Sets the system password for the `root` user (default: `vestavnc`).
- **Simplified Execution**: `start.sh` is now the Docker `ENTRYPOINT`, allowing direct flag passing to `docker run`.
- **System Passwords**: `root` and `vesta` user passwords are automatically set to `vestavnc` (configurable via env vars).

### 🖥️ Display & Resizing
- **Remote Resizing Default**: Scaling is now set to 'Remote' by default for all modes, ensuring the container resolution adapts to the browser window.

### 📋 Smart Clipboard
- **Native Experience**: Clipboard now works bi-directionally using native browser events.
  - **PC to Vesta**: Just press `Ctrl+V` or use "Paste" in the VNC window. Focus sync ensures content is ready.
  - **Vesta to PC**: Text copied inside the VNC session is automatically written to your local clipboard.
- **Informational UI**: The clipboard modal now simply informs users of this native capability.

### 🔐 Authentication
- **Password-Free Access**: VNC password authentication has been completely removed for instant access.
- **Login Screen Removed**: The UI no longer prompts for a VNC password on connect.

### 🎨 UI/UX Polish
- **Help Station Removed**: The help button and modal have been removed to de-clutter the interface.
- **Toggle Visibility**: Active toggles (Settings) are now brighter (Blue) for better visibility.
- **General Cleanup**: Removed unused code and cleaner component structure.

---

## Previous Updates (Last 4 Days)

### 📹 WebRTC Integration
- **Low Latency Streaming**: Integrated `webrtc_streamer` for high-performance video.
- **GStreamer Pipeline**: Optimized pipeline for screen capture.

### 📂 File System & USB
- **Browser-Based Mounting**: Drives can be mounted directly via the browser interface.
- **File Manager**: Upload and download files between your PC and the Vesta container.

### 📊 Performance Stats
- **Overlay**: Added a real-time stats overlay (toggleable via Dock) showing FPS, bandwidth, and latency.

### 🛠️ Backend
- **Rebranded**: Fully transitioned from noVNC references to VestaVNC.
- **Python Hooks**: Added `usb_manager.py` and `browser_mount.py` for backend feature support.

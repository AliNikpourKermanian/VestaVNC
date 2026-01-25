# VestaVNC Updates

## Latest Changes (Today)

### 🚀 New Features

*   **Smart Clipboard (Native)**: 
    *   Fully bi-directional clipboard synchronization.
    *   **PC -> VNC**: Copy on PC, click VNC window -> Syncs automatically.
    *   **VNC -> PC**: Select text in VNC -> Syncs to PC.
    *   **Ctrl+V Fallback**: Robust native pasting support.
*   **Auto-Audio**: Speaker enabled by default.
*   **Authentication Removed**: 
    *   No login screen.
    *   System passwords set to `vestavnc`.

### ⚡ Improvements

*   **UI Polish**: Brightened toggles, cleaner layouts.
*   **Help Station**: Removed (Simplified experience).

---

## 📅 Previous Updates (Last 4 Days)

### 🎥 Core Technology
*   **WebRTC Integration (Zero Latency)**: 
    *   Implemented GStreamer-based video pipeline for <100ms latency.
    *   Added visual "Connecting..." indicators and error handling.
    *   Seamless switching between WebSocket and WebRTC modes.

### 💾 Storage & Files
*   **Files & Drive Management**:
    *   **Settings -> Files**: New UI to manage container files.
    *   **Browser Bridge**: Mount local files directly into the container via browser API.
    *   **Windows Drive Auto-Mount**: Automatically detects and mounts local drives (C:, D:) in WSL environments.
    *   **Upload/Download**: Direct file transfer between Host and Vesta.

### � Monitoring & Tools
*   **Performance Stats Overlay**:
    *   Real-time CPU, RAM, and Network usage graphs.
    *   Toggleable via the new Dock "Activity" icon.
*   **Floating Dock**:
    *   Centralized control for all Vesta features (Fullscreen, Settings, Files, Power).
    *   Glassmorphism design for premium feel.

### 🎨 UI/UX Overhaul
*   **Rebranding**: Renamed from noVNC to VestaVNC (Title, Favicon, Assets).
*   **Modern Aesthetics**: 
    *   Dark Mode by default.
    *   SF Pro / Inter font stack.
    *   Vibrant, high-contrast, accessible colors.

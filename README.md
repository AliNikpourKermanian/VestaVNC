# 🚀 VestaVNC

> **A containerized VNC desktop environment with modern web UI, real-time audio streaming, and intelligent USB/drive management.**

Welcome to VestaVNC! This project brings the power of a full Linux desktop environment to your browser, wrapped in a sleek, modern interface inspired by macOS design principles. Whether you're learning about containerization, remote desktop protocols, or just need a portable development environment, VestaVNC has you covered.

*Be aware in order to use microphone you need run this code/docker image on localhost or run it under https protocol*

---

## 📖 Table of Contents

- [What is VestaVNC?](#-what-is-vestavnc)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Pre-Built Images](#-option-1-pre-built-images-easiest)
  - [Build From Source](#-option-2-build-from-source)
- [How It Works](#-how-it-works)
- [License](#-license)
- [Author](#-author)

---

## 🎯 What is VestaVNC?

VestaVNC is a **web-based virtual desktop environment** that runs entirely in Docker containers. It combines:

- **Full Linux Desktop**: KDE Plasma desktop environment running on Ubuntu
- **Browser Access**: No VNC client needed - connect via any modern web browser
- **Real-time Audio**: Bidirectional audio streaming (microphone input + speaker output)
- **File Management**: Upload/download files with drag-and-drop simplicity
- **USB & Drive Management**: Manual, on-demand mounting of host drives
- **Modern UI**: React-based interface with Tailwind CSS and Shadcn UI components

Think of it as your personal Linux workstation that follows you anywhere, accessible from a single URL.

---

## ✨ Features

### 🖥️ **Full Desktop Experience**
- KDE Plasma desktop environment optimized for VNC performance
- TigerVNC server with WebSocket support via Vesta Client
- 16-bit color depth for reduced bandwidth and CPU usage
- Clipboard synchronization between host and container

### 🎵 **Real-Time Audio**
- PulseAudio server with virtual sinks
- Microphone input forwarding (VNC_Mic)
- Speaker output capture (VNC_Speaker)
- WebSocket-based streaming via Websockify + Socat
- ~60ms latency for near-live audio experience

### 📁 **Intelligent File & Drive Management**
- **Manual Drive Mounting**: Host drives remain hidden until you explicitly connect them
- **Multi-source Support**: Works with WSL drives, Docker Desktop mounts, and physical USB devices
- **Drag-and-Drop Uploads**: Modern file upload interface
- **Direct Downloads**: Single-click file downloads from the container
- **Safe Paths**: Restricted access to approved directories only

### 🎨 **Beautiful, Modern UI**
- Dark mode interface with glassmorphism effects
- Inspired by macOS Big Sur / Monterey aesthetics
- Responsive design that works on desktop and tablets
- Smooth animations and transitions
- Custom icon set with visual feedback

### 🔧 **Developer-Friendly**
- Hot-swappable scripts (no rebuild needed for `start.sh` or `usb_manager.py` changes)
- Complete TypeScript support in the frontend
- Modular component architecture
- Detailed logging and debug endpoints

---

## 🛠️ Technology Stack

VestaVNC is built on a carefully selected stack of modern, proven technologies:

### **Backend & Infrastructure**

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Docker** | Containerization | Ensures consistent environments across all platforms (Windows, macOS, Linux) |
| **Ubuntu 22.04 LTS** | Base OS | Stable, well-supported, extensive package ecosystem |
| **TigerVNC** | VNC Server | Lightweight, high-performance VNC implementation |
| **Vesta** | WebSocket VNC Client | Allows browser-based VNC access without plugins |
| **KDE Plasma** | Desktop Environment | Modern, feature-rich desktop with excellent VNC support |
| **PulseAudio** | Audio Server | Industry-standard Linux audio with flexible routing |
| **Websockify** | WebSocket Proxy | Bridges TCP connections to WebSockets for browser compatibility |
| **Socat** | Audio Bridge | Routes PulseAudio streams to TCP sockets for WebSocket forwarding |
| **Python 3** | Backend API | Powers the USB/file management API server |

### **Frontend**

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **React 18** | UI Framework | Component-based architecture, excellent ecosystem |
| **TypeScript** | Type Safety | Catches bugs at compile-time, improves maintainability |
| **Vite** | Build Tool | Lightning-fast dev server and optimized production builds |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid, consistent styling |
| **Shadcn UI** | Component Library | Pre-built, customizable components with accessibility |
| **Lucide Icons** | Icon Set | Beautiful, consistent icons with React support |

### **Development Tools**

- **PowerShell / Bash**: Cross-platform scripting for build automation
- **WSL2**: Windows Subsystem for Linux for seamless development on Windows
- **Git**: Version control and collaboration

---

### Key Design Decisions

1. **Hidden Mounts Strategy**: Host drives are mounted to `/.host_raw` instead of being immediately visible. This prevents accidental access and gives users explicit control over what's mounted.

2. **Multi-Port Architecture**: Each service gets its own port to avoid conflicts and enable independent scaling/debugging.

3. **Hot-Swappable Scripts**: `start.sh` and `usb_manager.py` are volume-mounted from the host, allowing rapid iteration without container rebuilds.

4. **Stateless Backend**: The Python API server is stateless, using in-memory sets to track mounted paths (survives for container lifetime).

5. **Optimized VNC Settings**: 16-bit color depth and disabled compositing reduce CPU/bandwidth usage significantly.

---

## 🚀 Getting Started

### 📦 Option 1: Pre-Built Images (Easiest!)

The fastest way to try VestaVNC is using our pre-built Docker images:

#### **Via Docker Hub (Pre-made Image)**
The easiest way to get started is to pull our pre-made image:

```bash
docker pull alinikpourkermanian/vestavnc:latest
docker run -it --rm --privileged \
  -p 6080:6080 -p 6081:6081 -p 6082:6082 -p 6083:6083 -p 6084:6084 \
  -v /dev:/dev \
  alinikpourkermanian/vestavnc:latest
```

Then open your browser to: **http://localhost:6080/vnc.html** (Default Password: `netvesta`)

#### **Via NetVesta.com**
Visit [www.netvesta.com](https://www.netvesta.com) for:
- **Hosted Demo**: Try VestaVNC instantly without installing anything
- **One-Click Deployment**: Deploy to your cloud provider
- **Pre-configured Instances**: Ready-to-use VestaVNC with popular dev tools

---

### 🔨 Option 2: Build From Source

Want to customize VestaVNC or contribute? Build it yourself!

#### **Prerequisites**
- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Git**
- **Node.js 18+** and **npm** (for frontend development)
- **WSL2** (if on Windows, for the build scripts)

#### **Step 1: Clone the Repository**
```bash
git clone https://github.com/AliNikpourKermanian/VestaVNC.git
cd VestaVNC
```

#### **Step 2: Build the Frontend**
```bash
cd vesta/vesta-ui
npm install
npm run build
cd ../..


Or just use the ./rebuild_ui.sh
```

This compiles the React app and outputs static files to `vesta/vesta-ui/dist/`, which are then copied to the Vesta root in the Dockerfile.

#### **Step 3: Build the Docker Image**
```bash
# On Linux/macOS/WSL:
./build.sh
./run_container.sh or ./start.sh



The build script will:
1. Build the Docker image (`vesta-vnc`)
2. Detect and mount host drives (WSL drives, physical USB, etc.)
3. Start the container with all ports exposed
4. Hot-swap `start.sh` and `usb_manager.py` for easy development

#### **Step 4: Access VestaVNC**
Open your browser to: **http://localhost:6080/vnc.html**

**Default VNC Password**: `netvesta` (can be changed via `VNC_PASSWORD` env var)

---
```
## 🧠 How It Works

### 1. **Container Initialization** (`start.sh`)
When the container starts:
1. VNC password is set
2. X11 and VNC server start on display `:1`
3. PulseAudio initializes with virtual sinks (`VNC_Mic`, `VNC_Speaker`)
4. Socat bridges PulseAudio to TCP sockets
5. Websockify wraps TCP audio streams in WebSockets
6. `usb_manager.py` starts on port 6083
7. Vesta serves the web UI on port 6080

### 2. **Drive Discovery & Mounting**
The `usb_manager.py` backend provides REST endpoints:

- **`GET /api/list_usb_devices`**: Scans `/.host_raw` for available drives
- **`POST /api/mount_usb?device=host_f`**: Creates a symlink in `/media/USB_DRIVE/drive_f` pointing to `/.host_raw/f`
- **`GET /api/usbs`**: Lists currently mounted drives
- **`GET /api/files?path=/path`**: Lists files in a directory
- **`GET /api/download?path=/file`**: Downloads a file
- **`POST /api/upload?path=/dir`**: Uploads a file

**Security**: All paths are validated against allowed prefixes (`/root`, `/media`, `/.host_raw`).

### 3. **Audio Streaming**
Audio flows in two directions:

**Microphone (Browser → Container)**:
```
Browser (getUserMedia) → WebSocket :6081 → Socat → PulseAudio VNC_Mic → Apps
```

**Speaker (Container → Browser)**:
Apps → PulseAudio VNC_Speaker → Socat → WebSocket :6082 → Browser (Audio Element)

### 4. **Frontend Architecture**
The React UI uses:
- **`useUSB` hook**: Manages API calls to `usb_manager.py`
- **`FilesModal`**: Displays drives, handles uploads/downloads, mount actions
- **`Dock`**: macOS-style app launcher
- **`SettingsModal`**: VNC/audio settings
- **Tailwind CSS**: Utility-first styling for rapid UI development

---

## 📜 License

VestaVNC is released under the **MIT License**. See [LICENSE](LICENSE) for full terms.

**TL;DR**:
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ Private use allowed
- ⚠️ Provided "as-is" without warranty
- 📝 Must include original license and copyright notice

For questions or commercial support, contact: **info@netvesta.com**

---

## 👨‍💻 Author

- 🌐 Website: [www.netvesta.com](https://www.netvesta.com)
- 📧 Email: ali.nikpour@netvesta.com
- 💼 LinkedIn: [Ali Nikpour Kermanian](https://www.linkedin.com/in/ali-nikpour-kermanian-5b0b88238/)

---

## 🙏 Acknowledgments

VestaVNC stands on the shoulders of giants. Special thanks to:

- **noVNC Team**: For the excellent browser-based VNC client
- **TigerVNC**: For the robust VNC server implementation
- **Shadcn**: For the beautiful UI component library
- **React & Vite Teams**: For making frontend development a joy
- **The Open Source Community**: For building the tools that make projects like this possible

---

## 🐛 Issues & Contributions

Found a bug? Have a feature request? Want to contribute?

- **Issues**: Open an issue on GitHub describing your problem
- **Feature Requests**: We'd love to hear your ideas!
- **Pull Requests**: Contributions are welcome! Please fork, create a feature branch, and submit a PR

**Note**: By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 📚 Learn More

Interested in how VestaVNC works under the hood?

- **noVNC Documentation**: https://github.com/novnc/noVNC/wiki
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **PulseAudio System**: https://www.freedesktop.org/wiki/Software/PulseAudio/
- **React + TypeScript**: https://react-typescript-cheatsheet.netlify.app/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

<div align="center">

**Made with ❤️ by netvesta.com**

*Building the future of remote desktop experiences, one container at a time.*

⭐ **Star this repo if you find it useful!** ⭐

</div>



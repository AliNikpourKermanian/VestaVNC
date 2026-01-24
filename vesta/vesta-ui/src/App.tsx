import { useState, useRef, useEffect } from 'react'
import { Dock } from '@/components/layout/Dock'
import { TopBar } from '@/components/layout/TopBar'
import { VncScreen } from '@/components/layout/VncScreen'
import { StatsOverlay } from '@/components/layout/StatsOverlay'
import { SettingsModal } from '@/components/features/SettingsModal'
import { FilesModal } from '@/components/features/FilesModal'
import { ClipboardModal } from '@/components/features/ClipboardModal'
import { AboutModal, AboutView } from '@/components/features/AboutModal'
import { HelpModal } from '@/components/features/HelpModal'
import { PasswordModal } from '@/components/features/PasswordModal'
import { useVNC } from '@/hooks/useVNC'
import { useAudio } from '@/hooks/useAudio'
import { useUSB } from '@/hooks/useUSB'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Determine connection URL
const getVncUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  return `${protocol}://${host}:6080/websockify`; // Proxy setup in vite handles this for dev
}


function App() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [modal, setModal] = useState<null | 'settings' | 'files' | 'clipboard' | 'about' | 'password_set' | 'password_login' | 'help'>(null);
  const [aboutView, setAboutView] = useState<AboutView>('info');
  const [statsVisible, setStatsVisible] = useState(false);
  const [loginPassword, setLoginPassword] = useState(""); // For inline login

  // Determine API URL (FileManager/USB)
  const getApiUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // If dev (localhost), use standard /api (proxy)
    // If prod (accessed via IP/domain), assuming usb_manager is on port 6083 directly
    if (hostname === 'localhost' && window.location.port !== '6080' && window.location.port !== '') {
      return '/api';
    }
    return `${protocol}//${hostname}:6083/api`;
  }


  // Initialize Hooks
  const vnc = useVNC(container, getVncUrl(), 'netvesta'); // Explicitly pass password
  const audio = useAudio();
  const usb = useUSB(getApiUrl());

  // Update Title & Favicon from Config
  useEffect(() => {
    const config = (window as any).VESTA_CONFIG;
    if (config?.vncName) {
      document.title = config.vncName;
    }
    if (config?.toolkitDisable) {
      // Hide Favicon (set to transparent pixel)
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) link.href = 'data:image/x-icon;base64,';
    }
  }, []);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Handle Stats Toggle
  const toggleStats = () => {
    setStatsVisible(prev => !prev);
  }

  return (
    <div className="dark relative w-screen h-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
      {/* Core VNC Canvas */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 z-10">
          <VncScreen ref={setContainer} />
        </div>
      </div>

      {/* Status Pill & Vesta Menu */}
      <TopBar
        state={vnc.state}
        onContact={() => { setAboutView('contact'); setModal('about'); }}
        onWebsite={() => { setAboutView('website'); setModal('about'); }}
        onInfo={() => { setAboutView('info'); setModal('about'); }}
      />

      {/* Reconnect / Login Overlay */}
      {vnc.state.status === 'disconnected' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4 max-w-sm w-full p-6">
            <h2 className="text-xl font-medium text-white/80">
              {(vnc.state.error === 'Password required' || vnc.state.error?.includes("Authentication failure") || vnc.state.error?.includes("Connection closed") || usb.passwordEnabled)
                ? "Login Required"
                : "Disconnected"}
            </h2>
            <p className="text-sm text-white/50">{vnc.state.error || "Connection lost"}</p>

            <form onSubmit={(e) => { e.preventDefault(); vnc.connect(loginPassword); }} className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password (if set)"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Reconnect / Login
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Dock */}
      <Dock
        onClipboard={() => setModal('clipboard')}
        onFiles={() => setModal('files')}
        onSettings={() => setModal('settings')}
        onDisconnect={vnc.disconnect}
        onFullscreen={toggleFullscreen}
        onStats={toggleStats}
        onPassword={() => setModal('password_set')}
        onHelp={() => setModal('help')}
        passwordEnabled={usb.passwordEnabled}
      />

      {/* Modals */}
      <SettingsModal
        open={modal === 'settings'}
        onOpenChange={(v) => v ? setModal('settings') : setModal(null)}
        settings={vnc.settings}
        updateSettings={vnc.updateSettings}
        audio={{
          active: audio.speakerActive,
          toggleSpeaker: audio.speakerActive ? audio.stopSpeaker : audio.startSpeaker,
          volume: 100
        }}
        mic={{
          active: audio.micActive,
          toggleMic: audio.micActive ? audio.stopMic : () => audio.startMic(),
          passwordEnabled: usb.passwordEnabled,
          togglePassword: () => {
            if (usb.passwordEnabled) {
              usb.togglePassword(); // Handles disabling
            } else {
              setModal('password_set'); // Open modal to enable
            }
          }
        }}
      />

      <FilesModal
        open={modal === 'files'}
        onOpenChange={(v) => v ? setModal('files') : setModal(null)}
        files={usb.files}
        currentPath={usb.currentPath}
        loading={usb.loading}
        fetchFiles={usb.fetchFiles}
        downloadFile={usb.downloadFile}
        uploadFile={usb.uploadFile}
        fetchDrives={usb.fetchDrives}
        fetchAvailableDevices={usb.fetchAvailableDevices}
        mountDevice={usb.mountDevice}
        unmountDevice={usb.unmountDevice}
        error={usb.error}
        baseUrl={usb.baseUrl}
      />

      <ClipboardModal
        open={modal === 'clipboard'}
        onOpenChange={(v) => v ? setModal('clipboard') : setModal(null)}
        sendClipboard={vnc.sendClipboard}
      />

      <HelpModal
        open={modal === 'help'}
        onOpenChange={(v) => v ? setModal('help') : setModal(null)}
      />

      <AboutModal
        open={modal === 'about'}
        onOpenChange={(v) => v ? setModal('about') : setModal(null)}
        view={aboutView}
      />

      <PasswordModal
        open={modal === 'password_set' || modal === 'password_login'}
        mode={modal === 'password_set' ? 'set' : 'login'}
        onOpenChange={(v) => v ? null : setModal(null)}
        onSave={async (pw) => {
          if (modal === 'password_set') {
            await usb.setPassword(pw);
            setModal(null);
          } else {
            // Login Flow
            setModal(null);
            // Trigger Reconnect with new password
            vnc.connect(pw);
          }
        }}
      />

      {/* Performance Stats Overlay */}
      <StatsOverlay visible={statsVisible} />

    </div>
  )
}

export default App

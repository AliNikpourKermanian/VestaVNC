import { useState, useRef } from 'react'
import { Dock } from '@/components/layout/Dock'
import { TopBar } from '@/components/layout/TopBar'
import { VncScreen } from '@/components/layout/VncScreen'
import { SettingsModal } from '@/components/features/SettingsModal'
import { FilesModal } from '@/components/features/FilesModal'
import { ClipboardModal } from '@/components/features/ClipboardModal'
import { AboutModal, AboutView } from '@/components/features/AboutModal'
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
  // In production, noVNC often uses path /websockify on same port or similar
}

function App() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [modal, setModal] = useState<null | 'settings' | 'files' | 'clipboard' | 'about'>(null);
  const [aboutView, setAboutView] = useState<AboutView>('info');

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

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }


  return (
    <div className="dark relative w-screen h-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
      {/* Core VNC Canvas */}
      <VncScreen ref={setContainer} />

      {/* Status Pill & Vesta Menu */}
      <TopBar
        state={vnc.state}
        onContact={() => { setAboutView('contact'); setModal('about'); }}
        onWebsite={() => { setAboutView('website'); setModal('about'); }}
        onInfo={() => { setAboutView('info'); setModal('about'); }}
      />

      {/* Reconnect Overlay */}
      {vnc.state.status === 'disconnected' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-medium text-white/80">Disconnected</h2>
            <p className="text-sm text-white/50">{vnc.state.error || "Connection lost"}</p>
            <Button onClick={vnc.connect} variant="outline" className="border-white/20 hover:bg-white/10">
              Reconnect
            </Button>
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
          toggleMic: audio.micActive ? audio.stopMic : () => audio.startMic()
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

      <AboutModal
        open={modal === 'about'}
        onOpenChange={(v) => v ? setModal('about') : setModal(null)}
        view={aboutView}
      />

    </div>
  )
}

export default App

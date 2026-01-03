
import os
import sys
import errno
import logging
import asyncio
import websockets
import threading
import json
import time
from fuse import FUSE, FuseOSError, Operations

# Configuration
MOUNT_POINT = '/mnt/browser'
WS_PORT = 6084

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global WebSocket connection
connected_ws = None
ws_lock = threading.Lock()

class BrowserFS(Operations):
    def __init__(self):
        self.files = {}
        self.attr_cache = {}

    def _get_ws(self):
        with ws_lock:
            return connected_ws

    def _request(self, method, path, **kwargs):
        ws = self._get_ws()
        if not ws:
            raise FuseOSError(errno.ENOTCONN)
        
        request_id = str(int(time.time() * 1000))
        payload = {
            'id': request_id,
            'method': method,
            'path': path,
            **kwargs
        }

        # Determine if this needs to be synchronous (blocking)
        # FUSE operations are blocking. We need to send to WS and wait for response.
        # Since we are in a thread (FUSE thread), we can block.
        # But we need to use the asyncio loop of the WS thread? 
        # Easier: The WS server runs in a separate thread/loop. We just need to signal it.
        # ... Wait, websockets lib is async. Calling from sync FUSE thread is tricky.
        
        # Simplified approach: Use a queue or future to wait for response.
        future = asyncio.run_coroutine_threadsafe(self._async_send_receive(ws, payload), ws_loop)
        try:
            response = future.result(timeout=10) # 10s timeout
            if 'error' in response:
                err = response['error']
                if err == 'ENOENT': raise FuseOSError(errno.ENOENT)
                if err == 'EACCES': raise FuseOSError(errno.EACCES)
                raise FuseOSError(errno.EIO)
            return response.get('data')
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise FuseOSError(errno.EIO)

    async def _async_send_receive(self, ws, payload):
        await ws.send(json.dumps(payload))
        response = await ws.recv()
        return json.loads(response)

    # --- Filesystem Operations ---

    def getattr(self, path, fh=None):
        # Cache root
        if path == '/':
            return dict(st_mode=(0o40777), st_nlink=2, st_size=0, st_ctime=time.time(), st_mtime=time.time(), st_atime=time.time())
        
        # Check cache/remote
        # Optimization: We can't query browser for every getattr, it's too slow (Explorer spams this).
        # Strategy: Rely on readdir to populate a temporary cache or just fetch on demand.
        # For MVP: Fetch on demand.
        
        data = self._request('GETATTR', path)
        if not data:
            raise FuseOSError(errno.ENOENT)
            
        return data

    def readdir(self, path, fh):
        entries = ['.', '..']
        data = self._request('READDIR', path)
        if data:
            entries.extend(data)
        return entries

    def open(self, path, flags):
        # We don't maintain open handles in browser, just stateless read/write
        return 0

    def read(self, path, length, offset, fh):
        data = self._request('READ', path, length=length, offset=offset)
        if data:
             # Expecting base64 or bytes? Let's assume hex or similar for JSON safety? 
             # Or raw bytes if WS supports it. JSON is easiest for text, but images need encoding.
             # Protocol: response['data'] is base64 encoded string.
             import base64
             return base64.b64decode(data)
        return b''

    def write(self, path, buf, offset, fh):
         # Unsupported for read-only MVP first? 
         # Let's add write support.
         import base64
         b64_data = base64.b64encode(buf).decode('utf-8')
         written = self._request('WRITE', path, data=b64_data, offset=offset)
         return written

    def create(self, path, mode, fi=None):
        self._request('CREATE', path)
        return 0

# --- WebSocket Server ---

ws_loop = None

async def handler(websocket):
    global connected_ws
    with ws_lock:
        connected_ws = websocket
    
    logger.info("Browser Connected!")
    try:
        await websocket.wait_closed()
    finally:
        with ws_lock:
            if connected_ws == websocket:
                connected_ws = None
        logger.info("Browser Disconnected")

async def start_server():
    global ws_loop
    ws_loop = asyncio.get_running_loop()
    async with websockets.serve(handler, "0.0.0.0", WS_PORT):
        await asyncio.Future()  # run forever

def run_server_thread():
    asyncio.run(start_server())

# --- Main ---

if __name__ == '__main__':
    if not os.path.exists(MOUNT_POINT):
        os.makedirs(MOUNT_POINT, exist_ok=True)
    
    # Start WS Server in background thread
    t = threading.Thread(target=run_server_thread, daemon=True)
    t.start()

    logger.info(f"Starting FUSE on {MOUNT_POINT}...")
    try:
        FUSE(BrowserFS(), MOUNT_POINT, nothreads=True, foreground=True, allow_other=True)
    except Exception as e:
        logger.error(f"FUSE Error: {e}")

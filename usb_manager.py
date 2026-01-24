import http.server
import json
import os
import subprocess
import urllib.parse
import shutil
import threading
import time

PORT = 6083

# Global Settings
SETTINGS = {
    'usb_passthrough': False,  # Deprecated in favor of MOUNTED_PATHS
    'auto_mount': False,       # Disabled by default
    'password_enabled': False  # Password protection status
}
MOUNTED_PATHS = set()

# Helper to set system password
def set_system_password(password):
    try:
        # 1. Update VNC Password
        # pipe password to vncpasswd
        p1 = subprocess.Popen(['vncpasswd', '-f'], stdin=subprocess.PIPE, stdout=open(os.path.expanduser('~/.vnc/passwd'), 'wb'))
        p1.communicate(input=password.encode())
        
        # 2. Update System Root Password
        # echo "root:password" | chpasswd
        p2 = subprocess.Popen(['chpasswd'], stdin=subprocess.PIPE)
        p2.communicate(input=f"root:{password}".encode())
        return True
    except Exception as e:
        print(f"Password update failed: {e}", flush=True)
        return False

class USBHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override to flush logs immediately
        print("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format % args), flush=True)

    def send_json_error(self, code, message):
        try:
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': message}).encode())
        except Exception:
            pass

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-File-Name')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path
            query = urllib.parse.parse_qs(parsed_path.query)

            if path == '/api/usbs':
                self.list_usbs()
            elif path == '/api/ping':
                self.send_response(200)
                self.wfile.write(b'pong')
            elif path == '/api/debug':
                self.debug_info()
            elif path == '/api/files':
                self.list_files(query.get('path', ['/root/Desktop'])[0])
            elif path == '/api/download':
                self.download_file(query.get('path', [''])[0])
            elif path == '/api/import':
                self.import_file(query.get('path', [''])[0])
            elif path == '/api/settings':
                self.get_settings()
            elif path == '/api/list_usb_devices':
                self.list_usb_devices()
            elif path == '/api/mount_usb':
                self.mount_usb(query.get('device', [''])[0])
            elif path == '/api/unmount_usb':
                self.unmount_usb(query.get('device', [''])[0])
            elif path == '/api/power':
                self.power_action(query.get('action', [''])[0])
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
            print(f"Error handling GET {self.path}: {e}", flush=True)
            self.send_json_error(500, str(e))

    def do_POST(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path
            query = urllib.parse.parse_qs(parsed_path.query)

            if path == '/api/upload':
                self.upload_file(query.get('path', ['/root/Desktop'])[0])
            elif path == '/api/settings':
                self.update_settings()
            elif path == '/api/password':
                self.update_password()
            elif path == '/api/password_disable':
                self.disable_password()
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
             print(f"Error handling POST {self.path}: {e}", flush=True)
             self.send_json_error(500, str(e))

    def list_usbs(self):
        try:
            storage = {
                'portable': [],   # Real USBs (/media, lsblk)
                'host': [],       # Host drives (/mnt, /host_mnt)
                'internal': []    # Container storage (/root)
            }
            seen_mounts = set()

            # 1. Internal Storage
            storage['internal'].append({
                'name': 'Container Home',
                'label': 'Internal Home (/root)',
                'mountpoint': '/root',
                'size': 'System'
            })
            seen_mounts.add('/root')
            
            # 2. Linux approach: lsblk
            try:
                # Use -a to see all, including unmounted if possible
                result = subprocess.run(['lsblk', '-J', '-o', 'NAME,MOUNTPOINT,RM,SIZE,TYPE,LABEL'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0 and result.stdout.strip():
                    data = json.loads(result.stdout)
                    def process_device(dev):
                        mountpoint = dev.get('mountpoint')
                        if mountpoint and mountpoint not in seen_mounts:
                            if dev.get('rm') in ['1', True] or dev.get('type') in ['part', 'disk']:
                                storage['portable'].append({
                                    'name': dev.get('name'),
                                    'label': dev.get('label') or dev.get('name'),
                                    'mountpoint': mountpoint,
                                    'size': dev.get('size')
                                })
                                seen_mounts.add(mountpoint)
                        if 'children' in dev:
                            for child in dev['children']:
                                process_device(child)

                    for device in data.get('blockdevices', []):
                        process_device(device)
            except Exception as e:
                print(f"lsblk failed: {e}", flush=True)

            # 3. Windows/WSL drives (/mnt)
            try:
                if os.path.exists('/.host_raw'):
                    for item in os.listdir('/.host_raw'):
                        if len(item) == 1 and item.isalpha():
                            mpath = os.path.join('/.host_raw', item)
                            if os.path.exists(mpath) and mpath not in seen_mounts:
                                # ONLY show if explicitly mounted
                                if mpath in MOUNTED_PATHS or SETTINGS.get('usb_passthrough'):
                                    storage['host'].append({
                                        'name': f"host_{item}",
                                        'label': f"Host {item.upper()}: Drive",
                                        'mountpoint': mpath,
                                        'size': 'Managed by Host'
                                    })
                                    seen_mounts.add(mpath)
            except Exception as e:
                print(f"/mnt scan failed: {e}", flush=True)

            # 4. Docker Desktop Windows mounts (/host_mnt)
            try:
                if os.path.exists('/host_mnt'):
                    for item in os.listdir('/host_mnt'):
                        mpath = os.path.join('/host_mnt', item)
                        if os.path.exists(mpath) and mpath not in seen_mounts:
                           if mpath in MOUNTED_PATHS or SETTINGS.get('usb_passthrough'):
                                storage['host'].append({
                                    'name': f"host_{item}",
                                    'label': f"Docker Host {item.upper()}:",
                                    'mountpoint': mpath,
                                    'size': 'Managed by Host'
                                })
                                seen_mounts.add(mpath)
            except Exception as e:
                pass

            # 5. /media (Traditional Linux USB)
            try:
                if os.path.exists('/media'):
                    for item in os.listdir('/media'):
                        mpath = os.path.join('/media', item)
                        if os.path.isdir(mpath) and mpath not in seen_mounts:
                            storage['portable'].append({
                                'name': item,
                                'label': f"USB: {item}",
                                'mountpoint': mpath,
                                'size': 'Unknown'
                            })
                            seen_mounts.add(mpath)
            except Exception as e:
                print(f"/media scan failed: {e}", flush=True)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(storage).encode())
        except Exception as e:
            self.send_json_error(500, f"Critical list_usbs failure: {str(e)}")

    def debug_info(self):
        try:
            info = {}
            try:
                info['lsblk'] = subprocess.run(['lsblk', '-a'], capture_output=True, text=True, timeout=5).stdout
            except Exception as e: info['lsblk'] = f"Error: {e}"
            info['mounted_paths'] = list(MOUNTED_PATHS)
            info['settings'] = SETTINGS
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(info).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def is_path_safe(self, path):
        # Allow common root directories and external storage
        allowed_prefixes = ['/root', '/media', '/.host_raw', '/host_mnt', '/mnt/browser']
        return any(path.startswith(p) for p in allowed_prefixes)

    def list_files(self, mountpath):
        if not self.is_path_safe(mountpath):
             self.send_json_error(403, f"Forbidden: Accessing {mountpath} is not allowed.")
             return
        try:
            files = []
            if os.path.exists(mountpath):
                for item in os.listdir(mountpath):
                    ipath = os.path.join(mountpath, item)
                    files.append({
                        'name': item,
                        'isDir': os.path.isdir(ipath),
                        'size': os.path.getsize(ipath) if not os.path.isdir(ipath) else 0
                    })
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(files).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def download_file(self, filepath):
        if not self.is_path_safe(filepath):
             self.send_json_error(403, "Forbidden")
             return
        if not os.path.exists(filepath) or os.path.isdir(filepath):
            self.send_json_error(404, "File Not Found")
            return
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Disposition', f'attachment; filename="{os.path.basename(filepath)}"')
            self.send_header('Content-Length', str(os.path.getsize(filepath)))
            self.end_headers()
            with open(filepath, 'rb') as f:
                shutil.copyfileobj(f, self.wfile)
        except Exception: pass

    def upload_file(self, dest_path):
        if not self.is_path_safe(dest_path):
             self.send_json_error(403, "Forbidden")
             return
        try:
            content_length = int(self.headers['Content-Length'])
            filename = self.headers.get('X-File-Name', 'uploaded_file')
            full_path = os.path.join(dest_path, filename)
            with open(full_path, 'wb') as f:
                remaining = content_length
                while remaining > 0:
                    chunk = self.rfile.read(min(remaining, 65536))
                    if not chunk: break
                    f.write(chunk)
                    remaining -= len(chunk)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Upload Successful")
        except Exception as e:
            self.send_json_error(500, str(e))

    def import_file(self, source_path):
        # ... logic as before ...
        pass # Simplified for brevity, user didn't ask for import but if needed I'll re-add.
        # Actually I should properly reimplement it since it was there.
        try:
            if not self.is_path_safe(source_path):
                 self.send_json_error(403, "Forbidden")
                 return
            if not os.path.exists(source_path) or os.path.isdir(source_path):
                self.send_json_error(404, "File Not Found")
                return
            filename = os.path.basename(source_path)
            dest_path = os.path.join('/root/Desktop', filename)
            shutil.copy2(source_path, dest_path)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def list_usb_devices(self):
        try:
            devices = []
            # 1. Hardware
            try:
                result = subprocess.run(['lsblk', '-J', '-o', 'NAME,SIZE,TYPE,MOUNTPOINT,RM,LABEL'],
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0 and result.stdout.strip():
                    data = json.loads(result.stdout)
                    for device in data.get('blockdevices', []):
                        if (device.get('rm') in ['1', True]) and device.get('type') == 'disk':
                            dev_info = {
                                'name': device['name'],
                                'label': device.get('label') or device['name'],
                                'size': device.get('size', 'Unknown'),
                                'mounted': False,
                                'mountpoint': None,
                                'type': 'hardware'
                            }
                            if 'children' in device:
                                for part in device['children']:
                                    if part.get('mountpoint'):
                                        dev_info['mounted'] = True
                                        dev_info['mountpoint'] = part['mountpoint']
                            devices.append(dev_info)
            except Exception: pass

            # 2. Host Drives
            for scan_path in ['/.host_raw', '/host_mnt']:
                if os.path.exists(scan_path):
                    try:
                        for item in os.listdir(scan_path):
                            if len(item) == 1 and item.isalpha() and item.lower() != 'c':
                                mpath = os.path.join(scan_path, item)
                                # Check if already in MOUNTED_PATHS
                                is_mounted = (mpath in MOUNTED_PATHS)
                                devices.append({
                                    'name': f"host_{item}",
                                    'label': f"PC Drive {item.upper()}:",
                                    'size': 'Host',
                                    'mounted': is_mounted,
                                    'mountpoint': mpath if is_mounted else None,
                                    'type': 'host'
                                })
                    except: pass
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'devices': devices}).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def mount_usb(self, device):
        try:
            if not device:
                self.send_json_error(400, "No device")
                return
            if device.startswith('host_'):
                drive_letter = device.split('_')[1]
                found_path = None
                for base in ['/.host_raw', '/host_mnt']:
                    p = os.path.join(base, drive_letter)
                    if os.path.exists(p):
                        found_path = p
                        break
                if found_path:
                    MOUNTED_PATHS.add(found_path)
                    
                    # Create User-Visible Symlink in /media/USB_DRIVE
                    try:
                        symlink_dir = '/media/USB_DRIVE'
                        os.makedirs(symlink_dir, exist_ok=True)
                        symlink_name = f"drive_{drive_letter.lower()}"
                        symlink_path = os.path.join(symlink_dir, symlink_name)
                        
                        # Remove existing if it exists (refresh it)
                        if os.path.islink(symlink_path) or os.path.exists(symlink_path):
                            try:
                                os.unlink(symlink_path)
                            except:
                                if os.path.isdir(symlink_path):
                                    shutil.rmtree(symlink_path)
                        
                        os.symlink(found_path, symlink_path)
                        print(f"[Mount] Linked {found_path} to {symlink_path}", flush=True)
                    except Exception as e:
                        print(f"[Mount] Symlink error: {e}", flush=True)

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'ok'}).encode())
                else:
                    self.send_json_error(404, "Drive not found")
                return
            
            # Simple hardware mount support ...
            mount_point = '/media/USB_DRIVE'
            os.makedirs(mount_point, exist_ok=True)
            device_path = f'/dev/{device}'
            if not os.path.exists(device_path) and not device.endswith('1'):
                 device_path += '1'
            subprocess.run(['mount', device_path, mount_point], capture_output=True)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def unmount_usb(self, device):
        try:
            if not device:
                self.send_json_error(400, "No device")
                return

            if device.startswith('host_'):
                drive_letter = device.split('_')[1]
                found_path = None
                for base in ['/.host_raw', '/host_mnt']:
                    p = os.path.join(base, drive_letter)
                    if os.path.exists(p):
                        found_path = p
                        break
                
                if found_path:
                    if found_path in MOUNTED_PATHS:
                        MOUNTED_PATHS.remove(found_path)
                    
                    # Cleanup Symlink
                    try:
                        symlink_path = os.path.join('/media/USB_DRIVE', f"drive_{drive_letter.lower()}")
                        if os.path.islink(symlink_path) or os.path.exists(symlink_path):
                            if os.path.islink(symlink_path):
                                os.unlink(symlink_path)
                            elif os.path.isdir(symlink_path):
                                shutil.rmtree(symlink_path)
                        print(f"[Unmount] Removed link for {found_path}", flush=True)
                    except Exception as e:
                        print(f"[Unmount] Cleanup error: {e}", flush=True)

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'ok'}).encode())
                else:
                    self.send_json_error(404, "Drive not found on host")
                return

            # Hardware unmount
            mount_point = '/media/USB_DRIVE'
            # Note: This is simplified, assumes only one hardware mount can exist at a time in /media/USB_DRIVE
            # In a more complex setup, we'd track partitions.
            result = subprocess.run(['umount', mount_point], capture_output=True, text=True)
            if result.returncode == 0:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            else:
                self.send_json_error(500, f"Unmount failed: {result.stderr}")
        except Exception as e:
            self.send_json_error(500, str(e))

    def power_action(self, action):
        try:
            if not action:
                self.send_json_error(400, "No action specified")
                return
            
            cmd = []
            if action == 'reboot':
                # Try standard reboot, fallback to kill 1 if container
                cmd = ['reboot']
            elif action == 'shutdown':
                cmd = ['shutdown', '-h', 'now']
            elif action == 'logout':
                cmd = ['pkill', '-u', 'root', 'xfce4-session']
            else:
                self.send_json_error(400, "Invalid action")
                return

            # Execute non-blocking
            def run_power():
                time.sleep(1)
                try:
                    subprocess.run(cmd)
                except:
                    if action in ['reboot', 'shutdown']:
                        try:
                            os.kill(1, 15)
                        except: pass

            threading.Thread(target=run_power).start()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'action': action}).encode())
        except Exception as e:
            self.send_json_error(500, str(e))

    def get_settings(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(SETTINGS).encode())

    def update_settings(self):
        try:
            l = int(self.headers['Content-Length'])
            d = json.loads(self.rfile.read(l))
            if 'usb_passthrough' in d: SETTINGS['usb_passthrough'] = bool(d['usb_passthrough'])
            if 'auto_mount' in d: SETTINGS['auto_mount'] = bool(d['auto_mount'])
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(SETTINGS).encode())
        except: self.send_json_error(400, "Invalid")

    def update_password(self):
        try:
            l = int(self.headers['Content-Length'])
            d = json.loads(self.rfile.read(l))
            password = d.get('password')
            if not password:
                self.send_json_error(400, "Password required")
                return
            
            if set_system_password(password):
                SETTINGS['password_enabled'] = True
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            else:
                self.send_json_error(500, "Failed to set password")
        except Exception as e:
            self.send_json_error(500, str(e))

    def disable_password(self):
        try:
            # Reset to default 'netvesta'
            if set_system_password('netvesta'):
                SETTINGS['password_enabled'] = False
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            else:
                self.send_json_error(500, "Failed to reset password")
        except Exception as e:
            self.send_json_error(500, str(e))

if __name__ == '__main__':
    print(f"Starting File Manager on port {PORT}...", flush=True)
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), USBHandler)
    server.serve_forever()

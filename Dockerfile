FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV VNC_PASSWORD=netvesta
ENV USER=root

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    kde-plasma-desktop \
    plasma-workspace \
    kwin-x11 \
    dolphin \
    konsole \
    tigervnc-standalone-server \
    tigervnc-common \
    tigervnc-tools \
    git \
    python3 \
    python3-numpy \
    python3-pip \
    net-tools \
    curl \
    dbus-x11 \
    dos2unix \
    pulseaudio \
    software-properties-common \
    gpg-agent \
    socat \
    fuse \
    libfuse2 \
    && add-apt-repository ppa:mozillateam/ppa -y \
    && echo 'Package: *' > /etc/apt/preferences.d/mozilla-firefox \
    && echo 'Pin: release o=LP-PPA-mozillateam' >> /etc/apt/preferences.d/mozilla-firefox \
    && echo 'Pin-Priority: 1001' >> /etc/apt/preferences.d/mozilla-firefox \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends firefox \
    websockify \
    util-linux \
    exfat-fuse \
    ntfs-3g \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages separately with proper dependencies
# Note: Using system opencv package to avoid compilation issues
RUN pip3 install --no-cache-dir \
    fusepy \
    websockets==10.4

# Add root to pulse-access group
RUN adduser root pulse-access || true

# Copy local vestavnc (contains websockify now)
COPY vesta /vesta

# Fix line endings and permissions for vesta
RUN find /vesta -type f -exec dos2unix {} +
RUN chmod -R +x /vesta/utils

# Create vnc.html alias pointing to index.html
RUN ln -sf /vesta/index.html /vesta/vnc.html

# Setup Startup Script
COPY start.sh /start.sh
RUN dos2unix /start.sh && chmod +x /start.sh

# Copy USB Manager
COPY usb_manager.py /usb_manager.py
RUN dos2unix /usb_manager.py && chmod +x /usb_manager.py

# Copy Browser Mount (FUSE Bridge)
COPY vesta/browser_mount.py /browser_mount.py
RUN dos2unix /browser_mount.py && chmod +x /browser_mount.py

# Environment variables for VNC
ENV DISPLAY=:1

# Expose the vestavnc port (6080) and Audio port (6081) and Speaker port (6082)
EXPOSE 6080
EXPOSE 6081
EXPOSE 6082
EXPOSE 6083
EXPOSE 6084
EXPOSE 6085

# Start
ENTRYPOINT ["/start.sh"]

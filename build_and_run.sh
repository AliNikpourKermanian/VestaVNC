#!/bin/bash
set -e

echo "Building Docker image 'vesta-vnc'..."
docker build -t vesta-vnc .

echo "Build successful! Running 'vesta-vnc' on port 6080..."
# -v /mnt:/mnt maps WSL2/Windows drives (including USBs) into the container
docker run --rm -it --init --privileged --shm-size=4g --memory=4g -v /dev:/dev -v /mnt:/mnt -p 6080:6080 -p 6081:6081 -p 6082:6082 -p 6083:6083 vesta-vnc
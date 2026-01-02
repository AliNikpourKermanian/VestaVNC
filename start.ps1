# VestaVNC Windows Launcher
# Automatically detects available drives and mounts them into the container

$ErrorActionPreference = "Stop"

Write-Host "Checking for VestaVNC image..."
# Always build to ensure latest code
Write-Host "Building 'vesta-vnc'..."
docker build -t vesta-vnc .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Dynamic Drive Detection
Write-Host "Detecting available drives..."
$drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 -and $_.Root.Length -eq 3 }
$volArgs = ""

foreach ($d in $drives) {
    try {
        $letter = $d.Root.Substring(0,1).ToLower()
        # Skip weird drives if any, ensure it's a letter
        if ($letter -match "[a-z]") {
            Write-Host "Found Drive: $($d.Root) -> Mapping to /mnt/$letter"
            $volArgs += " -v ${letter}:/:/mnt/${letter}"
        }
    } catch {
        Write-Warning "Skipping drive $($d.Root)"
    }
}

# Construct Command
# Note: --rm removes container on exit
# -it interactive TTY
# --priviliged for device access
# /dev:/dev for Linux device access (if nested virtualization)
$cmd = "docker run --rm -it --init --privileged --shm-size=4g --memory=4g -v /dev:/dev $volArgs -p 6080:6080 -p 6081:6081 -p 6082:6082 -p 6083:6083 vesta-vnc"

Write-Host "-------------------------------------------------------"
Write-Host "Starting VestaVNC..."
Write-Host "Command: $cmd"
Write-Host "-------------------------------------------------------"

# execute
Invoke-Expression $cmd

# Pause on exit if error
if ($LASTEXITCODE -ne 0) {
    Write-Host "Container exited with error code $LASTEXITCODE"
    Read-Host "Press Enter to close..."
}

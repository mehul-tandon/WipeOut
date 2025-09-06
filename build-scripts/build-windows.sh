#!/bin/bash

# Build script for Windows executable
# Creates a standalone Windows executable using PyInstaller

set -e

echo "Building WipeOut for Windows..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CORE_ENGINE_DIR="$PROJECT_ROOT/core-engine"
BUILD_DIR="$PROJECT_ROOT/build"
DIST_DIR="$PROJECT_ROOT/downloads"
OUTPUT_NAME="wipeout-windows.exe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on Windows or have Wine
if ! command -v python &> /dev/null && ! command -v wine &> /dev/null; then
    echo_error "Python not found and Wine not available. Cannot build Windows executable."
    exit 1
fi

# Create directories
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Change to core engine directory
cd "$CORE_ENGINE_DIR"

echo_info "Installing Python dependencies..."

# Install dependencies
if command -v python &> /dev/null; then
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    python -m pip install pyinstaller
else
    echo_warn "Using Wine to run Python (this may be slow)"
    wine python -m pip install --upgrade pip
    wine python -m pip install -r requirements.txt
    wine python -m pip install pyinstaller
fi

echo_info "Creating PyInstaller spec file..."

# Create PyInstaller spec file
cat > secure_wiper_windows.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['secure_wiper/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('secure_wiper/config/*.yaml', 'secure_wiper/config'),
        ('secure_wiper/templates/*.json', 'secure_wiper/templates'),
    ],
    hiddenimports=[
        'secure_wiper.algorithms.nist',
        'secure_wiper.algorithms.dod',
        'secure_wiper.algorithms.gutmann',
        'secure_wiper.algorithms.random',
        'secure_wiper.utils.device_detector',
        'secure_wiper.utils.device_info',
        'secure_wiper.utils.verification',
        'secure_wiper.utils.api_client',
        'secure_wiper.utils.logger',
        'secure_wiper.utils.config',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='secure-wiper-windows',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico' if os.path.exists('assets/icon.ico') else None,
)
EOF

echo_info "Building Windows executable with PyInstaller..."

# Build with PyInstaller
if command -v python &> /dev/null; then
    python -m PyInstaller secure_wiper_windows.spec --clean --noconfirm
else
    wine python -m PyInstaller secure_wiper_windows.spec --clean --noconfirm
fi

# Check if build was successful
if [ -f "dist/secure-wiper-windows.exe" ]; then
    echo_info "Build successful! Moving executable to downloads directory..."
    
    # Move to downloads directory
    mv "dist/secure-wiper-windows.exe" "$DIST_DIR/$OUTPUT_NAME"
    
    # Get file size
    FILE_SIZE=$(stat -f%z "$DIST_DIR/$OUTPUT_NAME" 2>/dev/null || stat -c%s "$DIST_DIR/$OUTPUT_NAME" 2>/dev/null || echo "unknown")
    FILE_SIZE_MB=$(echo "scale=1; $FILE_SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")
    
    echo_info "Windows executable created: $DIST_DIR/$OUTPUT_NAME"
    echo_info "File size: ${FILE_SIZE_MB} MB"
    
    # Create version info file
    cat > "$DIST_DIR/secure-wiper-windows.info" << EOF
{
    "filename": "$OUTPUT_NAME",
    "platform": "windows",
    "architecture": "x64",
    "version": "1.0.0",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "file_size": $FILE_SIZE,
    "file_size_mb": "${FILE_SIZE_MB}",
    "requirements": "Windows 10 or later",
    "description": "Secure Data Wiper for Windows - NIST SP 800-88 compliant data erasure tool"
}
EOF
    
    echo_info "Build information saved to: $DIST_DIR/secure-wiper-windows.info"
    
    # Clean up build artifacts
    echo_info "Cleaning up build artifacts..."
    rm -rf build dist *.spec
    
    echo_info "Windows build completed successfully!"
    
else
    echo_error "Build failed! Executable not found."
    exit 1
fi

# Optional: Code signing (if certificate is available)
if [ -n "$WINDOWS_CERT_PATH" ] && [ -f "$WINDOWS_CERT_PATH" ]; then
    echo_info "Code signing certificate found. Signing executable..."
    
    # This would require signtool.exe or osslsigncode
    if command -v osslsigncode &> /dev/null; then
        osslsigncode sign \
            -certs "$WINDOWS_CERT_PATH" \
            -key "$WINDOWS_KEY_PATH" \
            -n "Secure Data Wiper" \
            -i "https://securedatasolutions.com" \
            -t "http://timestamp.digicert.com" \
            -in "$DIST_DIR/$OUTPUT_NAME" \
            -out "$DIST_DIR/${OUTPUT_NAME}.signed"
        
        if [ $? -eq 0 ]; then
            mv "$DIST_DIR/${OUTPUT_NAME}.signed" "$DIST_DIR/$OUTPUT_NAME"
            echo_info "Executable signed successfully!"
        else
            echo_warn "Code signing failed, but build is still usable."
        fi
    else
        echo_warn "osslsigncode not found. Skipping code signing."
    fi
else
    echo_warn "No code signing certificate configured. Executable will be unsigned."
fi

echo_info "Windows build process completed!"
echo_info "Executable location: $DIST_DIR/$OUTPUT_NAME"
echo_info ""
echo_info "To test the executable:"
echo_info "  1. Copy $OUTPUT_NAME to a Windows machine"
echo_info "  2. Run as Administrator: .\\$OUTPUT_NAME --help"
echo_info "  3. List devices: .\\$OUTPUT_NAME list-devices"

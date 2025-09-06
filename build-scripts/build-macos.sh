#!/bin/bash

# Build script for macOS executable
# Creates a standalone macOS executable using PyInstaller

set -e

echo "Building WipeOut for macOS..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CORE_ENGINE_DIR="$PROJECT_ROOT/core-engine"
BUILD_DIR="$PROJECT_ROOT/build"
DIST_DIR="$PROJECT_ROOT/downloads"
OUTPUT_NAME="wipeout-macos"

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

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo_error "This script must be run on macOS to build the macOS executable."
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo_error "Python 3 not found. Please install Python 3.8 or later."
    exit 1
fi

# Create directories
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Change to core engine directory
cd "$CORE_ENGINE_DIR"

echo_info "Installing Python dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

echo_info "Creating PyInstaller spec file..."

# Create PyInstaller spec file
cat > secure_wiper_macos.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-

import os

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
    name='wipeout-macos',
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
)
EOF

echo_info "Building macOS executable with PyInstaller..."

# Build with PyInstaller
python -m PyInstaller secure_wiper_macos.spec --clean --noconfirm

# Check if build was successful
if [ -f "dist/wipeout-macos" ]; then
    echo_info "Build successful! Moving executable to downloads directory..."
    
    # Move to downloads directory
    mv "dist/wipeout-macos" "$DIST_DIR/$OUTPUT_NAME"
    
    # Make executable
    chmod +x "$DIST_DIR/$OUTPUT_NAME"
    
    # Get file size
    FILE_SIZE=$(stat -f%z "$DIST_DIR/$OUTPUT_NAME" 2>/dev/null || echo "unknown")
    FILE_SIZE_MB=$(echo "scale=1; $FILE_SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")
    
    echo_info "macOS executable created: $DIST_DIR/$OUTPUT_NAME"
    echo_info "File size: ${FILE_SIZE_MB} MB"
    
    # Create version info file
    cat > "$DIST_DIR/wipeout-macos.info" << EOF
{
    "filename": "$OUTPUT_NAME",
    "platform": "macos",
    "architecture": "x64/ARM64",
    "version": "1.0.0",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "file_size": $FILE_SIZE,
    "file_size_mb": "${FILE_SIZE_MB}",
    "requirements": "macOS 10.14 or later",
    "description": "WipeOut for macOS - NIST SP 800-88 compliant data erasure tool"
}
EOF
    
    echo_info "Build information saved to: $DIST_DIR/wipeout-macos.info"
    
    # Test the executable
    echo_info "Testing executable..."
    if "$DIST_DIR/$OUTPUT_NAME" --version &> /dev/null; then
        echo_info "Executable test passed!"
    else
        echo_warn "Executable test failed, but binary was created."
    fi
    
    # Clean up build artifacts
    echo_info "Cleaning up build artifacts..."
    rm -rf build dist *.spec
    
    echo_info "macOS build completed successfully!"
    
else
    echo_error "Build failed! Executable not found."
    exit 1
fi

# Code signing (optional)
if [ -n "$MACOS_CERT_NAME" ]; then
    echo_info "Code signing certificate found. Signing executable..."
    
    codesign --force --sign "$MACOS_CERT_NAME" "$DIST_DIR/$OUTPUT_NAME"
    
    if [ $? -eq 0 ]; then
        echo_info "Executable signed successfully!"
        
        # Verify signature
        codesign --verify --verbose "$DIST_DIR/$OUTPUT_NAME"
        
        # Create notarization-ready package (optional)
        if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ]; then
            echo_info "Creating notarization package..."
            
            # Create a zip for notarization
            cd "$DIST_DIR"
            zip -r "wipeout-macos-signed.zip" "$OUTPUT_NAME"
            
            echo_info "Package ready for notarization: wipeout-macos-signed.zip"
            echo_info "To notarize, run: xcrun altool --notarize-app --primary-bundle-id com.securedatasolutions.wipeout --username $APPLE_ID --password $APPLE_ID_PASSWORD --file wipeout-macos-signed.zip"
        fi
    else
        echo_warn "Code signing failed, but build is still usable."
    fi
else
    echo_warn "No code signing certificate configured. Executable will be unsigned."
    echo_warn "Users may need to allow the app in System Preferences > Security & Privacy"
fi

# Deactivate virtual environment
deactivate

echo_info "macOS build process completed!"
echo_info "Executable location: $DIST_DIR/$OUTPUT_NAME"
echo_info ""
echo_info "To test the executable:"
echo_info "  1. Make sure it's executable: chmod +x $OUTPUT_NAME"
echo_info "  2. Run with sudo: sudo ./$OUTPUT_NAME --help"
echo_info "  3. List devices: sudo ./$OUTPUT_NAME list-devices"
echo_info ""
echo_info "Note: On first run, macOS may show a security warning."
echo_info "Go to System Preferences > Security & Privacy and click 'Allow Anyway'"

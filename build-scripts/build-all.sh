#!/bin/bash

# Master build script for all platforms
# Builds Windows, Linux, and Android versions of Secure Wiper

set -e

echo "Building WipeOut for all platforms..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo_section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
}

# Track build results
BUILD_RESULTS=()

# Function to run build and track results
run_build() {
    local platform=$1
    local script=$2
    
    echo_section "Building for $platform..."
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        if bash "$SCRIPT_DIR/$script"; then
            BUILD_RESULTS+=("$platform: SUCCESS")
            echo_info "$platform build completed successfully!"
        else
            BUILD_RESULTS+=("$platform: FAILED")
            echo_error "$platform build failed!"
        fi
    else
        BUILD_RESULTS+=("$platform: SCRIPT NOT FOUND")
        echo_error "Build script not found: $script"
    fi
    
    echo ""
}

# Make build scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Start builds
echo_info "Starting multi-platform build process..."
echo_info "Project root: $PROJECT_ROOT"
echo ""

# Build for Linux (usually fastest and most reliable)
run_build "Linux" "build-linux.sh"

# Build for Windows (requires Wine or Windows environment)
run_build "Windows" "build-windows.sh"

# Build for macOS (requires macOS environment)
run_build "macOS" "build-macos.sh"

# Summary
echo_section "Build Summary"
echo "=============================================="

for result in "${BUILD_RESULTS[@]}"; do
    if [[ $result == *"SUCCESS"* ]]; then
        echo -e "${GREEN}✓${NC} $result"
    elif [[ $result == *"FAILED"* ]]; then
        echo -e "${RED}✗${NC} $result"
    else
        echo -e "${YELLOW}?${NC} $result"
    fi
done

echo ""

# Check what was built
DIST_DIR="$PROJECT_ROOT/downloads"
if [ -d "$DIST_DIR" ]; then
    echo_section "Built Files"
    echo "Location: $DIST_DIR"
    echo ""
    
    if [ -f "$DIST_DIR/wipeout-linux" ]; then
        SIZE=$(stat -c%s "$DIST_DIR/wipeout-linux" 2>/dev/null || stat -f%z "$DIST_DIR/wipeout-linux" 2>/dev/null || echo "unknown")
        SIZE_MB=$(echo "scale=1; $SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓${NC} Linux executable: wipeout-linux (${SIZE_MB} MB)"
    fi
    
    if [ -f "$DIST_DIR/secure-wiper-windows.exe" ]; then
        SIZE=$(stat -c%s "$DIST_DIR/secure-wiper-windows.exe" 2>/dev/null || stat -f%z "$DIST_DIR/secure-wiper-windows.exe" 2>/dev/null || echo "unknown")
        SIZE_MB=$(echo "scale=1; $SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓${NC} Windows executable: wipeout-windows.exe (${SIZE_MB} MB)"
    fi
    
    if [ -f "$DIST_DIR/wipeout-macos" ]; then
        SIZE=$(stat -c%s "$DIST_DIR/wipeout-macos" 2>/dev/null || stat -f%z "$DIST_DIR/wipeout-macos" 2>/dev/null || echo "unknown")
        SIZE_MB=$(echo "scale=1; $SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓${NC} macOS executable: wipeout-macos (${SIZE_MB} MB)"
    fi
    
    echo ""
    
    # List all files in downloads directory
    echo "All files in downloads directory:"
    ls -la "$DIST_DIR" 2>/dev/null || echo "Directory is empty or doesn't exist"
fi

echo ""
echo_section "Next Steps"
echo "1. Test the built executables on their respective platforms"
echo "2. Sign the executables for production use (optional)"
echo "3. Create installation packages (MSI, DEB, etc.) if needed"
echo "4. Upload to distribution channels"
echo ""

# Check for any failures
FAILED_COUNT=$(echo "${BUILD_RESULTS[@]}" | grep -o "FAILED" | wc -l)
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo_warn "$FAILED_COUNT platform(s) failed to build. Check the logs above for details."
    exit 1
else
    echo_info "All requested builds completed successfully!"
fi

echo_info "Multi-platform build process completed!"

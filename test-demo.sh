#!/bin/bash

# Comprehensive test and demo script for Secure Data Wiper MVP
# This script sets up a complete demo environment and runs tests

set -e

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

# Configuration
PROJECT_ROOT="$(pwd)"
DEMO_DIR="$PROJECT_ROOT/demo-environment"
TEST_FILE="$DEMO_DIR/test-device.img"
TEST_SIZE_MB=10

echo_section "WipeOut MVP - Demo Setup"
echo "Project root: $PROJECT_ROOT"
echo ""

# Check prerequisites
echo_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo_error "Node.js not found. Please install Node.js 16 or later."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo_error "Node.js version 16 or later required. Found: $(node --version)"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo_error "Python 3 not found. Please install Python 3.8 or later."
    exit 1
fi

echo_info "Prerequisites check passed!"

# Create demo environment
echo_section "Setting up demo environment..."

mkdir -p "$DEMO_DIR"
cd "$PROJECT_ROOT"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo_info "Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "core-engine/venv" ]; then
    echo_info "Setting up Python virtual environment..."
    cd core-engine
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Create test files
echo_info "Creating test files..."

# Create test device image
if [ ! -f "$TEST_FILE" ]; then
    echo_info "Creating ${TEST_SIZE_MB}MB test device image..."
    dd if=/dev/zero of="$TEST_FILE" bs=1M count=$TEST_SIZE_MB 2>/dev/null
    
    # Add some test data
    echo "SENSITIVE DATA - This should be wiped" >> "$TEST_FILE"
    echo "Confidential information" >> "$TEST_FILE"
    echo "Personal data that needs secure deletion" >> "$TEST_FILE"
fi

# Create test configuration
cat > "$DEMO_DIR/demo-config.yaml" << EOF
api:
  enabled: true
  base_url: http://localhost:3001
  timeout: 30

wipe:
  buffer_size: 65536  # 64KB for faster demo
  verify_after_wipe: true
  default_algorithm: nist

logging:
  level: INFO
  console: true

security:
  require_admin: false  # Disabled for demo
  check_device_permissions: false
EOF

echo_info "Demo environment setup complete!"

# Start services
echo_section "Starting services..."

# Start backend
echo_info "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo_info "Waiting for backend to start..."
sleep 5

# Check backend health
if curl -f http://localhost:3001/health &> /dev/null; then
    echo_info "Backend server is running!"
else
    echo_error "Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend
echo_info "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo_info "Waiting for frontend to start..."
sleep 10

echo_info "Services started successfully!"
echo_info "Frontend: http://localhost:3000"
echo_info "Backend: http://localhost:3001"

# Run core engine tests
echo_section "Testing core engine..."

cd core-engine
source venv/bin/activate

echo_info "Testing device detection..."
python -m secure_wiper.main list-devices || echo_warn "Device detection may require admin privileges"

echo_info "Testing wipe operation on test file..."
python -m secure_wiper.main wipe "$TEST_FILE" \
    --algorithm nist \
    --passes 1 \
    --verify \
    --force \
    --output "$DEMO_DIR/demo-report.json" \
    --config "$DEMO_DIR/demo-config.yaml"

if [ -f "$DEMO_DIR/demo-report.json" ]; then
    echo_info "Wipe operation completed! Report generated."
    
    # Show report summary
    echo_info "Wipe report summary:"
    python3 -c "
import json
with open('$DEMO_DIR/demo-report.json', 'r') as f:
    data = json.load(f)
print(f\"  Device: {data.get('device_id', 'Unknown')}\")
print(f\"  Status: {data.get('status', 'Unknown')}\")
print(f\"  Algorithm: {data.get('algorithm', 'Unknown')}\")
print(f\"  Duration: {data.get('duration', 'Unknown')}\")
print(f\"  Submission ID: {data.get('submission_id', 'Unknown')}\")
"
else
    echo_error "Wipe operation failed - no report generated"
fi

deactivate
cd ..

# Test API endpoints
echo_section "Testing API endpoints..."

echo_info "Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.' || echo_warn "jq not available for JSON formatting"

echo_info "Testing wipe submission..."
if [ -f "$DEMO_DIR/demo-report.json" ]; then
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/wipe/submit \
        -H "Content-Type: application/json" \
        -d @"$DEMO_DIR/demo-report.json")
    
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    # Extract certificate ID if available
    CERT_ID=$(echo "$RESPONSE" | jq -r '.data.certificate.certificateId' 2>/dev/null || echo "")
    
    if [ -n "$CERT_ID" ] && [ "$CERT_ID" != "null" ]; then
        echo_info "Certificate generated with ID: $CERT_ID"
        
        # Test certificate verification
        echo_info "Testing certificate verification..."
        curl -s "http://localhost:3001/api/certificate/verify/$CERT_ID" | jq '.' 2>/dev/null || echo_warn "Certificate verification test failed"
    fi
fi

echo_info "Testing download endpoints..."
curl -s http://localhost:3001/api/download/tools | jq '.data.tools | keys' 2>/dev/null || echo_warn "Download tools endpoint test failed"

curl -s http://localhost:3001/api/download/detect-os | jq '.' 2>/dev/null || echo_warn "OS detection endpoint test failed"

# Frontend tests
echo_section "Testing frontend..."

echo_info "Checking if frontend is accessible..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo_info "Frontend is accessible!"
else
    echo_warn "Frontend may still be starting up..."
fi

# Build tests
echo_section "Testing build system..."

echo_info "Testing build scripts..."
if [ -f "build-scripts/build-all.sh" ]; then
    echo_info "Build scripts are available. To test builds, run:"
    echo "  ./build-scripts/build-linux.sh"
    echo "  ./build-scripts/build-windows.sh"
    echo "  ./build-scripts/build-android.sh"
    echo "  ./build-scripts/build-all.sh"
else
    echo_warn "Build scripts not found"
fi

# Demo instructions
echo_section "Demo Instructions"
echo "=============================================="
echo ""
echo_info "Your WipeOut MVP is now running!"
echo ""
echo "🌐 Web Interface:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo ""
echo "📁 Demo Files:"
echo "   Test device: $TEST_FILE"
echo "   Wipe report: $DEMO_DIR/demo-report.json"
echo "   Configuration: $DEMO_DIR/demo-config.yaml"
echo ""
echo "🔧 Command Line Usage:"
echo "   cd core-engine && source venv/bin/activate"
echo "   python -m secure_wiper.main --help"
echo "   python -m secure_wiper.main list-devices"
echo ""
echo "📋 API Testing:"
echo "   Health: curl http://localhost:3001/health"
echo "   Tools: curl http://localhost:3001/api/download/tools"
echo "   OS Detection: curl http://localhost:3001/api/download/detect-os"
echo ""
echo "🏗️  Build Tools:"
echo "   ./build-scripts/build-linux.sh    # Build Linux executable"
echo "   ./build-scripts/build-windows.sh  # Build Windows executable"
echo "   ./build-scripts/build-macos.sh    # Build macOS executable"
echo "   ./build-scripts/build-all.sh      # Build all platforms"
echo ""
echo "📖 Documentation:"
echo "   Demo Guide: docs/DEMO.md"
echo "   Deployment: docs/DEPLOYMENT.md"
echo ""

# Cleanup function
cleanup() {
    echo_section "Cleaning up..."
    
    if [ -n "$BACKEND_PID" ]; then
        echo_info "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo_info "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo_info "Cleanup complete!"
}

# Set up cleanup on exit
trap cleanup EXIT

echo_section "Demo Environment Ready!"
echo ""
echo_info "Press Ctrl+C to stop all services and exit"
echo_info "Or open a new terminal to continue using the system"
echo ""

# Keep script running
while true; do
    sleep 1
done

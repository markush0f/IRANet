#!/bin/bash
# =============================================================================
# IRA Agent Installer
# =============================================================================
# Usage:
#   curl -s https://your-iranet-host/install.sh | bash -s -- \
#     --server-id "prod-web-1" \
#     --database-dsn "postgresql+asyncpg://user:pass@host:5432/ira" \
#     [--repo "https://github.com/user/iranet"]
#
# Or run directly on the server:
#   ./install-ira.sh --server-id prod-web-1 --database-dsn "..."
# =============================================================================

set -e

IRA_VERSION="0.1.0"
INSTALL_DIR="/opt/ira"
SERVICE_NAME="ira-agent"

# Defaults
REPO_URL=""
SERVER_ID=""
DATABASE_DSN=""

usage() {
    echo "Usage: $0 --server-id <id> --database-dsn <dsn> [--repo <url>]"
    echo ""
    echo "Arguments:"
    echo "  --server-id      Unique identifier for this server (e.g. prod-web-1)"
    echo "  --database-dsn   PostgreSQL connection string"
    echo "  --repo           Git repo URL (optional, for development)"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --server-id)
            SERVER_ID="$2"
            shift 2
            ;;
        --database-dsn)
            DATABASE_DSN="$2"
            shift 2
            ;;
        --repo)
            REPO_URL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [[ -z "$SERVER_ID" ]] || [[ -z "$DATABASE_DSN" ]]; then
    usage
fi

echo "==> IRA Agent Installer v${IRA_VERSION}"
echo "==> Server ID: ${SERVER_ID}"
echo ""

# Detect install method
if command -v docker &> /dev/null; then
    INSTALL_METHOD="docker"
    echo "==> Method: Docker"
elif command -v python3 &> /dev/null; then
    INSTALL_METHOD="python"
    echo "==> Method: Python (native)"
else
    echo "==> ERROR: Neither Docker nor Python 3 found"
    exit 1
fi

echo "==> Creating installation directory..."
sudo mkdir -p "${INSTALL_DIR}"
cd "${INSTALL_DIR}"

if [[ -n "$REPO_URL" ]]; then
    echo "==> Cloning repository..."
    if [[ -d ".git" ]]; then
        sudo git pull
    else
        sudo git clone "$REPO_URL" .
    fi
else
    echo "==> No repo specified, using local installation"
fi

if [[ "$INSTALL_METHOD" == "docker" ]]; then
    echo "==> Building Docker image..."
    sudo docker build -t ira-agent:${SERVER_ID} .

    echo "==> Creating systemd service..."
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=IRA Agent - Infrastructure Runtime Analyzer
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
Environment="IRA_SERVER_ID=${SERVER_ID}"
Environment="IRA_DATABASE_DSN=${DATABASE_DSN}"
ExecStart=/usr/bin/docker run --rm --network host --name ira-agent-${SERVER_ID} \\
  -e IRA_SERVER_ID=${SERVER_ID} \\
  -e IRA_DATABASE_DSN=${DATABASE_DSN} \\
  -v /proc:/host/proc:ro \\
  -v /var/log:/host/logs:ro \\
  ira-agent:${SERVER_ID}

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Enabling and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl restart ${SERVICE_NAME}

else
    echo "==> Installing Python dependencies..."
    pip install --no-cache-dir -r requirements.txt

    echo "==> Creating systemd service..."
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=IRA Agent - Infrastructure Runtime Analyzer
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
WorkingDirectory=${INSTALL_DIR}
Environment="IRA_SERVER_ID=${SERVER_ID}"
Environment="IRA_DATABASE_DSN=${DATABASE_DSN}"
ExecStart=uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Enabling and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl restart ${SERVICE_NAME}
fi

echo ""
echo "==> Installation complete!"
echo "==> Server ID: ${SERVER_ID}"
echo "==> Service: ${SERVICE_NAME}"
echo ""
echo "==> Check status with:"
echo "    sudo systemctl status ${SERVICE_NAME}"
echo "    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "==> View logs:"
echo "    sudo tail -f /var/log/ira/ira.log"

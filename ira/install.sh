#!/bin/bash
# =============================================================================
# IRANet Backend Installer
# =============================================================================
# Usage:
#   curl -sL https://your-iranet/install.sh | bash -s -- \
#     --server-id "prod-web-1" \
#     --database-dsn "postgresql+asyncpg://user:pass@host:5432/ira"
#
# Options:
#   --server-id      Unique identifier for this server (required)
#   --database-dsn   PostgreSQL connection string (required)
#   --method         Installation method: pull|build  (default: pull if Docker available)
#   --image          Docker image to pull (default: ghcr.io/markush0f/iranet/ira-backend:latest)
#   --server-name    Human-readable server name
#   --backend-base-url Public backend URL, for example http://10.0.0.21:8000
#   --backend-port   Backend port exposed on the server (default: 8000)
#   --environment    Environment label, for example production
#   --capabilities   Comma-separated capabilities
#   --repo           Git repo for build method (default: https://github.com/markush0f/IRANet)
#   --branch         Git branch for build method (default: main)
# =============================================================================

set -e

INSTALL_DIR="/opt/ira"
SERVICE_NAME="iranet-backend"
METHOD=""
IMAGE_URL=""
REPO_URL="https://github.com/markush0f/IRANet"
BRANCH="main"
SERVER_ID=""
DATABASE_DSN=""
SERVER_NAME=""
BACKEND_BASE_URL=""
BACKEND_PORT="8000"
ENVIRONMENT=""
CAPABILITIES=""

usage() {
    echo "Usage: $0 --server-id <id> --database-dsn <dsn> [options]"
    echo ""
    echo "Required:"
    echo "  --server-id      Unique identifier for this server"
    echo "  --database-dsn   PostgreSQL connection string"
    echo ""
    echo "Options:"
    echo "  --method         Installation method: pull|build  (default: pull)"
    echo "  --image          Docker image for pull method"
    echo "                   (default: ghcr.io/markush0f/iranet/ira-backend:latest)"
    echo "  --server-name    Human-readable server name"
    echo "  --backend-base-url Public backend URL, for example http://10.0.0.21:8000"
    echo "  --backend-port   Backend port exposed on the server (default: 8000)"
    echo "  --environment    Environment label"
    echo "  --capabilities   Comma-separated capabilities"
    echo "  --repo           Git repo URL for build method"
    echo "  --branch         Git branch for build method"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --server-id)
            SERVER_ID="$2"; shift 2 ;;
        --database-dsn)
            DATABASE_DSN="$2"; shift 2 ;;
        --method)
            METHOD="$2"; shift 2 ;;
        --image)
            IMAGE_URL="$2"; shift 2 ;;
        --server-name)
            SERVER_NAME="$2"; shift 2 ;;
        --backend-base-url)
            BACKEND_BASE_URL="$2"; shift 2 ;;
        --backend-port)
            BACKEND_PORT="$2"; shift 2 ;;
        --environment)
            ENVIRONMENT="$2"; shift 2 ;;
        --capabilities)
            CAPABILITIES="$2"; shift 2 ;;
        --repo)
            REPO_URL="$2"; shift 2 ;;
        --branch)
            BRANCH="$2"; shift 2 ;;
        *) usage ;;
    esac
done

[[ -z "$SERVER_ID" ]] || [[ -z "$DATABASE_DSN" ]] && usage

if command -v docker &> /dev/null; then
    DOCKER_AVAILABLE=true
else
    DOCKER_AVAILABLE=false
fi

if [[ -z "$METHOD" ]]; then
    if $DOCKER_AVAILABLE; then
        METHOD="pull"
    else
        METHOD="python"
    fi
fi

IMAGE_URL="${IMAGE_URL:-ghcr.io/markush0f/iranet/ira-backend:latest}"

echo "==> IRANet Backend Installer"
echo "==> Server ID: ${SERVER_ID}"
echo "==> Method: ${METHOD}"
[[ "$METHOD" == "pull" ]] && echo "==> Image: ${IMAGE_URL}"
[[ -n "$BACKEND_BASE_URL" ]] && echo "==> Backend URL: ${BACKEND_BASE_URL}"
echo ""

install_docker_pull() {
    echo "==> Pulling Docker image..."
    docker pull "${IMAGE_URL}"

    echo "==> Creating systemd service..."
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=IRANet Backend - Infrastructure Runtime Analyzer
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
ExecStart=/usr/bin/docker run --rm \
    --network host \
    --name iranet-backend-${SERVER_ID} \
    -e IRA_SERVER_ID=${SERVER_ID} \
    -e IRA_DATABASE_DSN=${DATABASE_DSN} \
    -e IRA_SERVER_NAME=${SERVER_NAME} \
    -e IRA_AGENT_BASE_URL=${BACKEND_BASE_URL} \
    -e IRA_AGENT_PORT=${BACKEND_PORT} \
    -e IRA_SERVER_ENVIRONMENT=${ENVIRONMENT} \
    -e IRA_SERVER_CAPABILITIES=${CAPABILITIES} \
    -v /proc:/host/proc:ro \
    -v /var/log:/host/logs:ro \
    ${IMAGE_URL}

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Enabling and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl restart ${SERVICE_NAME}
}

install_docker_build() {
    echo "==> Cloning repository..."
    sudo mkdir -p "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
    if [[ -d ".git" ]]; then
        sudo git pull
    else
        sudo git clone --branch "${BRANCH}" "${REPO_URL}" .
    fi

    echo "==> Building Docker image..."
    docker build -t "iranet-backend:${SERVER_ID}" .

    echo "==> Creating systemd service..."
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=IRANet Backend - Infrastructure Runtime Analyzer
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
ExecStart=/usr/bin/docker run --rm \
    --network host \
    --name iranet-backend-${SERVER_ID} \
    -e IRA_SERVER_ID=${SERVER_ID} \
    -e IRA_DATABASE_DSN=${DATABASE_DSN} \
    -e IRA_SERVER_NAME=${SERVER_NAME} \
    -e IRA_AGENT_BASE_URL=${BACKEND_BASE_URL} \
    -e IRA_AGENT_PORT=${BACKEND_PORT} \
    -e IRA_SERVER_ENVIRONMENT=${ENVIRONMENT} \
    -e IRA_SERVER_CAPABILITIES=${CAPABILITIES} \
    -v /proc:/host/proc:ro \
    -v /var/log:/host/logs:ro \
    iranet-backend:${SERVER_ID}

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Enabling and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl restart ${SERVICE_NAME}
}

install_python() {
    echo "==> Cloning repository..."
    sudo mkdir -p "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
    if [[ -d ".git" ]]; then
        sudo git pull
    else
        sudo git clone --branch "${BRANCH}" "${REPO_URL}" .
    fi

    echo "==> Installing Python dependencies..."
    pip install --no-cache-dir -r requirements.txt 2>/dev/null || \
        pip3 install --no-cache-dir -r requirements.txt

    echo "==> Creating systemd service..."
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=IRANet Backend - Infrastructure Runtime Analyzer
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
WorkingDirectory=${INSTALL_DIR}
Environment="IRA_SERVER_ID=${SERVER_ID}"
Environment="IRA_DATABASE_DSN=${DATABASE_DSN}"
Environment="IRA_SERVER_NAME=${SERVER_NAME}"
Environment="IRA_AGENT_BASE_URL=${BACKEND_BASE_URL}"
Environment="IRA_AGENT_PORT=${BACKEND_PORT}"
Environment="IRA_SERVER_ENVIRONMENT=${ENVIRONMENT}"
Environment="IRA_SERVER_CAPABILITIES=${CAPABILITIES}"
ExecStart=uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

    echo "==> Enabling and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl restart ${SERVICE_NAME}
}

case "$METHOD" in
    pull)
        if ! $DOCKER_AVAILABLE; then
            echo "ERROR: Docker not found. Use --method build or --method python"
            exit 1
        fi
        install_docker_pull
        ;;
    build)
        if ! $DOCKER_AVAILABLE; then
            echo "ERROR: Docker not found. Use --method python"
            exit 1
        fi
        install_docker_build
        ;;
    python)
        install_python
        ;;
    *)
        echo "ERROR: Unknown method '$METHOD'. Use pull|build|python"
        exit 1
        ;;
esac

echo ""
echo "==> Installation complete!"
echo "==> Server ID: ${SERVER_ID}"
echo "==> Service: ${SERVICE_NAME}"
echo ""
echo "==> Check status:"
echo "    sudo systemctl status ${SERVICE_NAME}"
echo ""
echo "==> View logs:"
echo "    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "==> The backend will register with IRANet within 10 seconds."

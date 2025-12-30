#!/bin/sh
set -e

if command -v node >/dev/null 2>&1; then
    echo "Node.js already installed"
    exit 0
fi

echo "Installing Node.js..."

apt-get update
apt-get install -y curl ca-certificates gnupg

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Node.js installed"

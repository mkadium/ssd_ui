#!/usr/bin/env bash
set -euo pipefail

: "${SSD_DEV_HOST:?Set SSD_DEV_HOST}"
: "${SSD_DEV_OS_USER:?Set SSD_DEV_OS_USER}"
: "${SSD_DEV_SSH_PORT:=2288}"
: "${SSD_DEV_ENV:=dev}"

TARGET_DIR="/home/${SSD_DEV_OS_USER}/ssd_ui_dev_deploy"
WEB_ROOT="/var/www/ssd-ui-dev"
NGINX_SITE="ssd-ui-dev"
REMOTE="${SSD_DEV_OS_USER}@${SSD_DEV_HOST}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_ROOT="${REPO_ROOT}/frontend"
API_BASE_URL="${SSD_DEV_UI_API_BASE_URL:-https://${SSD_DEV_HOST}/api}"

SSH_OPTS=(-p "${SSD_DEV_SSH_PORT}")
if [[ -n "${SSD_DEV_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "${SSD_DEV_SSH_KEY}")
fi

RSYNC_SSH="ssh -p ${SSD_DEV_SSH_PORT}"
if [[ -n "${SSD_DEV_SSH_KEY:-}" ]]; then
  RSYNC_SSH="${RSYNC_SSH} -i ${SSD_DEV_SSH_KEY}"
fi

echo "Deploying SSD UI to ${SSD_DEV_ENV} at ${REMOTE}"
echo "Source root: ${FRONTEND_ROOT}"
echo "API base URL for browser build: ${API_BASE_URL}"

cd "${FRONTEND_ROOT}"
VITE_SSD_API_BASE_URL="${API_BASE_URL}" npm run build

ssh "${SSH_OPTS[@]}" "${REMOTE}" "mkdir -p '${TARGET_DIR}/dist'"

if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete -e "${RSYNC_SSH}" "${FRONTEND_ROOT}/dist/" "${REMOTE}:${TARGET_DIR}/dist/"
else
  tar -C "${FRONTEND_ROOT}/dist" -czf - . | ssh "${SSH_OPTS[@]}" "${REMOTE}" "tar -xzf - -C '${TARGET_DIR}/dist'"
fi

ssh "${SSH_OPTS[@]}" "${REMOTE}" "SSD_DEV_HOST='${SSD_DEV_HOST}' TARGET_DIR='${TARGET_DIR}' WEB_ROOT='${WEB_ROOT}' NGINX_SITE='${NGINX_SITE}' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required to configure Nginx." >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx openssl
fi

sudo mkdir -p "${WEB_ROOT}" /etc/nginx/ssl
sudo rsync -a --delete "${TARGET_DIR}/dist/" "${WEB_ROOT}/"

if [[ ! -f "/etc/nginx/ssl/ssd-ui-dev.crt" || ! -f "/etc/nginx/ssl/ssd-ui-dev.key" ]]; then
  TMP_OPENSSL_CNF="$(mktemp)"
  cat > "${TMP_OPENSSL_CNF}" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = ${SSD_DEV_HOST}

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${SSD_DEV_HOST}
DNS.1 = localhost
EOF
  sudo openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/ssd-ui-dev.key \
    -out /etc/nginx/ssl/ssd-ui-dev.crt \
    -config "${TMP_OPENSSL_CNF}"
  rm -f "${TMP_OPENSSL_CNF}"
fi

sudo tee "/etc/nginx/sites-available/${NGINX_SITE}" >/dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate /etc/nginx/ssl/ssd-ui-dev.crt;
    ssl_certificate_key /etc/nginx/ssl/ssd-ui-dev.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root ${WEB_ROOT};
    index index.html;

    client_max_body_size 25m;

    location /api/ {
        proxy_pass http://127.0.0.1:8100/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"
sudo nginx -t
sudo systemctl reload nginx || sudo service nginx reload

curl --fail --silent --show-error --insecure "https://127.0.0.1/" >/dev/null
curl --fail --silent --show-error --insecure "https://127.0.0.1/api/health" >/dev/null
REMOTE_SCRIPT

echo "SSD UI deployed:"
echo "  https://${SSD_DEV_HOST}/"
echo "  https://${SSD_DEV_HOST}/api/health"

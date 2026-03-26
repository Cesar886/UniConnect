#!/usr/bin/env bash
set -e

# ── Configuración ──────────────────────────────────────────────
SERVER_USER="um"
SERVER_HOST="64.23.168.72"
SERVER_PATH="/home/um/uniconnect-web"
SSH_KEY="$HOME/.ssh/id_ed25519"
PM2_APP="umatch-web"
# ───────────────────────────────────────────────────────────────

echo "▶ Subiendo código fuente al servidor..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  --exclude node_modules \
  --exclude .next \
  --exclude deploy.sh \
  ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

echo "▶ Instalando dependencias en el servidor..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
  cd $SERVER_PATH
  npm install --omit=dev
"

echo "▶ Construyendo en el servidor..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
  cd $SERVER_PATH
  npm run build
"

echo "▶ Reiniciando PM2..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
  pm2 restart $PM2_APP
"

echo "✓ Deploy completado."

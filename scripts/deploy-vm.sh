#!/usr/bin/env bash
# ==============================================================================
# Script de Déploiement Consolidé & Mise à Jour Continue — Atelier de Conception
# Compatible : Oracle Linux 8/9 (dnf/firewalld) ET Ubuntu/Debian (apt/iptables)
# ==============================================================================
set -euo pipefail

REPO_URL="https://github.com/antoineacquaviva/Projet_Jeu.git"
APP_DIR="${HOME}/Projet_Jeu"
PORT="${PORT:-3000}"
SERVICE_NAME="atelier-conception"
STATE_FILE="${APP_DIR}/resultats/atelier-v1-state.json"
BACKUP_STATE="/tmp/atelier-v1-state.backup.json"

echo "=================================================================="
echo "  DÉPLOIEMENT ATELIER DE CONCEPTION (V0.1 · V0.2 · V0.3) — OCI VM"
echo "=================================================================="

# 1. Vérification de Node.js 20+
if ! command -v node >/dev/null 2>&1; then
  echo "[0/4] Installation de Node.js 20 LTS..."
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf module reset nodejs -y || true
    sudo dnf module enable nodejs:20 -y
    sudo dnf install -y nodejs git
  elif command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git
  fi
fi

# 2. Clonage ou synchronisation GitHub en préservant resultats/atelier-v1-state.json
echo "[1/4] Synchronisation GitHub (${APP_DIR})..."
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
else
  cd "${APP_DIR}"
  if [ -f "${STATE_FILE}" ]; then
    cp -f "${STATE_FILE}" "${BACKUP_STATE}"
  fi
  git fetch origin main
  git reset --hard origin/main
  if [ -f "${BACKUP_STATE}" ]; then
    mkdir -p "$(dirname "${STATE_FILE}")"
    cp -f "${BACKUP_STATE}" "${STATE_FILE}"
  fi
fi

# 3. Installation des dépendances et build front-end
echo "[2/4] Installation des paquets npm et compilation..."
npm install --no-audit --no-fund
npm run build

# 4. Ouverture du port 3000 dans firewalld (Oracle Linux) ET iptables
echo "[3/4] Ouverture du port ${PORT}/tcp dans le pare-feu OS (firewalld + iptables)..."
if command -v firewall-cmd >/dev/null 2>&1 && sudo systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent --add-port=${PORT}/tcp || true
  sudo firewall-cmd --reload || true
fi
if command -v iptables >/dev/null 2>&1; then
  sudo iptables -C INPUT -p tcp --dport "${PORT}" -j ACCEPT 2>/dev/null || \
    sudo iptables -I INPUT 1 -p tcp --dport "${PORT}" -j ACCEPT || true
fi

# 5. Redémarrage du service systemd
echo "[4/4] Configuration et redémarrage du service systemd (${SERVICE_NAME})..."
USER_NAME="$(whoami)"
NODE_BIN_DIR="$(dirname "$(command -v node)")"

sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<EOF
[Unit]
Description=Atelier de Conception - La Foret qui Reve (V0.1/V0.2/V0.3)
After=network.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Environment=PATH=${NODE_BIN_DIR}:/usr/local/bin:/usr/bin:/bin
ExecStart=$(command -v npm) start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"

echo "=================================================================="
echo "  DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "  Interface Web : http://$(curl -s --max-time 3 ifconfig.me || echo 'VOTRE_IP_PUBLIQUE'):${PORT}"
echo "  Lancer une campagne intensive VM en CLI : npx tsx scripts/vm-worker.ts --once"
echo "=================================================================="

#!/usr/bin/env bash
set -e

# ==============================================================================
# Uninstaller for Taiwan NHI IC Card Component (mLNHIICC) on Ubuntu
# ==============================================================================

if [ "$(id -u)" -ne 0 ]; then
    echo "[-] Error: This script must be run as root."
    echo "[-] Please run: sudo ./uninstall_ubuntu26.sh"
    exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

echo "[*] Uninstalling NHIICC for user: $REAL_USER..."

# 1. Stop and disable systemd service
if systemctl is-enabled --quiet nhiicc.service 2>/dev/null || systemctl is-active --quiet nhiicc.service 2>/dev/null; then
    echo "[+] Stopping and disabling nhiicc.service..."
    systemctl stop nhiicc.service 2>/dev/null || true
    systemctl disable nhiicc.service 2>/dev/null || true
    rm -f /etc/systemd/system/nhiicc.service
    systemctl daemon-reload
fi

killall mLNHIICC 2>/dev/null || true

# 2. Remove files
echo "[+] Removing /usr/local/share/NHIICC..."
rm -rf /usr/local/share/NHIICC

# 3. Clean up certificates from trust stores
echo "[+] Removing CA from system and browser trust stores..."
trust anchor --remove /usr/local/share/ca-certificates/NHIRootCA.crt 2>/dev/null || true
rm -f /usr/local/share/ca-certificates/NHIRootCA.crt
update-ca-certificates > /dev/null

if [ -d "$REAL_HOME/.pki/nssdb" ]; then
    su - "$REAL_USER" -c "certutil -d sql:'$REAL_HOME/.pki/nssdb' -D -n 'NHI.Root.CA' 2>/dev/null || true"
fi

for profile in "$REAL_HOME"/snap/firefox/common/.mozilla/firefox/*.default* "$REAL_HOME"/.mozilla/firefox/*.default*; do
    if [ -d "$profile" ]; then
        su - "$REAL_USER" -c "certutil -d sql:'$profile' -D -n 'NHI.Root.CA' 2>/dev/null || true"
    fi
done

# 4. Remove /etc/hosts mapping
echo "[+] Cleaning /etc/hosts..."
sed -i '/iccert\.nhi\.gov\.tw/d' /etc/hosts

echo "======================================================================"
echo " [✓] NHIICC component uninstalled cleanly."
echo "======================================================================"

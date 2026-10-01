#!/usr/bin/env bash
set -e

# ==============================================================================
# Installer for Taiwan NHI IC Card Component (mLNHIICC) on Ubuntu 26.04 LTS
# Customized to fix compatibility issues, secure CA keys, and handle Snap Firefox.
# ==============================================================================

if [ "$(id -u)" -ne 0 ]; then
    echo "[-] Error: This script must be run as root."
    echo "[-] Please run: sudo ./install_ubuntu26.sh"
    exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/usr/local/share/NHIICC"

echo "[*] Installing for user: $REAL_USER (Home: $REAL_HOME)"
echo "[*] Source directory: $SCRIPT_DIR"

# 1. Install prerequisites
echo "[+] Step 1: Installing system prerequisites..."
apt-get update -y
apt-get install -y pcscd libpcsclite1 libnss3-tools openssl ca-certificates pcsc-tools

echo "[+] Configuring udev rules and permissions for smart card readers..."
cat << 'EOF' > /etc/udev/rules.d/99-smartcard-pcscd.rules
SUBSYSTEM=="usb", ENV{ID_USB_INTERFACES}=="*:0b0000:*", GROUP="pcscd", MODE="0666", TEST=="power/control", ATTR{power/control}="on"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0ca6", ATTRS{idProduct}=="00a0", GROUP="pcscd", MODE="0666", TEST=="power/control", ATTR{power/control}="on"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0a5c", ATTRS{idProduct}=="5843", GROUP="pcscd", MODE="0666"
EOF
mkdir -p /etc/systemd/system/pcscd.service.d
cat << 'EOF' > /etc/systemd/system/pcscd.service.d/override.conf
[Service]
User=root
EOF
udevadm control --reload-rules
udevadm trigger

echo "[+] Enabling and starting smart card service (pcscd)..."
systemctl daemon-reload
systemctl enable --now pcscd
systemctl restart pcscd

# 2. Add /etc/hosts mapping
echo "[+] Step 2: Configuring /etc/hosts..."
if ! grep -q "iccert\.nhi\.gov\.tw" /etc/hosts; then
    echo "127.0.0.1 iccert.nhi.gov.tw" >> /etc/hosts
    echo "    Added '127.0.0.1 iccert.nhi.gov.tw' to /etc/hosts"
else
    echo "    Mapping already exists in /etc/hosts."
fi

# 3. Stop existing daemon if running
echo "[+] Step 3: Stopping any existing mLNHIICC instances..."
killall mLNHIICC 2>/dev/null || true

# 4. Deploy binaries and web assets
echo "[+] Step 4: Deploying files to $TARGET_DIR..."
mkdir -p "$TARGET_DIR/cert"
cp -r "$SCRIPT_DIR/web" "$TARGET_DIR/"
cp "$SCRIPT_DIR/x64/mLNHIICC" "$TARGET_DIR/"
chmod 755 "$TARGET_DIR/mLNHIICC"
chmod -R 755 "$TARGET_DIR/web"

# 5. Generate fresh local certificates safely
echo "[+] Step 5: Generating secure local certificates..."
pushd "$TARGET_DIR/cert" > /dev/null

# Clean any existing certs
rm -f ca.key ca.crt localhost.key localhost.csr localhost.crt NHIServerCert.* NHIRootCA.* ca.srl

# Generate Root CA
openssl genpkey -algorithm RSA -out ca.key 2>/dev/null
openssl req -x509 -key ca.key -out ca.crt -subj "/CN=nhi-localhost-ca/O=nhi-localhost-ca" -days 3650

# Generate Server Certificate for localhost & iccert.nhi.gov.tw
openssl genpkey -algorithm RSA -out localhost.key 2>/dev/null
openssl req -new -key localhost.key -out localhost.csr -subj "/CN=localhost/O=nhi-localhost-ca"

openssl x509 -req -in localhost.csr -days 3650 -out localhost.crt \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -extfile <(cat <<END
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
subjectAltName = DNS:localhost,DNS:iccert.nhi.gov.tw,IP:127.0.0.1
END
) 2>/dev/null

cp localhost.crt NHIServerCert.crt
cp localhost.key NHIServerCert.key
cp ca.crt NHIRootCA.crt

# Enforce secure permissions: private keys are readable ONLY by root
chmod 600 *.key
chmod 644 *.crt
popd > /dev/null

# 6. Trust the Root CA
echo "[+] Step 6: Trusting Root CA in system and browsers..."

# System trust store
trust anchor "$TARGET_DIR/cert/ca.crt" 2>/dev/null || true
cp "$TARGET_DIR/cert/ca.crt" /usr/local/share/ca-certificates/NHIRootCA.crt
update-ca-certificates > /dev/null

# Google Chrome / Chromium (NSS DB)
if [ -d "$REAL_HOME/.pki/nssdb" ]; then
    echo "    Importing into Chrome/Chromium NSS store..."
    su - "$REAL_USER" -c "certutil -d sql:'$REAL_HOME/.pki/nssdb' -A -t 'C,,' -n 'NHI.Root.CA' -i '$TARGET_DIR/cert/NHIRootCA.crt' 2>/dev/null || true"
fi

# Firefox (Snap Profile)
FOUND_FF=0
for profile in "$REAL_HOME"/snap/firefox/common/.mozilla/firefox/*.default*; do
    if [ -d "$profile" ]; then
        echo "    Importing into Snap Firefox profile: $(basename "$profile")..."
        su - "$REAL_USER" -c "certutil -d sql:'$profile' -A -t 'TC,,' -n 'NHI.Root.CA' -i '$TARGET_DIR/cert/NHIRootCA.crt' 2>/dev/null || true"
        FOUND_FF=1
    fi
done

# Firefox (Native / APT Profile)
for profile in "$REAL_HOME"/.mozilla/firefox/*.default*; do
    if [ -d "$profile" ]; then
        echo "    Importing into Native Firefox profile: $(basename "$profile")..."
        su - "$REAL_USER" -c "certutil -d sql:'$profile' -A -t 'TC,,' -n 'NHI.Root.CA' -i '$TARGET_DIR/cert/NHIRootCA.crt' 2>/dev/null || true"
        FOUND_FF=1
    fi
done

if [ "$FOUND_FF" -eq 0 ]; then
    echo "    Notice: No Firefox profile folder found yet. If you use Firefox, launch it once and re-run this script."
fi

# 7. Create and enable Systemd service
echo "[+] Step 7: Configuring systemd service..."
cat << 'EOF' > /etc/systemd/system/nhiicc.service
[Unit]
Description=Taiwan National Health Insurance IC Card (NHIICC) Daemon
After=network.target pcscd.service
Wants=pcscd.service

[Service]
Type=simple
ExecStart=/usr/local/share/NHIICC/mLNHIICC
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nhiicc.service

# 8. Check service status
sleep 1
if systemctl is-active --quiet nhiicc.service; then
    echo "======================================================================"
    echo " [✓] Installation completed successfully!"
    echo "     Service 'nhiicc.service' is ACTIVE and running."
    echo "======================================================================"
    echo ""
    echo "Verification Steps:"
    echo "1. Connect your chip card reader and insert your NHI card."
    echo "2. Open either Chrome or Firefox, and navigate to:"
    echo "   file:///usr/local/share/NHIICC/web/ESample.html"
    echo "3. The page should show: 'Connected to server'."
    echo "4. Click '讀取健保卡基本資料' to test card reading."
    echo ""
else
    echo "[-] Warning: Service started but may not be active. Check: sudo systemctl status nhiicc.service"
fi

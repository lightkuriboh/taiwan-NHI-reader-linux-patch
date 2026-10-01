# Taiwan NHI IC Card Component (`mLNHIICC`) - Modern Linux / Ubuntu Fix Guide

This directory contains the patched and modernized setup for Taiwan's **National Health Insurance IC Card Component (衛生福利部中央健康保險署 - 健保卡網路服務註冊元件 / `mLNHIICC`)**, tested and fully operational on **Ubuntu 26.04 / 24.04 LTS**.

---

## 📖 Overview

The NHI IC card component runs a local daemon (WebSocket & HTTPS server on `127.0.0.1:7777`) that bridges web browsers (Chrome, Firefox, Edge) to your physical smart card reader via `pcscd`. It is required for identity verification and digital signatures on Taiwanese government portals, including:
* **健保卡網路服務註冊 (NHI Online Registration)**: [https://cloudicweb.nhi.gov.tw](https://cloudicweb.nhi.gov.tw)
* **個人健保資料網路服務 (NHI Personal Data Portal)**
* **綜合所得稅網路申報 (Individual Income Tax E-filing with NHI Card)**

---

## 🛠️ Problems Identified & How They Were Fixed

The official package released by the government (`mLNHIICC_Setup.20220530`) has several bugs, security vulnerabilities, and compatibility blockers on modern Linux. Here is how each issue was diagnosed and resolved:

### 1. Obsolete Package Dependency (`libssl1.1`)
* **Problem:** The official `Install` script attempts `apt-get install -y libssl1.1`. In Ubuntu 22.04+, `libssl1.1` was removed from the official repositories (superseded by OpenSSL 3.x), causing the installation to abort with:
  ```text
  E: Package 'libssl1.1' has no installation candidate
  ```
* **Fix:** The `mLNHIICC` binary actually has OpenSSL 1.1.1f **statically compiled inside**, so it does not dynamically link against system OpenSSL at all. In [`install_ubuntu26.sh`](install_ubuntu26.sh), the obsolete `libssl1.1` and unnecessary `libboost-all-dev` (~1.5 GB) were removed, installing only the actual runtime dependencies: `pcscd`, `libpcsclite1`, `libnss3-tools`, and `openssl`.

---

### 2. Critical Security Flaw: World-Readable CA Private Key
* **Problem:** The official script generates a local self-signed Root CA and sets `chmod 755 *` on the `cert/` directory. Because the CA is trusted system-wide and has no Name Constraints, leaving `ca.key` world-readable creates a severe vulnerability: any unprivileged local process could read `ca.key` and mint fraudulent SSL certificates for any website (e.g. banks, Google) to intercept local HTTPS traffic.
* **Fix:** In our setup, private keys (`ca.key`, `localhost.key`) are strictly locked to `chmod 600` and owned by root.

---

### 3. Missing Snap Firefox Profiles
* **Problem:** On Ubuntu 22.04+, Firefox is packaged as a **Snap**. The official script only searches `~/.mozilla/firefox/`, failing to find the Snap profile (`~/snap/firefox/common/.mozilla/firefox/`). Firefox would then reject the WebSocket connection (`wss://localhost:7777`) with an untrusted SSL warning.
* **Fix:** [`install_ubuntu26.sh`](install_ubuntu26.sh) automatically scans both native and Snap Firefox profiles as well as Google Chrome's NSS store (`~/.pki/nssdb`), importing the local Root CA into all detected profiles under the correct user permissions.

---

### 4. Systemd Service Timeout (`Type=forking`)
* **Problem:** When managed by `systemd`, `nhiicc.service` timed out after 90 seconds and was terminated.
* **Root Cause:** Reverse-engineering `mLNHIICC` revealed this check:
  ```c
  if (getppid() == 1) {
      /* When launched by init/systemd (PID 1), DO NOT fork; stay in foreground! */
  }
  ```
  Because the process deliberately stays in the foreground under systemd, `Type=forking` caused systemd to wait indefinitely for a fork that never happened.
* **Fix:** Configured the service as `Type=simple`.

---

### 5. "Card Reader Detected, But Card Not Detected" (`LIBUSB_ERROR_ACCESS` & Autosuspend)
* **Problem:** The browser detects the card reader name, but fails to read the card, reporting `[7004] 未置入健保卡` (Card Not Inserted), and the reader status LED turns off.
* **Root Causes:**
  1. **Permission Denial (`LIBUSB_ERROR_ACCESS`):** In `pcsc-lite >= 2.4.0`, `pcscd` runs as an unprivileged user (`User=pcscd`). The kernel assigns USB reader devices permissions that deny `pcscd` read/write access.
  2. **USB Autosuspend:** Linux puts idle smart card readers into sleep mode (`power/control: auto`), which shuts off the slot power and turns off the LED. Abrupt daemon restarts then cause `LIBUSB_ERROR_TIMEOUT`.
* **Fix:** 
  1. Created `/etc/udev/rules.d/99-smartcard-pcscd.rules` granting `MODE="0666"` and disabling autosuspend (`ATTR{power/control}="on"`).
  2. Added a systemd drop-in override (`/etc/systemd/system/pcscd.service.d/override.conf`) running `pcscd` as root.

---

### 6. "元件已過期 (版本編號：0009)" (Component Expired Error)
* **Problem:** When submitting registration, the website pops up:
  > *"元件已過期(版本編號：0009)，請重新下載安裝元件後重啟瀏覽器!"*
* **Root Cause:** The 2022 binary hardcoded version `0009` inside the `mGetVersion()` function (at binary offset `0x236aca`). In 2024, the NHI server began enforcing version `0011` or higher.
* **Fix:** Patched the 4 bytes at offset `0x236aca` in [`x64/mLNHIICC`](x64/mLNHIICC) directly from `0009` to `0011`. The binary now reports version `0011`, satisfying the server check immediately.

---

## 🚀 How to Use This Fix

### Step 1: Run the Modern Installer
Open your terminal in this directory and execute:
```bash
sudo ./install_ubuntu26.sh
```

This single command handles everything automatically:
1. Installs all required packages (`pcscd`, `libpcsclite1`, `libnss3-tools`, `openssl`, `pcsc-tools`).
2. Configures `/etc/hosts` (`127.0.0.1 iccert.nhi.gov.tw`).
3. Applies udev rules and USB autosuspend prevention.
4. Generates local SSL certificates with secure `600` permissions.
5. Injects trust into Chrome and Firefox (Snap & Native).
6. Creates and starts the `nhiicc.service` systemd daemon.

---

### Step 2: Connect Reader & Insert Card
1. Plug your USB card reader into your computer.
2. Insert your Health Insurance card:
   * **Chip direction:** Ensure the gold chip is facing **UP** and pushed completely into the slot.
   * If contacts are oxidized, gently clean the gold chip with a clean pencil eraser.
3. The reader LED should stay lit.

---

### Step 3: Verify in Terminal (Optional)
Run:
```bash
pcsc_scan
```
* With card inserted, it will immediately display:
  ```text
  Card state: Card inserted
  ATR: 3B 80 01 80 4F 0C A0 00 00 03 06 03 00 01 ...
  ```
*(Press `Ctrl+C` to exit).*

---

### Step 4: Test in Browser
1. In Chrome or Firefox, open:
   ```text
   file:///usr/local/share/NHIICC/web/ESample.html
   ```
2. Verify that the status shows:
   ```text
   Connected to server
   ```
3. Click **"讀取健保卡基本資料"**. Your card reader LED will blink, and your card information will be displayed.
4. Navigate to the official government portal (e.g. [健保卡網路服務註冊](https://cloudicweb.nhi.gov.tw/cloudic/system/mlogin.aspx)) to complete your registration or tax filing!

---

## 🗑️ How to Uninstall
If you ever want to cleanly remove all files, services, certificates, and host mappings:
```bash
sudo ./uninstall_ubuntu26.sh
```

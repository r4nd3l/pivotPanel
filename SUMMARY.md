**professional, clean, technical specification** of your Raspberry Pi Kiosk setup — deployment document.

---

# **📄 Raspberry Pi Kiosk System Specification**

**Device:** Raspberry Pi 3B+
**OS:** Raspberry Pi OS Bookworm (Wayland, KMS)
**Role:** Auto-launch Chromium in kiosk mode loading a target URL

---

# **1. System Purpose**

This specification defines the configuration required to deploy a Raspberry Pi as a **graphical kiosk panel**, automatically launching Chromium in kiosk mode on boot and loading a dedicated web interface.

The setup is designed for:

* unattended operation
* automatic boot into graphical session
* automatic kiosk browser launch
* no user interaction
* future custom UI control (e.g., web-controlled cursor hiding)

---

# **2. Functional Requirements**

### **2.1 Browser Autostart**

The system must automatically start Chromium as soon as the graphical desktop session becomes available.

### **2.2 Wayland Compatibility**

The system must support Raspberry Pi OS Bookworm default compositor (Wayfire/Wayland).

### **2.3 Kiosk Presentation**

Chromium must launch using:

* Fullscreen kiosk mode
* No chrome UI (tabs, infobars, dialogs)
* No crash dialogs
* Minimal user-facing OS interface

### **2.4 Configurability**

The target website must be easily changeable by editing a single environment variable inside the launch script.

### **2.5 Cursor Behavior**

System-level cursor hiding may not be reliable on Wayland; final cursor invisibility will be handled by the website via CSS.

---

# **3. System Components**

The kiosk system consists of:

| Component                 | Path                                        | Responsibility                             |
| ------------------------- | ------------------------------------------- | ------------------------------------------ |
| **Launch script**         | `/usr/local/bin/pivotPanel.sh`              | Detect Wayland session and launch Chromium |
| **Autostart entry**       | `~/.config/autostart/pivotPanel.desktop`    | Trigger script after desktop loads         |
| **Systemd user service**  | `~/.config/systemd/user/pivotPanel.service` | Optional alternative startup method        |
| **Optional cursor theme** | `~/.icons/blank/`                           | Unused—cursor controlled by website        |

The autostart `.desktop` method is the active and recommended approach.

---

# **4. Chromium Launch Script**

**File:** `/usr/local/bin/pivotPanel.sh`
**Permissions:** `chmod +x /usr/local/bin/pivotPanel.sh`

### **4.1 Responsibilities**

* Detect Wayland display socket
* Export required Wayland environment variables
* Gracefully wait for the compositor
* Launch Chromium in kiosk mode with stable flags

### **4.2 Script Specification**

```bash
#!/bin/bash
# pivotPanel.sh

URL="https://doihaveinternet.com/"

CHROMIUM_BIN=$(command -v chromium || command -v chromium-browser)

# Wait for Wayland socket
for i in {1..30}; do
    SOCKET=$(ls /run/user/$UID/wayland-* 2>/dev/null | head -n1)
    if [ -S "$SOCKET" ]; then
        export WAYLAND_DISPLAY=$(basename "$SOCKET")
        export XDG_RUNTIME_DIR="/run/user/$UID"
        break
    fi
    sleep 2
done

sleep 3  # compositor stabilization

"$CHROMIUM_BIN" --enable-features=UseOzonePlatform \
                 --ozone-platform=wayland \
                 --kiosk "$URL" \
                 --noerrdialogs \
                 --disable-infobars \
                 --password-store=basic \
                 --disable-session-crashed-bubble &
```

---

# **5. Desktop Autostart Configuration**

**File:** `~/.config/autostart/pivotPanel.desktop`

### **Specification**

* Launches kiosk script after graphical session starts
* Ensures session awareness (DISPLAY/XDG vars inherited)
* User-level configuration (per user, no root required)

### **Final Entry**

```ini
[Desktop Entry]
Type=Application
Name=Pivot Panel
Exec=/usr/local/bin/pivotPanel.sh
X-GNOME-Autostart-enabled=true
```

This mechanism is the primary startup method.

---

# **6. Optional: Systemd User Service**

**File:** `~/.config/systemd/user/pivotPanel.service`

While implemented, this method is not needed because the autostart method has full compatibility with Wayland on Raspberry Pi OS Bookworm.

```ini
[Unit]
Description=Launch Chromium Pivot Panel
After=graphical-session.target

[Service]
ExecStart=/usr/local/bin/pivotPanel.sh
Restart=on-failure
Environment=DISPLAY=:0

[Install]
WantedBy=graphical-session.target
```

---

# **7. Cursor Handling Approach**

Cursor hiding on Wayland using `unclutter` or Wayfire config is not fully reliable on Raspberry Pi OS.

**Decision:**
Cursor visibility will be controlled by the website.

### **Web-side Example**

```css
body {
  cursor: none;
}
```

---

# **8. Boot Workflow Summary**

1. System powers on
2. Pi boots into Wayland desktop session
3. Autostart daemon loads `.desktop` file
4. pivotPanel.sh runs
5. Wayland socket detection
6. Chromium launches in kiosk mode
7. Web UI takes control (including cursor styling)

---

# **9. Maintenance & Extensibility**

### Change the kiosk URL:

Edit in `/usr/local/bin/pivotPanel.sh`:

```bash
URL="https://your-new-url.com"
```

### Disable kiosk mode temporarily:

```bash
mv ~/.config/autostart/pivotPanel.desktop ~/.config/autostart/pivotPanel.desktop.disabled
```

### View logs from script:

Since autostart does not create journal logs, temporarily run:

```bash
/usr/local/bin/pivotPanel.sh
```

---

# **10. Specification Status**

**Status:** Operational
**Tested on:** Raspberry Pi OS Bookworm (Wayland)
**Last Verified:** Today


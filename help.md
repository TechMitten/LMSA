## Table of Contents

- Setup
  - [LM Studio Setup](#section-quick-start)
  - [Ollama Setup](#section-ollama-setup)
  - [OpenRouter Setup](#section-openrouter)
  - [Using Templates](#section-templates)
  - [Font & Text Size](#section-font-customization)
- Privacy
  - [Security & Privacy](#section-security-privacy)
  - [Ads & Privacy](#section-ads-privacy)
- Management
  - [Legacy Access](#section-legacy-access)
  - [Usage Limits](#section-limits)
  - [Troubleshooting](#section-troubleshooting)

---

## LM Studio Setup

- Start the LM Studio server on your computer (do NOT load a model yet).
- Enter server URL in [Settings](#) (IP:Port).
- Load models from LMSA using the 🤖 Models button in the sidebar's Options menu.
- Start chatting!

> **IMPORTANT:** Enable "CORS" and "Serve on local network" in LM Studio after starting your server. Make sure your device is on the same Wi‑Fi as the server computer.

**Always load models from within LMSA, not from LM Studio directly.** Loading models directly in LM Studio can cause multiple models to stack in memory instead of being replaced, leading to excessive resource usage on your server computer.

### Model Switching

You can switch between different models directly in the app:

1. Open the sidebar and tap **Options**.
2. Tap the 🤖 **Models** button.
3. Browse available models on your LM Studio server.
4. Tap **Load** next to your desired model.

The app will automatically eject the current model and load the new one.

### Default Model

Save a favorite model as the default so it automatically loads when you start the app:

1. Open the 🤖 **Models** menu from the sidebar's Options.
2. Find your preferred model in the list.
3. Tap the ⭐ star icon next to the model to mark it as default.
4. Tap the star again to remove the default.

---

## Ollama Setup

To connect LMSA to Ollama on your local network, configure Ollama to listen on all network interfaces. Follow the OS-specific steps below.

### Windows Instructions (Quick Method)

- Open the Ollama UI, click **Settings**, and enable **Expose Ollama to the network**.

Manual configuration:

1. Quit Ollama completely.
2. Open **Edit the system environment variables** → **Environment Variables**.
3. Under **User variables for [YourName]** click **New...**.
   - Variable name: `OLLAMA_HOST`
   - Variable value: `0.0.0.0`
4. Click OK and restart your computer.

### Linux Instructions

1. Edit the Ollama systemd service:

```
sudo nano /etc/systemd/system/ollama.service
```

2. In the `[Service]` section add:

```
Environment="OLLAMA_HOST=0.0.0.0"
```

3. Save and exit (Ctrl+O, Enter, Ctrl+X), then restart your computer.

---

## OpenRouter Setup

OpenRouter is a cloud AI service that lets you access hosted models using your API key. When enabled, LMSA sends requests to OpenRouter instead of a local server.

### Quick Start

1. Create a free account at openrouter.ai and generate an API key.
2. In LMSA Settings enable **Use OpenRouter (Cloud AI)**.
3. Paste your API key into **OpenRouter API Key** in Settings.
4. Open the 🤖 **Models** menu to browse cloud models.
5. Tap **Load** next to a model and start chatting.

### Selecting a Model

- Open the sidebar → **Options** → 🤖 **Models**.
- The OpenRouter model catalog will load automatically.
- Tap **Load** to select a model; your selection is saved for the next session.

### Key Differences from Local Mode

- No local server needed.
- Internet required.
- Usage costs may apply (per-token charges).
- Cloud models activate instantly.

**Privacy Notice:** When OpenRouter is enabled, your messages are sent to OpenRouter's servers and then forwarded to the model provider. Do not share sensitive personal information, passwords, or private data in your conversations. Your API key is stored locally on your device only.

### Troubleshooting OpenRouter

- No models loading: verify your API key and re-enter it in Settings.
- "Server not running" error: ensure the OpenRouter toggle is on and a valid API key is entered.
- Responses failing mid-stream: check your internet connection and account credits.
- To return to local mode: turn the OpenRouter toggle off in Settings.

---

## Using Templates

Templates are pre-configured AI personas for different tasks (e.g., Math Tutor, Code Assistant).

- Access templates from the sidebar → **Templates**.
- Browse available templates and tap a template card to select it.
- Tap **Start Chatting** to activate the template; a banner shows the active template.
- Templates remain active across conversations until disabled.
- Disable a template by clicking **Disable** in the template indicator banner or clearing the system prompt in Settings.

**Model Quality:** Larger, instruction‑following models (13B+) will adhere to templates better. For best results use a capable model.

---

## Font & Text Size

Change chat bubble font style and size in Settings:

1. Open the sidebar → **Settings**.
2. Go to the **Font** step.
3. Use **Chat Bubble Font** to choose the font style.
4. Use **Chat Bubble Font Size** to set text size.

> Important: Changing **Chat Bubble Font Size** only affects chat bubbles (messages). It does not change text size in menus, settings, or other UI.

---

## Security & Privacy

- All chat messages are stored locally on your device. LMSA does not store conversations on LMSA servers.
- If OpenRouter is enabled, prompts and responses are sent to OpenRouter's servers and processed there.
- OpenRouter traffic uses HTTPS/TLS in transit, but data is processed by third-party infrastructure.

Notes:

- Uninstalling the app or clearing app storage will permanently delete chats.
- Exported chat files are unencrypted JSON — store them securely.

### Network Security (Important)

**The connection between your device and the LM Studio server is NOT encrypted.** Anyone monitoring network traffic could:

- Intercept and read messages.
- View personal or sensitive data.
- Pose as a fake LM Studio server and send malicious responses.

To protect your privacy:

- Only use LMSA on networks and devices you trust.
- Never send personal information, passwords, or sensitive data through the app.
- Avoid public Wi‑Fi or shared/untrusted networks.

### Chat Export/Import

- Export Chats to save conversations to a file (unencrypted JSON).
- Import Chats to restore previously exported conversations; you can merge or replace existing chats.
- Store exported files securely.

---

## Ads & Privacy

- Ads support development; chat messages remain private.
- No chat data is sent to the developer or AdMob.
- Ads are generic and not based on chat content.
- Messages stay local and go straight from LMSA to your LM Studio server.

**LMSA Premium:** Tap **Remove Ads** on the main page to upgrade to Lifetime Premium and remove ads.

### Legacy Users

Background: Early LMSA releases were paid-only. Legacy paid users can reactivate premium access in the newer app using a legacy promo code.

How to get a legacy promo code:

1. Email support@lmsa.app and include your order number and any purchase/receipt details.
2. The team will verify and reply with a one-time promo code and instructions.

---

## Usage Limits

### Free Users

- Chat Completion Limit: **20 per day** (then cooldown).
- Automatic reset: Midnight local time.
- Advertisements present.
- TTS and Custom Templates: Not available on Free tier.

### Premium Users

- Unlimited Chat Completions.
- Ad-free experience.
- OpenRouter access.
- TTS (Text-to-Speech) and Custom Templates.
- One-time lifetime purchase.

How to upgrade:

- Tap **Remove Ads** on the main page and complete a one-time purchase.

---

## Troubleshooting

If you have trouble connecting LMSA to LM Studio:

### Verify Server Settings

- In LM Studio, ensure **Enable CORS** is checked.
- Enable **Serve on Local Network**.

### Verify IP Address

- LM Studio may show an incorrect IP. Check your computer's Wi‑Fi adapter IP:
  - Windows: `ipconfig` → Wireless LAN adapter Wi‑Fi → IPv4 Address.
  - Mac: System Preferences → Network → Wi‑Fi.
  - Linux: `ip addr show` or `ifconfig`.
- Enter the adapter IP into LMSA.

### Network Configuration

- Ensure both computer and Android phone are on the same network.
- Avoid guest networks that isolate devices.
- Disable VPNs that isolate local connections.
- Check router VLAN/AP isolation settings.

### Firewall Settings

- Windows: Windows Security → Firewall & network protection → Allow an app through firewall; ensure LM Studio is allowed for the network profile in use.
- Linux: Check `sudo ufw status` and ensure the LM Studio port is allowed.

### Port Configuration

- If default port 1234 doesn't work, try 8080, 5000, or 3000.
- Ensure the port isn't blocked by firewall or used by another app.

### Incomplete Model List

- Close LM Studio and the LMSA app completely, restart LM Studio, then open LMSA.
- If still failing, restart computer and Android device.

### Test Network Connectivity

From Android to Computer:

- Use a ping app (e.g., PingTools) and ping your computer's IP to verify connectivity.

From Computer to Android:

- Find the phone's IP in your router or phone settings.
- On Windows: `tracert [phone-ip]`.
- On Mac/Linux: `traceroute [phone-ip]`.
- If traceroute fails, network isolation may be preventing communication.
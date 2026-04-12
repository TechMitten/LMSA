# How to Use Tailscale with LMSA for Secure Remote LLM Access

**Connect to your local LLM server from anywhere, securely—without opening ports or using VPNs.** This guide walks you through setting up Tailscale with LMSA, step by step. 🔒

---

## Table of Contents

1. [What is Tailscale?](#what-is-tailscale)
2. [Why Use Tailscale with LMSA?](#why-use-tailscale-with-lmsa)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
   - [Part 1: Install and Configure Tailscale](#part-1-install-and-configure-tailscale)
   - [Part 2: Get Your Server's Tailscale IP](#part-2-get-your-servers-tailscale-ip)
   - [Part 3: Configure LMSA Settings](#part-3-configure-lmsa-settings)
5. [Testing Your Connection](#testing-your-connection)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Security Best Practices](#security-best-practices)
8. [FAQs](#faqs)

---

## What is Tailscale?

**Tailscale** is a modern VPN service built on top of WireGuard. It creates a secure, private network between your devices without needing to open ports on your home router or deal with complex VPN configurations.

### Key Features:
- **Zero-trust security**: Only devices you authorize can connect
- **Encrypted tunnel**: All traffic is encrypted end-to-end
- **No port forwarding**: No need to expose your LLM server to the internet
- **Easy setup**: Works across different networks automatically
- **Free tier available**: Perfect for personal use

### How It Works:
When you install Tailscale on your LLM server and LMSA-enabled device, they both join your private Tailscale network. Even though they're on different networks (home vs. mobile, office vs. home, etc.), they can communicate securely as if they're on the same private network.

---

## Why Use Tailscale with LMSA?

#### 📍 **Access Your LLM Server Anywhere**
Run a local LLM server on your home computer and access it from LMSA on your phone or tablet while traveling.

#### 🔒 **Maximum Security**
- No open ports exposed to the internet
- End-to-end encryption
- Only authenticated devices can connect
- No need to trust public cloud infrastructure

#### ⚡ **Fast & Low Latency**
Direct, encrypted connection between devices—faster than traditional VPNs.

#### 💰 **Cost-Effective**
Tailscale has a free tier perfect for home setups and small teams.

#### 🎯 **Simpler Than Alternatives**
No port forwarding, firewall rules, or complex networking knowledge required.

---

## Prerequisites

Before you start, you'll need:

1. **A Tailscale Account** — Free account at [tailscale.com](https://tailscale.com)
2. **Tailscale Installed on Your LLM Server** — The computer running your local LLM model
3. **LMSA App** — Installed on your Android phone or tablet
4. **LLM Server Running Locally** — A local AI model server (e.g., Ollama, LM Studio, vLLM, etc.) accessible on your local network
5. **Network Connectivity** — Both devices need internet access to connect through Tailscale

### Popular LLM Servers Compatible with LMSA:
- **Ollama** — Easy, lightweight, highly popular
- **LM Studio** — User-friendly GUI
- **vLLM** — Fast inference server
- **LocalAI** — Drop-in replacement for OpenAI API
- **GPT4All** — Simple desktop app

---

## Step-by-Step Setup Guide

### Part 1: Install and Configure Tailscale

#### **Step 1A: On Your LLM Server (Desktop/Laptop)**

1. **Download Tailscale**
   - Visit [tailscale.com/download](https://tailscale.com/download)
   - Select your operating system (Windows, macOS, or Linux)
   - Download and install

2. **Create or Sign In to Tailscale Account**
   - Launch Tailscale
   - Click **"Sign in"** or **"Log in"**
   - Follow the browser redirect to sign in with:
     - Google account
     - Microsoft account
     - GitHub account
     - Apple account
   - Or create a Tailscale account

3. **Authenticate the Server**
   - After signing in, you'll see a prompt to authorize this device
   - Click **"Connect"** or **"Authorize"**
   - Your LLM server is now part of your Tailscale network 🎉

4. **Note Your Server's Tailscale IP**
   - In the Tailscale app, you'll see your device name and **Tailscale IP** (starts with `100.x.x.x`)
   - Example: `100.64.45.123`
   - **Write this down** — you'll need it in LMSA

#### **Step 1B: On Your Mobile Device (LMSA Phone/Tablet)**

1. **Install Tailscale App**
   - Search for **"Tailscale"** in Google Play Store
   - Download and install the official Tailscale app

2. **Sign In with Same Account**
   - Open Tailscale on your phone
   - Tap **"Sign in"**
   - Use the **same Tailscale account** as your server
   - This is important—they must be in the same network!

3. **Authorize the Mobile Device**
   - Follow the browser prompts to authenticate
   - Tap **"Connect"**
   - Your phone is now connected to your Tailscale network

4. **Keep Tailscale Running**
   - Ensure Tailscale stays connected (you'll see a connected indicator)
   - On Android, Tailscale uses a VPN-like service—this keeps your secure tunnel open

---

### Part 2: Get Your Server's Tailscale IP

#### **Finding Your Server's IP Address:**

**On Windows/macOS:**
1. Open Tailscale app on your server
2. Look for the main window or system tray icon
3. You'll see your device name and **IP address** (format: `100.x.x.x`)
4. Click the IP to copy it to your clipboard

**On Linux:**
```bash
tailscale ip -4
```
This outputs your Tailscale IPv4 address directly.

#### **Verify Connectivity (Optional but Recommended):**

1. **From your phone** (with Tailscale connected):
   - Open a terminal/command prompt app or use `ping` commands
   - Try pinging your server's Tailscale IP to confirm connectivity
   - Or simply proceed to the next step—LMSA will test the connection

---

### Part 3: Configure LMSA Settings

Now that Tailscale is set up, configure LMSA to use your remote LLM server:

#### **Step 1: Open LMSA Settings**
1. Launch the **LMSA app** on your phone
2. Tap the **≡ (hamburger menu)** button in the top-left
3. Tap **Settings** (gear icon)

#### **Step 2: Locate Server Configuration**
1. Look for **"Server Settings"** or **"Connection Settings"** section
   - Scroll down if needed—it may be in an "Advanced" section
2. You should see a field for **"Server URL"** or **"API Endpoint"**

#### **Step 3: Enter Your Server Details**
1. **Clear the existing URL** (if any)
2. **Enter the new URL** in this format:
   ```
   http://100.x.x.x:YOUR_PORT
   ```
   
   **Where:**
   - `100.x.x.x` = Your server's Tailscale IP (from Part 2)
   - `YOUR_PORT` = The port your LLM server is running on

   **Common Examples:**
   - **Ollama**: `http://100.64.45.123:11434`
   - **LM Studio**: `http://100.64.45.123:1234`
   - **vLLM**: `http://100.64.45.123:8000`
   - **LocalAI**: `http://100.64.45.123:8080`

   > **Note**: If you're not sure what port your server uses, check your LLM server's documentation or startup logs. It usually displays: "Server listening on port XXXX"

#### **Step 4: Save Settings**
1. Tap **"Save"** or **"Apply"**
2. LMSA may automatically test the connection

---

## Testing Your Connection

### **Quick Test in LMSA:**

1. Open a new chat in LMSA
2. If your server is reachable, you should see:
   - Available models loading
   - No connection errors
   - Response times similar to local network

3. **Send a test message** to confirm everything works
4. If it works, you're done! 🎉

### **If Connection Fails:**

See the [Troubleshooting](#troubleshooting-common-issues) section below.

---

## Troubleshooting Common Issues

### **Issue 1: "Connection Refused" or "Connection Timeout"**

**Possible Causes & Solutions:**

1. **Tailscale not running on server**
   - ✅ Check that Tailscale is connected on your LLM server
   - ✅ Look for the Tailscale system tray icon and verify "Connected" status

2. **Tailscale not running on phone**
   - ✅ Open Tailscale app on your phone
   - ✅ Ensure it shows "Connected" at the top
   - ✅ Grant necessary permissions (VPN permission required)

3. **Wrong Tailscale IP in LMSA**
   - ✅ Double-check the IP address you entered in LMSA
   - ✅ Verify it matches the one in Tailscale app (format: `100.x.x.x`)
   - ✅ Copy directly from Tailscale to avoid typos

4. **LLM server not running**
   - ✅ Check that your LLM server is actually running on your desktop/server
   - ✅ Look for the application window or system tray indicator
   - ✅ Restart the LLM server if needed

5. **Wrong port number**
   - ✅ Verify the port in LMSA matches your LLM server's port
   - ✅ Check your LLM server's documentation
   - ✅ Start logs should show: "Listening on port XXXX"

---

### **Issue 2: "Authentication Failed" or "Firewall Blocked"**

**Possible Causes & Solutions:**

1. **Local firewall blocking connection**
   - ✅ Add exception for your LLM server port (check your LLM server's docs)
   - ✅ On Windows: Settings → Firewall → Allow app through firewall
   - ✅ Temporarily disable firewall for testing (re-enable after)

2. **Server requires API key or authentication**
   - ✅ Check if your LLM server needs an API key
   - ✅ If yes, configure it in LMSA settings
   - ✅ Or generate a Tailscale auth key for additional security

3. **Devices not in same Tailscale network**
   - ✅ Verify both devices are signed into **same Tailscale account**
   - ✅ Check Tailscale account settings at [tailscale.com](https://tailscale.com)
   - ✅ The device should appear in "My Devices"

---

### **Issue 3: Slow Performance or Intermittent Disconnections**

**Possible Causes & Solutions:**

1. **Internet connectivity issues**
   - ✅ Tested with device on different WiFi networks
   - ✅ Check phone's internet speed (Settings → Network → Speed Test)
   - ✅ Ensure server has stable internet connection

2. **Tailscale relay being used** (slower than direct connection)
   - ✅ Move devices closer together or on better networks
   - ✅ Tailscale should use direct connection automatically
   - ✅ Check in Tailscale admin panel: [admin.tailscale.com](https://admin.tailscale.com)

3. **LLM server overloaded**
   - ✅ Check CPU/memory usage on server when running models
   - ✅ Stop other apps using the LLM server
   - ✅ Use a smaller model for better performance

4. **LMSA running too many chats or queries**
   - ✅ Close unused chats in LMSA
   - ✅ Send messages one at a time (wait for response)
   - ✅ Restart LMSA if performance degrades

---

### **Issue 4: "Network Unreachable"**

**Possible Causes & Solutions:**

1. **Tailscale IP changed**
   - ✅ LLM server sometimes gets assigned a new Tailscale IP after restart
   - ✅ Check current IP again in Tailscale app
   - ✅ Update the URL in LMSA settings with the new IP

2. **Both devices not authenticated**
   - ✅ Re-authenticate devices: Sign out → Sign in in Tailscale
   - ✅ Reinstall Tailscale if persistent issues

3. **Tailscale account issue**
   - ✅ Log in to [tailscale.com](https://tailscale.com) and check account status
   - ✅ Verify both devices appear in "My Devices"
   - ✅ Check for any security alerts or subscription issues

---

## Security Best Practices

### **1. Keep Tailscale Updated**
- Regularly update Tailscale on both server and phone
- Updates include security patches
- Enable auto-updates if available

### **2. Only Authorize Trusted Devices**
- Only add devices you own to your Tailscale network
- Review & remove devices you no longer use at [admin.tailscale.com](https://admin.tailscale.com)
- Use device approval settings for additional security

### **3. Use Strong Tailscale Credentials**
- Use a strong password for your Tailscale account
- Enable two-factor authentication (2FA) at [tailscale.com/settings](https://tailscale.com/settings)
- Consider using strong accounts (Google, Microsoft) with their 2FA

### **4. Secure Your LLM Server**
- Use HTTPS instead of HTTP if your LLM server supports it
- Implement API key authentication on your LLM server
- Keep your LLM server software updated
- Don't expose your LLM server directly to the internet

### **5. Monitor Tailscale Activity**
- Regularly check connected devices at [admin.tailscale.com](https://admin.tailscale.com)
- Set up proper firewall rules on your server
- Consider using Tailscale's advanced features (ACLs) for enterprise deployments

### **6. Backup Your Tailscale Setup**
- Note your Tailscale IP scheme in case of reinstall
- Keep device credentials secure if doing server migrations
- Save any custom ACL rules you create

---

## FAQs

### **Q: Is Tailscale free?**
**A:** Yes! Tailscale's free tier is perfect for personal use and home projects. You get:
- Unlimited devices (personal use)
- Up to 3 users
- Full end-to-end encryption
- Direct encrypted connections
Consider paying for business or team use for advanced features like SSO and device approval policies.

---

### **Q: Can I use Tailscale on other devices too (laptop, desktop)?**
**A:** Absolutely! Install Tailscale on any device you want to connect to your LLM server:
- Windows PC
- Mac
- Linux
- iPhone
- iPad
- Android
- Chromebook
All devices on the same Tailscale network can access each other securely.

---

### **Q: What if I don't know my LLM server's port?**
**A:** Check these common defaults:
- **Ollama**: 11434
- **LM Studio**: 1234
- **vLLM**: 8000
- **LocalAI**: 8080
- **Gradio (for many models)**: 7860

Otherwise:
1. Open your LLM server app
2. Look at the startup window/logs
3. Search for "listening on" or "port"
4. The number after "port" is what you need

---

### **Q: What if my server's Tailscale IP changes after restart?**
**A:** This is normal. Here's how to get a permanent IP:

1. Go to [admin.tailscale.com](https://admin.tailscale.com)
2. Find your server device
3. Click the three dots menu
4. Look for "Disable key expiry" or "Enable stable IP" option
5. This keeps your Tailscale IP consistent across restarts

Alternatively, just update the IP in LMSA each time (or use a hostname if using Tailscale's DNS feature).

---

### **Q: Can I use Tailscale with a regular VPN?**
**A:** Yes, but it's not recommended:
- Tailscale acts as a VPN itself
- Using both may cause performance issues
- Disconnect from standard VPNs when using Tailscale
- Tailscale is generally more secure for this use case anyway

---

### **Q: Is my data secure with Tailscale?**
**A:** Yes, Tailscale uses:
- **WireGuard encryption**: Military-grade, modern encryption
- **Zero-trust security**: Only authenticated devices can connect
- **Encrypted by default**: All traffic is encrypted end-to-end
- **No logging**: Tailscale doesn't see your traffic
- **Open source**: Auditable security model

---

### **Q: What if I travel to a different country—will it still work?**
**A:** Yes! Tailscale works globally:
- Your devices can be in different countries
- As long as both have internet access, they'll connect
- No need to change settings
- The tunnel adapts to region changes automatically

---

### **Q: Can my family use this setup?**
**A:** Depends on your Tailscale plan:
- **Free tier**: Supports up to 3 users
- All share the same network of devices
- Make sure you trust all family members (they'll see all connected devices)
- For more control, upgrade to a paid plan with advanced ACLs

---

### **Q: What happens if Tailscale servers go down?**
**A:** Brief outages only affect initial connection:
- After devices connect directly, they use **peer-to-peer communication**
- Direct connections don't rely on Tailscale servers
- Tailscale strives for 99.9% uptime
- Status page: [status.tailscale.com](https://status.tailscale.com)

---

## Summary

You're now ready to access your local LLM server securely from anywhere! Here's what you've learned:

✅ **Installed & configured Tailscale** on server and phone
✅ **Found your server's Tailscale IP**
✅ **Configured LMSA** with the server URL
✅ **Tested the connection** successfully
✅ **Understand security best practices**

### **Next Steps:**
1. Enjoy using LMSA with your LLM server anywhere, anytime
2. Monitor performance and adjust as needed
3. Explore Tailscale's advanced features as you get comfortable

### **Need Help?**
- **Tailscale Support**: [tailscale.com/contact](https://tailscale.com/contact)
- **LMSA Help**: Check the in-app help and settings
- **LLM Server Support**: Refer to your specific server's documentation (Ollama, LM Studio, etc.)

Happy talking to your AI! 🚀

---

**Last Updated**: April 2026
**Article Format**: Beginner-Friendly Guide
**Tailscale Version**: Latest (compatible with all recent versions)
**LMSA Version**: Compatible with all versions

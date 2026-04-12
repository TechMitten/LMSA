---
title: "LMSA Adds MCP Server Access — LM Studio Android & Ollama Users Guide"
date: 2026-04-12
description: "LMSA now supports Model Context Protocol (MCP) servers. Quick setup and tips for LM Studio (Android) and Ollama users, plus troubleshooting and developer notes."
tags: [LMSA, "LM Studio", Ollama, MCP, Android, local-llm]
---

# LMSA Adds MCP Server Access — LM Studio Android & Ollama Users Guide

> LMSA now supports Model Context Protocol (MCP) servers. This post explains what that means, how to enable MCP in the LMSA Android app for LM Studio and Ollama workflows, and practical tips for using plugins and ephemeral MCP servers.

Why this matters: MCP lets your local models call tools, plugins, and external services during chat — unlocking actions like web automation, browsing, and custom toolchains while keeping control on your local network or trusted remote servers.

## What is MCP (Model Context Protocol)?

MCP is a simple contract that lets language models call external tool integrations during a conversation. An MCP server exposes one or more tool integrations (often described in an `mcp.json`), and a client (like LMSA) can instruct a model to use those tools via the MCP flow. For users, this means models can trigger actions and return structured tool-use summaries directly inside chat.

## Highlights: What LMSA brings

- LMSA can now register MCP integrations and forward them to LM Studio so models can call supported tools during chat.
- Support for both plugin-style MCP integrations (from `mcp.json`) and remote/ephemeral MCP servers.
- UI flows in LMSA (Settings → Local Server → MCP) let you add integrations without hand-editing JSON — the app builds the integrations JSON automatically.

## Quick setup — LM Studio + Android (LMSA app)

1. Run the LM Studio server on a host machine and enable local network access (CORS/network). LM Studio commonly serves on port `1234`.
2. In the LMSA Android app, open **Settings** and set the Host IP and LM Studio server port (example: `http://192.168.1.25:1234`).
3. Keep the connection mode set to **Local Server** and tap the **MCP** button in Settings.
4. Add an integration. You can:
   - Use a **Plugin ID** from an `mcp.json` (example: `mcp/playwright`), or
   - Use an **Ephemeral** MCP server URL like `https://example.com/mcp`.
5. Tap **Done** to save. Once at least one MCP integration exists, LMSA will use LM Studio's native MCP chat flow automatically.

**Important:** do not put MCP server URLs in the Hostname / IP field — that field is for the LM Studio (or Ollama) server host. MCP integrations are configured separately via the MCP settings.

Example LM Studio address (in LMSA Settings):

```
http://192.168.1.25:1234
```

## Quick setup — Ollama users

1. On Windows: open the Ollama app, go to Settings, and enable **Expose Ollama to the network**. Ensure Ollama is running.
2. On Linux/macOS: start Ollama so it listens on the network, e.g. set `OLLAMA_HOST=0.0.0.0` in the environment before launching the Ollama service.
3. In LMSA Settings, set the host IP and Ollama port (usually `11434`):

```
http://192.168.1.25:11434
```

4. If you need to pull an Ollama model first, run on the host:

```
ollama pull llama3.2
```

LMSA's local-server logic detects Ollama endpoints and will fall back to appropriate Ollama API calls (`/api/tags`, `/api/ps`) to find running models. If no models are found, LMSA shows a friendly reminder like: "No Ollama models found. Pull a model first, for example: ollama pull llama3.2".

## Ephemeral MCP servers vs Plugin ID

- Ephemeral: a remote MCP URL you trust (e.g. `https://example.com/mcp`). Useful for hosted tool integrations or shared tooling clusters.
- Plugin ID: references a local integration registered in LM Studio via `mcp.json` (example `mcp/playwright`). LMSA can push integrations JSON to LM Studio so the model can call those local tools.

Leave the **Allowed Tools** field empty to allow all tools from the integration, or list tool names to restrict what the model can call.

## Developer notes — where LMSA implements MCP support

I reviewed LMSA's web assets to understand how MCP is wired in the app:

- The help & instructions live in [app/src/main/assets/LMSA/js/components/modals/help-modal.js](app/src/main/assets/LMSA/js/components/modals/help-modal.js#L1-L260).
- The release announcement copy is in [app/src/main/assets/LMSA/js/components/modals/whats-new-modal.js](app/src/main/assets/LMSA/js/components/modals/whats-new-modal.js#L1-L120).
- Connection and model-detection logic (LM Studio vs Ollama, endpoints, and error messages) is implemented in [app/src/main/assets/LMSA/js/templates.js](app/src/main/assets/LMSA/js/templates.js#L680-L980).

These files show the UX decisions and fallback logic (e.g., LM Studio native endpoints, Ollama `/api/tags` and `/api/ps`, error strings for missing models, and the MCP builder that produces the `integrations` JSON automatically).

## Troubleshooting & tips

- "No Ollama models found. Pull a model first. Pull a model first, for example: ollama pull llama3.2" — pull a model on the host, or verify Ollama is reachable.
- "Failed to connect to Ollama. Please check that Ollama is running and reachable at the configured IP and port." — verify host IP, port, and firewall settings.
- "Failed to connect to LM Studio. Please check that LM Studio is running and the server is started." — confirm LM Studio server is listening and CORS/network options are enabled.
- If a tool-enabled request behaves strangely, check the MCP server URL or plugin id and ensure the target integration is available in LM Studio.

## SEO & distribution notes (for release authors)

- Title includes the target queries: "LM Studio Android" and "Ollama users" to improve discoverability for both audiences.
- Suggested tags/hashtags: `LM Studio`, `Ollama`, `Android`, `MCP`, `local-llm`, `LMSA`.
- Share the post with the app release notes, Play Store changelog, and communities where LM Studio and Ollama users gather.

## Try it and give feedback

If you run into issues, double-check your host IP and ports, and verify the model server (LM Studio/Ollama) shows models and accepts local connections. If you'd like, I can also:

- Add screenshots or a short GIF for the LM Studio MCP settings flow,
- Turn this post into an HTML release note inside the app assets,
- Or open a PR with the post placed in a docs/ or blog/ folder and a short changelog entry.

---

*Written by the LMSA team — April 12, 2026.*

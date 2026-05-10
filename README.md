# LMSA: Local Model Smart Assistant

<img src="lmsa_hero_banner.png" alt="LMSA Hero Banner" width="100%">

LMSA is a premium, feature-rich Android interface designed for seamless interaction with Large Language Models (LLMs). If you're running local models via **LM Studio** and **Ollama** or leveraging cloud power through **OpenRouter**, LMSA provides a state-of-the-art chat experience with a focus on privacy, performance, and rich feature sets.

## Key Features

- **Multi-Provider Support**: Seamlessly connect to **LM Studio**, **Ollama**, **OpenRouter**, or any **OpenAI-compatible** custom endpoint.
- **Model Context Protocol (MCP)**: Native support for LM Studio MCP servers and `mcp.json` plugins for extended model capabilities.
- **Real-Time Web Search**: Augment AI responses with live data using the **Brave Search API** (with SearXNG fallback).
- **Multimodal & Vision**: Full support for multimodal models—upload images for analysis or use the built-in OCR (via Tesseract.js) to extract text from documents.
- **AI Image Generation**: Create images directly in your chats using the `/image` command.
- **Advanced Reasoning Controls**: Toggle "Thinking" visibility and adjust "Reasoning Level" (Thinking Effort) for supported models.
- **Persona & Character Templates**:
  - **Library of Personas**: Start chats with specialized contexts like Math Tutor, Code Assistant, and more.
  - **Custom Templates**: Create and save your own system prompts with custom names and avatars.
  - **Character Card V2 Support**: Full support for the industry-standard Character Card V2 spec, enabling complex roleplay with personality, scenario, and dialogue examples.
  - **AI-Powered Generation**: Automatically generate high-quality system prompts or complete character cards using AI.
- **Smart Conversational Tools**: 
  - **Smart Reply (Beta)**: Get AI-powered quick reply suggestions.
  - **Auto-Titles**: Let the AI automatically name your chats based on context.
- **Privacy & Security**:
  - **Biometric Unlock**: Secure your chats with device-level fingerprint or PIN authentication.
  - **Offline Access**: Full support for LAN-only mode when using local servers.
- **Rich UI/UX**:
  - **LaTeX & Code Highlighting**: Beautifully rendered math (KaTeX) and syntax-highlighted code blocks.
  - **Customization**: Change chat fonts, sizes, and toggle model name displays.
  - **Native TTS**: High-quality Text-to-Speech playback using Android's native engine.
- **Power User Tools**:
  - **Connection Presets**: Save and switch between multiple server configurations effortlessly.
  - **Deep Integration**: Import LM Studio profiles, Character Card V2 specs, and manage custom persona templates.
  - **Data Portability**: Export full chat histories and character data.

## Technology Stack

- **Android Native**: Built with Kotlin and modern Android Jetpack components.
- **Hybrid Core**: High-performance WebView implementation for a rich, responsive UI.
- **Modern Web UI**: Styled with a custom, premium design system inspired by Tailwind CSS.
- **Open Source Libraries**: 
    - [KaTeX](https://katex.org/) (Math rendering)
    - [Highlight.js](https://highlightjs.org/) (Syntax highlighting)
    - [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR)
    - [PDF.js](https://mozilla.github.io/pdf.js/) (PDF viewing)

## Download

LMSA is available for download on the Google Play Store:

<a href="https://play.google.com/store/apps/details?id=com.lmsa.app">
  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="80">
</a>


## Getting Started

### Prerequisites
- Android Studio Ladybug or later.
- Android SDK 34+.
- A local LLM server (optional, for local mode).

### Building from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/TechMitten/LMSA.git
   ```
2. Open the project in **Android Studio**.
3. Sync Project with Gradle Files.
4. Build and run on your device or emulator.

## Import & Export
LMSA makes it easy to migrate your workflows:
- **LM Studio Profiles**: Import your system prompts and configurations directly.
- **Character Cards**: Full support for `.json` and image-embedded Character Card V2.
- **Persona Templates**: Create, edit, and manage your own reusable chat personas with custom avatars.
- **Chat History**: Export your conversations for backup or analysis.

## License
This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

> [!CAUTION]
> **Commercial Use Prohibited**
> You are free to clone, modify, and use this software for personal or educational purposes. However, **any commercial use, including selling this software or its derivatives, is strictly prohibited.** See the [LICENSE](LICENSE) file for the full legal text.

---
Built with ❤️ by the LMSA Team.

*(Google Play and the Google Play logo are trademarks of Google LLC.)*

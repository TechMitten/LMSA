# LMSA: Local Model Smart Assistant

## Prerequisites

- **Android Studio** — Ladybug Feature Drop 2024.2.1 or later
- **JDK** — 17 (set via `jvmToolchain(17)` in the project)
- **Android SDK** — compileSdk 36 / targetSdk 36 (Android 16)
- **Kotlin** — 2.1.0 (managed by Gradle)
- **Gradle** — wrapper is included in the repo
- A local LLM server such as **LM Studio** or **Ollama** (optional, for local mode)
- **Brave Search API key** (optional — for web search; see step 6 below)

---

## Build Instructions

### 1. Clone the repository

```bash
git clone https://github.com/TechMitten/LMSA.git
cd LMSA
```

### 2. Open the project

Launch **Android Studio** and select **File → Open**, then point it at the cloned `LMSA` directory.

### 3. Sync Gradle

Android Studio will prompt you to sync — click **Sync Now**.  
Alternatively, run from the terminal:

```bash
./gradlew --no-daemon build
```

> The first sync will download all dependencies (AGP 8.13.2, Jetpack libs, etc.) and may take a few minutes.

### 4. (Optional) Add API keys

Create a `local.properties` file in the project root (if it doesn't already exist) and add any keys you need:

```properties
# Brave Search — enables the web-search feature
BRAVE_API_KEY=your_brave_api_key_here

# Pollinations — enables AI image generation
POLLINATIONS_API_KEY=your_pollinations_key_here
```

> These keys are read at build time and injected via `BuildConfig`. The app compiles without them; the corresponding features will simply be disabled.

### 5. Build the APK

**From Android Studio:**

1. Select the **app** module and the **debug** (or **release**) build variant in the **Build Variants** panel.
2. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

**From the terminal:**

```bash
# Debug APK
./gradlew assembleDebug

# Release APK (requires signing configuration)
./gradlew assembleRelease
```

Output APKs are located at:

```
app/build/outputs/apk/debug/app-debug.apk
app/build/outputs/apk/release/app-release.apk
```

### 6. Install & run

**From Android Studio:**

1. Connect your Android device (USB debugging enabled) or start an emulator.
2. Select the device from the run dropdown.
3. Click **Run ▶** (or press `Shift + F10`).

**From the terminal:**

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 7. Connect to an LLM

Once the app is running:

1. Open **Settings** inside LMSA.
2. Enter the IP address and port of your LM Studio or Ollama server (e.g. `192.168.1.100:1234`).
3. Save and start chatting.

---

## License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for the full text.

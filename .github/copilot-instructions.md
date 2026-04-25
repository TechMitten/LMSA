# LMSA2 AI-Powered Chat App — Copilot Instructions

**LMSA** is an AI-powered search and chat application packaged as a **WebView-based hybrid Android app**. This workspace combines Kotlin backend (native Android APIs, billing, ads) with a JavaScript web frontend (UI, interactions, state management).

---

## Architecture Overview

### Single Activity Pattern
- **Entry**: `com.lmsa.app.WebViewActivity` ([app/src/main/java/com/lmsa/app/WebViewActivity.kt](app/src/main/java/com/lmsa/app/WebViewActivity.kt))
- **Layout**: [app/src/main/res/layout/activity_webview.xml](app/src/main/res/layout/activity_webview.xml)
- **Manifest**: [app/src/main/AndroidManifest.xml](app/src/main/AndroidManifest.xml)

### Frontend & Assets
- **Web App Root**: [app/src/main/assets/LMSA/](app/src/main/assets/LMSA/)
  - HTML pages, CSS, JS, fonts, images
  - **Main JS Interfaces**: [app/src/main/assets/LMSA/js/android-interface.js](app/src/main/assets/LMSA/js/android-interface.js)
  - **Premium Modal**: [app/src/main/assets/LMSA/js/components/modals/premium-modal.js](app/src/main/assets/LMSA/js/components/modals/premium-modal.js)

### Native Bridge (JS ↔ Kotlin)
Nine JSInterface classes registered in `WebViewActivity.kt`:
1. **`AndroidFileOps`** (`FileOperationInterface`) — File I/O (save files, images)
2. **`AndroidBilling`** (`BillingInterface`) — Premium purchases, ads, revenue tracking
3. **`AndroidTTS`** (`TTSInterface`) — Text-to-speech synthesis + recovery watchdog
4. **`AndroidReview`** (`ReviewInterface`) — In-app review prompt
5. **`AndroidUsageLimiter`** (`UsageLimiterInterface`) — Rate limiting (15 local completions/day; OpenRouter completions unmetered; unlimited if premium)
6. **`AndroidPower`** (`PowerManagementInterface`) — Screen wake lock / power management
7. **`AndroidHaptics`** (`HapticInterface`) — Haptic feedback control
8. **`AndroidBiometrics`** (`BiometricInterface`) — Biometric authentication (fingerprint/face)
9. **`AndroidNetwork`** (`NetworkInterface`) — Network connectivity checks

### Key Features
- **Monetization**: One-time purchase `"ad_removal"` → lifetime premium access stored in SharedPreferences
- **State Sync**: Native calls JS via `evaluateJavascript()` to sync premium status and app state
- **Features Catalog**: Full user-facing feature inventory in [FEATURES_AND_OPTIONS_CATALOG.md](FEATURES_AND_OPTIONS_CATALOG.md)

---

## Build System & Commands

**Gradle 8.13.2**, **Kotlin 2.0**, **Java 17**, targeting **Android 6–16** (minSdk 23, compileSdk/targetSdk 36)

### Core Tasks
```bash
./gradlew build                # Build (unit + instrumentation tests)
./gradlew assembleRelease      # Release APK (ProGuard-minified)
./gradlew bundleRelease        # Play Store bundle
./gradlew test                 # Unit tests (JUnit)
./gradlew connectedAndroidTest # Instrumentation tests (Espresso)
```

### Custom Tasks
- No ad-specific build preprocessors are used.

### Key Build Files
- Root: [build.gradle.kts](build.gradle.kts), [gradle.properties](gradle.properties), [settings.gradle.kts](settings.gradle.kts)
- App module: [app/build.gradle.kts](app/build.gradle.kts)
- Versions: [gradle/libs.versions.toml](gradle/libs.versions.toml)

---

## Development Conventions

### JS-Native Communication Pattern
**JS → Native**: Call via `window.AndroidBilling.method()` (JSInterface methods)
**Native → JS**: Call via `webView.evaluateJavascript("window.functionName(...)")`

**Common Calls**:
- `window.AndroidBilling.purchaseAdRemoval()` — Launch billing flow
- `window.AndroidBilling.checkPremiumStatus()` — Query premium state; native responds via `updateUiForPremium(isPremium)`
- `window.AndroidFileOps.saveFile(content, filename)` — Save file; native responds via `window.onFileSaved(success)`

### Premium Status
- **Key**: SharedPreferences `LMSA_PREFS`/`is_premium` (boolean)
- **Sync Point**: After purchase or app start, native calls `updateUiForPremium()` to refresh UI (hiding ads, showing premium features)
- **UI Updates**: Premium modal, ad banners, usage limit messaging

### WebView Configuration & Rendering Issues
- **Full-screen immersive mode** with system bar hiding, inset handling
- **Sidebar collapsibles**: May become invisible-but-clickable if toggled inside transforms (see below)
- **Paint invalidation**: Explicit repaint syncing required for dynamic sidebar content changes

---

## Known Patterns & Gotchas

### Sidebar Collapsible Rendering
**Issue**: Android WebView sidebar collapsibles can become invisible-but-clickable when toggled inside transformed containers.

**Solution**: 
1. Use explicit expand/collapse syncing in `ui-manager.js` (don't rely on CSS class toggles alone)
2. Force repaint on expanded content via temporary `sidebar-repaint-fix` class
3. Keep `.collapsible-content` hidden with `opacity/visibility/pointer-events` until `.show` is applied

**Reference**: [/memories/repo/sidebar-collapsible-webview-paint-fix.md](/memories/repo/sidebar-collapsible-webview-paint-fix.md)

### Premium Modal UX
**Issue**: Welcome screen "Remove Ads" button should open premium modal, not directly trigger purchase flow.

**Pattern**: `remove-ads-banner-button` → `window.openPremiumModal()` (shows benefits) → "Upgrade Now" → `window.removeAds()` (triggers purchase)

**Avoid**: Direct calls to `AndroidBilling.purchaseAdRemoval()` bypass premium modal UX, especially on touch events that prevent click propagation.

**Reference**: [/memories/repo/premium-modal-wiring.md](/memories/repo/premium-modal-wiring.md)

---

## Project Structure & Key Paths

```
app/src/main/
├── java/com/lmsa/app/
│   └── WebViewActivity.kt (monolithic ~2300 lines; entry point)
├── assets/LMSA/
│   ├── index.html (main page)
│   ├── css/ (styles, themes, responsive layouts)
│   ├── js/
│   │   ├── android-interface.js (JSInterface bridges + premium state)
│   │   ├── app.js / main.js (app bootstrap)
│   │   ├── api-service.js (LM Studio / OpenRouter API calls)
│   │   ├── chat-service.js (chat session management)
│   │   ├── settings-manager.js / settings-modal-manager.js
│   │   ├── model-manager.js (model loading/selection)
│   │   ├── ui-manager.js / ui-manager-part.js (sidebar, collapsibles, rendering)
│   │   ├── tts-service.js (TTS orchestration)
│   │   ├── export-import.js (chat export/import)
│   │   ├── shared-state.js (global state)
│   │   ├── usage-limiter.js (client-side rate limiting)
│   │   ├── syntax-highlighter.js / marked-bundle.js (markdown + code)
│   │   └── components/modals/ (19 modal components)
│   ├── fonts/ (custom typefaces)
│   └── images/ (logos, icons, banners)
├── res/ (Android resources: layouts, drawables, colors, strings)
└── AndroidManifest.xml (single exported activity, deep links)
```

**Build Output**: `app/build/intermediates/` (dex, merged resources, etc.); `app/build/outputs/` (APK/bundle)

---

## Testing & QA

### Unit Tests
- Location: `app/src/test/`
- Run: `./gradlew test`
- Framework: JUnit

### Instrumentation Tests (Device/Emulator)
- Location: `app/src/androidTest/`
- Run: `./gradlew connectedAndroidTest`
- Framework: JUnit + Espresso
- Requires: Connected Android device or running emulator

### Manual Testing Checklist
1. **Billing**: Purchase `ad_removal`, restart app, verify premium UI (no ads, "Unlimited" usage)
2. **Ad Display**: Skip purchase, verify interstitial ads on new chat
3. **File I/O**: Save a response as .txt/.markdown
4. **TTS**: Trigger speech synthesis; verify recovery if hangs
5. **Review Prompt**: Trigger in-app review API
6. **Deep Links**: Test any app-linked URIs in AndroidManifest

---

## Common Development Tasks

### Adding a New JSInterface Method
1. Create method in `WebViewActivity.kt` (e.g., `AndroidNewFeature` class)
2. Annotate with `@JavascriptInterface`
3. Register with WebView: `webView.addJavascriptInterface(AndroidNewFeature(), "AndroidNewFeature")`
4. Call from JS: `window.AndroidNewFeature.method(args)`
5. Test on device/emulator

### Updating Web Assets
1. Modify HTML/CSS/JS in `app/src/main/assets/LMSA/`
2. Run `./gradlew assembleDebug` (builds APK + applies build-time preprocessor)
3. Deploy to connected device or emulator

### Changing Premium/Billing Logic
- **Product ID**: Update in `WebViewActivity.kt` billing setup
- **SharedPreferences key**: `LMSA_PREFS`/`is_premium`
- **UI sync**: Ensure native calls `updateUiForPremium()` after purchase/restore
- **Test**: Verify purchase flow, restore, and premium UI state

### Debugging WebView
- Enable **Chrome DevTools**: `webView.setWebContentsDebuggingEnabled(true)` (debug builds only)
- Connect via `chrome://inspect/#devices`
- Set breakpoints, console logs, JS profiling
- Use Android Logcat: `adb logcat | grep "WebViewActivity\|lmsa"` (or your custom log tags)

---

## Dependencies & Versions

| Library | Version | Purpose |
|---------|---------|---------|
| Material Design | v1.12.0 | UI components, theming |
| Google Play Billing | v7.0.0 | In-app purchases |
| Play Review API | v2.0.2 | In-app review prompt |
| Core KTX | v1.17.0 | Modern Kotlin extensions |
| AppCompat | v1.7.1 | Backward compatibility |

See [gradle/libs.versions.toml](gradle/libs.versions.toml) for complete dependency tree.

---

## Common Issues & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| WebView collapsibles invisible | Transform + repaint sync issue | See "Sidebar Collapsible Rendering" above |
| Premium status not persisted across restarts | SharedPreferences key mismatch | Verify `LMSA_PREFS`/`is_premium` key name in both Kotlin and JS |
| TTS speech hangs or doesn't complete | TTS service timeout | Watchdog mechanism in `AndroidTTS` auto-recovers; check logcat for errors |
| Gradle build fails with "duplicate class" | ProGuard conflicts | Check `app/proguard-rules.pro` for overly broad keep rules |

---

## Resources & References

- **Android Docs**: [developer.android.com](https://developer.android.com/)
- **Kotlin**: [kotlinlang.org](https://kotlinlang.org/)
- **WebView Best Practices**: [developer.android.com/guide/webapps/webview](https://developer.android.com/guide/webapps/webview)
- **Billing Library**: [developer.android.com/google/play/billing](https://developer.android.com/google/play/billing)
- **Workspace Architecture**: [/memories/repo/lmsa-workspace-structure.md](/memories/repo/lmsa-workspace-structure.md) (detailed navigation paths)

---

## Agent Notes

When working on LMSA, keep in mind:
1. **Web-first design**: Most UI logic lives in JavaScript; native code is a bridge
2. **Billing is critical**: Premium status gates core features and usage limits
3. **Sync is king**: Android state → JS updates (via `evaluateJavascript()`) is the communication pattern
4. **Testing on device**: WebView behavior differs significantly from desktop browsers; always test on Android
5. **Build process**: Rebuild the app after editing web assets to validate Android WebView behavior

---

**Last updated**: April 2026 | **Kotlin 2.0** | **Android 6–16 (minSdk 23, compileSdk/targetSdk 36)** | **v10.14 (build 297)**

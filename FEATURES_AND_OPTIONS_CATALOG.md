# LMSA Complete Features & Options Catalog

**Comprehensive inventory of all user-facing features, settings, and options in the LMSA app.**

---

## 1. CHAT & MESSAGING FEATURES

### Core Chat Functionality
- **New Chat** — Start a fresh conversation (via sidebar or icon button)
- **Multiple Concurrent Chats** — Store and manage multiple separate conversations
- **Chat History** — All chats are persisted locally in browser storage
- **Chat Renaming** — Rename any chat in history (via right-click or menu)
- **Chat Deletion** — Delete individual chats from history
- **Auto Chat Titles** — AI-generated titles for new chats (if enabled)
- **Message Threading** — Traditional Q&A conversation format
- **User Messages** — Submit text queries with optional file attachments (Premium only)
- **AI Responses** — Stream responses in real-time with markdown support
- **Code Block Syntax Highlighting** — Automatic syntax coloring for code samples
- **Message Copy** — One-click copy message text or code blocks
- **Message Save** — Export AI responses as files (.txt, .markdown, etc.) (File I/O feature)
- **Message Regeneration** — Regenerate last AI response with same context
- **Smart Reply** — AI-generated tap-to-reply suggestions (BETA, Optional toggle)
- **Think Tag Support** — Models can use `<think>` tags for hidden reasoning
- **Reasoning Streaming** — O1-style reasoning models with step-by-step output
- **Tool Call Support** — Some models support MCP tools and integrations

---

## 2. MODEL MANAGEMENT

### Local Server Models
- **LM Studio Connection** — Connect to LM Studio running on same/remote network
- **Ollama Support** — Use Ollama as alternative to LM Studio
- **Manual Model Loading** — Select and load models from available list
- **Model Switching** — Switch between models mid-conversation
- **Default Model Selection** — Auto-select a model on app startup
  - Confirmation modal for first-time default selection
  - Transient confirmation toast after selection
- **Available Models Display** — Shows all models available on connected server
- **Model Refresh** — Reload model list from server
- **Current Model Display** — Shows active model name in header bar

### OpenRouter Cloud Models  
- **OpenRouter Integration** — Use cloud-based AI models via OpenRouter API
- **API Key Management** — Save and manage OpenRouter API key
- **Cloud Model Selection** — Browse and select from extensive OpenRouter catalog
- **Model-Specific Pricing** — Different rates per model available
- **No Local Requirements** — Cloud models don't need LM Studio running
- **Mutual Exclusivity** — Dashboard toggle between Local Server and OpenRouter mode

### Optional Server Features
- **LM Studio API Token** — Optional authentication for token-gated LM Studio servers
- **LM Studio MCP Integrations** — Support for LM Studio's Model Context Protocol
  - Add ephemeral MCP servers inline
  - Load `mcp.json` configurations
  - Models can invoke MCP tools during chat

---

## 3. SETTINGS & CONFIGURATION

### Connection Settings (Step 1)
- **Local Server Configuration**
  - Server IP address field
  - Server port field (e.g., 11434 for Ollama, 1234 for LM Studio)
  - Connection status indicator (Not configured → Connected)
  - Quick "Configure" button for UI
  
- **OpenRouter Setup**
  - OpenRouter cloud toggle
  - API key input and storage
  - Connection status display

- **LM Studio Enhancements**
  - API Token field (optional authentication)
  - MCP Integration configuration button
  - Status indicators for each setting

### System Prompt (Step 2)
- **Custom Prompt Editing** — Write or edit system instructions for the AI
- **Prompt Storage** — Save system prompt to localStorage
- **Prompt Display** — Non-interactive preview of current prompt
- **Add System Prompt Button** — Save new/edited prompts
- **Edit System Prompt Button** — Modify existing prompt

### Temperature & Generation (Step 3)
- **Temperature Control** — Slider 0.0—2.0, controls AI randomness
  - Locked by default (green lock icon unlocks)
  - Prevents accidental adjustments
  - Real-time value display
- **Hide Thinking Text** — Toggle to hide/show `<think>…</think>` sections in responses
- **Generate Chat Titles** — Auto-extract titles from first AI response (no extra API call)
- **Smart Reply (BETA)** — Enable/disable AI-generated response suggestions
  - Warning modal on first enable (explains limitations)
  - Disabled if OpenRouter active (extra API call constraint)
  - Varies by model quality

### Chat UX Options (Step 3 continued)
- **Auto-Scroll to Bottom** — Automatically scroll as LLM streams response
- **Enter for New Line** — Toggle: Enter sends vs. creates newline (Shift+Enter to send)
- **Show Model Name** — Display which model generated each response
- **Show Chat Scrollbar** — Show/hide custom scrollbar in message area

### Display & Rendering (Step 4)
- **Chat Bubble Font** — Select font family
  - System Default
  - Roboto
  - Sans-Serif (Arial)
  - Serif (Georgia)
  - Monospace (Courier New)
- **Chat Bubble Font Size** — Message text size
  - Extra Small (12px)
  - Small (14px)
  - Medium (16px, default)
  - Large (20px)
  - Extra Large (24px)

### Text-to-Speech
- **TTS Voice Selection** — Dropdown to select native/system TTS voice
- **Voice Quality/Locale** — Android native TTS voice options with language/gender
- **TTS Streaming** — Speak AI responses during or after generation

### Server Modes
- **Use Ollama** — Toggle to use Ollama connection (port 11434 by default)
- **Ollama Exclusivity** — Disables manual model loading when Ollama active

### Biometric Security (Step 3)
- **Require Biometric Unlock** — Toggle app lock on fingerprint/face/PIN
  - Prompts user to authenticate when opening app
  - Uses Android BiometricPrompt API
  - Falls back to device credential if biometric unavailable

### Advanced Options (Step 5: Actions)
- **Clear All Chats** — Irreversible delete all chat history
- **Reset App** — Restore all settings to defaults, clear local data
- **Clear OpenRouter Key** — Remove saved OpenRouter API key
- **Clear LM Studio Token** — Remove saved authentication token

---

## 4. TEMPLATES & PERSONAS

### Template System
- **Prebuilt Templates** — 13 ready-to-use AI personas:
  - Math Tutor
  - Fortune Teller
  - The Joker
  - Story Writer
  - General Tutor
  - Social Media Writer
  - Code Assistant
  - Travel Planner
  - Career Coach
  - Email Polisher
  - Sous Chef
  - (and more)

- **Custom Templates** — Create personal templates with custom system prompts
- **Template Selection Page** — Dedicated templates.html interface
- **Template Indicator** — Shows active template in main chat view
- **Disable Templates** — Clear template to revert to default AI behavior
- **Template Persistence** — Active template applies across all new messages until disabled

---

## 5. FILE OPERATIONS & ATTACHMENTS

### File Attachment (Premium Feature)
- **Select Files** — File picker to attach documents/images to chat
- **Multiple File Formats Supported** (Premium users only):
  - Text files: .txt, .md, .markdown, .rst, .org
  - Code: .py, .js, .ts, .java, .cpp, .c, .go, .rb, .php, .swift, .kt
  - Data: .json, .csv, .tsv, .xml, .yaml, .yml, .toml, .ini, .config, .jsonl, .jsonlines
  - Images: .jpg, .jpeg, .png, .gif, .webp, .bmp
  - Documents: .pdf (may be limited by model)
  - Archives: .zip (model-dependent handling)
  
- **Upload Handling** — File sent with message to model
- **Image Display** — Images embedded in chat with AI response
- **File Availability Gate** — Free users see "Premium Feature" prompt instead

### File Export (All Users)
- **Save Response as Text** — Export AI response to .txt file
- **Save Response as Markdown** — Export with markdown formatting
- **Filename Auto-Generation** — Timestamped filenames
- **Copy Code Blocks** — One-click copy from syntax-highlighted code

---

## 6. PREMIUM (PAID) VS FREE TIERS

### Free User Limits
- **Local Chat Limit: 15 completions/day** — Soft reset at midnight local time
- **OpenRouter Limit: 5 completions/day** — Separate daily counter
- **Advertisements:** Interstitial ads shown between messages or app actions
- **No File Attachments** — Cannot attach files to chats
- **TTS Unavailable** — Text-to-speech disabled for free users
- **Smart Reply Disabled** — Tap-to-reply suggestions not available
- **Usage Meter** — App shows remaining completions for the day

### Premium Users (Lifetime Purchase)
- **Unlimited Completions** — All local chat and cloud model calls unlimited
- **No Advertisements** — Ad-free experience throughout app
- **File Attachments Enabled** — Can attach any supported file type to chats
- **TTS Enabled** — Full text-to-speech functionality available with voice selection
- **Smart Reply Unrestricted** — AI can generate tap-to-reply suggestions
- **All Features Unlocked** — No feature gates for premium

### Monetization
- **One-Time Purchase: "ad_removal"** — Single lifetime premium purchase
- **In-App Purchase Flow** — Google Play Billing library integration
- **Purchase Restoration** — Users can restore purchases if reinstalling
- **Shared Preference Storage** — Premium status persists via `LMSA_PREFS`/`is_premium` key

### Premium UI Elements
- **Premium Modal** — Explains benefits and triggers purchase flow
- **Remove Ads Button** — Opens premium modal on welcome screen
- **Upgrade Now CTA** — Links to purchase process
- **Premium Badge** — Indicates premium-only features in UI

---

## 7. HELP, DOCUMENTATION & ONBOARDING

### Welcome Screen
- **Initial Intro Modal** — First-run welcome experience
- **Feature Overview Cards** — Grid layout overview of key features
- **"Get Started" Button** — Links to settings/configuration
- **"Models" Button** — Opens model selection modal
- **"Templates" Button** — Links to templates.html
- **"Remove Ads" Banner** — Promotes premium upgrade

### Onboarding Screens
- **Multi-Part Onboarding** — Guides users through first setup
- **New Features Marquee** — "What's New" modal showing recent updates:
  - New onboarding screens
  - LM Studio MCP Support
  - App Biometric Unlock
  - Import/Export Fixed
  - Font Customization
  - Smart Reply (BETA)
  - High-Speed Storage

### Help System
- **Help Modal/Page** — Comprehensive documentation
  - Model connection setup (LM Studio, Ollama, OpenRouter)
  - File attachment guide and supported file types
  - Premium features explanation
  - Smart Reply limitations
  - Template usage
  - Settings reference
  - TTS voice management
  - MCP integration guide
  - Troubleshooting

- **Contextual Help Links** — Links within settings/modals to help sections
- **In-Modal Help** — Setup tips within connection and configuration screens
- **FAQ Section** — Common questions and answers

### About & Legal
- **About Modal** — App version, build info, credits
- **Version Badge** — Clickable version badge (debug mode access: tap 7x)
- **Terms of Service** — Link to terms modal
- **Privacy Policy** — Link to privacy policy modal
- **Contact/Feedback** — Contact information or feedback link modal

---

## 8. UI INTERACTIONS & NAVIGATION

### Main Header
- **LMSA Logo** — Top-left branding
- **"New Chat" Button** (+) — Create new chat
- **"Toggle Sidebar" Button** (≡) — Show/hide sidebar navigation

### Sidebar Menu
- **Options Section** — Collapsible menu with:
  - New Chat
  - Settings (gear icon)
  - Getting Started
  - Models
  - Templates
  - Saved Prompts
  - Import/Export (expandable submenu)

- **Chat History** — Scrollable list of previous chats
  - Each chat shows title (auto-generated or manual)
  - Right-click context menu: Rename / Delete / Duplicate
  - Long-press on mobile triggers same menu
  - Click to load chat

### Chat Area
- **Message Bubbles** — User (blue) and AI (darker) messages
- **Timestamp** — Optional timestamp on messages
- **Model Label** — Shows model name if "Show Model Name" enabled
- **Code Block Rendering** — Highlighted syntax in gray boxes
- **Copy Button** — Per-message or per-code-block copy
- **Message Actions** — Regenerate, copy, save options
- **Thinking Sections** — Hidden or visible `<think>…</think>` blocks
- **Markdown Support** — Bold, italic, lists, tables, etc.

### Input Area
- **Text Input Field** — Message textarea with placeholder
  - Grows with multiline input
  - Character count optional
  - Voice dictation button (if available)
  
- **Attachment Button** — Open file picker (Premium only UX)
- **Send Button** — Submit message (or disable if generating)
  - Changes to Stop button during streaming
  - Disabled if rate limit reached or no model loaded

### Smart Reply (When Enabled)
- **Suggestion Pills** — 2-3 clickable suggestion cards below chat input
- **Loading State** — Skeleton while generating suggestions
- **Auto-Hide** — Suggestions disappear when new message sent
- **Tap to Use** — Click suggestion to auto-fill input

### Scroll Features
- **Auto-Scroll** — Automatic scroll to bottom during streaming (if enabled)
- **Scroll-to-Bottom Button** — Manual button to jump to latest message
- **Custom Scrollbar** — Draggable scrollbar (if enabled)
- **Momentum Scrolling** — Native smooth scrolling on touch

---

## 9. MODAL DIALOGS & POPUPS

### Connection Modals
- **IP/Port Input Modal** — Configure local server address
  - Server IP field
  - Port number field
  - Save/Cancel buttons
- **OpenRouter Key Modal** — Enter and save API key securely
- **Token Modal** — LM Studio authentication token input
- **MCP Configuration Modal** — Add/edit MCP integrations

### Confirmation Modals
- **Delete Chat Confirmation** — Confirm before deleting conversation
- **Clear All Chats** — Irreversible action confirmation
- **Reset App Confirmation** — Warning before factory reset
- **Purchase Confirmation** — Confirm premium purchase
- **Default Model Confirmation** — Confirm auto-select model selection
  - Shows model name
  - Auto-dismisses after 2 seconds

### Feature Modals
- **Premium Modal** — Upgrade prompt showing feature limits
- **Smart Reply Warning** — First-enable warning about BETA limitations
- **OpenRouter Warning** — Alert about Smart Reply disablement when using cloud
- **File Attachment Modal** — (Premium feature gate)
- **TTS Feature Gate** — (Premium feature gate)

### Information Modals
- **Model Info Modal** — Shows full model name in modal
- **Help Modal** — Comprehensive feature documentation (tabbed)
- **About Modal** — Version info and credits
- **Terms Modal** — Terms of service text
- **Privacy Policy Modal** — Privacy policy text
- **What's New Modal** — Feature release notes

### Error Modals
- **Connection Error** — Cannot reach local server
  - Suggests troubleshooting steps
  - Links to help section
  
- **No Models Available** — Server running but no models loaded
- **API Error** — Generic API error message
- **Rate Limit Status** — User hit daily quota
- **TTS Error** — Speech synthesis failed

---

## 10. NATIVE ANDROID FEATURES (Kotlin Backend)

### Biometric Authentication
- **App Lock Overlay** — Splash screen overlay when app launches
  - "Tap to Unlock" button with fingerprint icon
  - Uses BiometricPrompt API (>=API 28)
  - Falls back to device PIN/password if no biometric
- **Require Biometric Setting** — Toggle in Security section
- **Biometric Unlock on Resume** — Re-prompt if user backgrounded app
- **Lock State Persistence** — Survives configuration changes

### File I/O
- **File Chooser** — Android file picker for attachments
- **File Saver** — Save dialog for exporting responses
- **MIME Type Handling** — Correct file type associations
- **Image Encoding** — Base64 encode for image data transmission
- **Binary File Support** — Handle images and binary formats
- **Success/Failure Callbacks** — Notify JS of save result

### Text-to-Speech (TTS)
- **Android TTS Engine** — Native speech synthesis
- **Voice Selection** — System voices with locale/gender metadata
- **Audio Focus Management** — Respect other app audio playback
- **Watchdog Recovery** — Auto-recover if TTS hangs or stalls
- **Recovery Mechanism** — 1 retry attempt if TTS fails
- **Audio Focus Loss** — Pause/stop if notification or call interrupts
- **Chunk-Based Speaking** — Split long text into chunks for robustness
- **Request Queueing** — Handle multiple TTS requests gracefully

### Google Play Billing
- **In-App Purchase** — One-time "ad_removal" product
- **Purchase Restoration** — Users can restore previous purchases
- **Pending Purchase Handling** — Acknowledge purchases
- **SharedPreferences Storage** — Persist premium status locally
- **Automatic Premium Sync** — Update UI after purchase

### Google Mobile Ads
- **Native Ad Display** — Google AdMob native ads with design
- **Interstitial Ads** — Full-screen ads between chat actions (free only)
- **Ad Unit IDs** — Production and test ad unit IDs configured
- **Ad Preloading** — Load ads in background for faster display
- **Premium Skip** — No ads shown to premium users
- **Click Suppression** — Pause TTS before ad display

### In-App Review
- **Review Prompt** — Google Play Review API integration
- **User Triggered** — JavaScript can request review flow
- **System Managed** — Android/Play determines when/if to show

### Haptic Feedback
- **Light Haptic** — Subtle vibration for gentle feedback
- **Strong Haptic** — Longer vibration for important actions
- **Per-Action Haptics** — Different feedback for different UI events
- **Toggle Support** — Can disable haptics if desired

### Power Management
- **Keep Screen On** — Prevent screen sleep during long processing
- **Adaptive Brightness** — Let system manage brightness

### Usage Limiting (Native)
- **Daily Quota Enforcement** — Track completions per day
- **Midnight Reset** — Reset counters at user's local midnight
- **Local Chat Quota: 15/day** — Free tier limit (local models)
- **OpenRouter Quota: 5/day** — Cloud models limit
- **Premium Override** — Unlimited for premium users
- **SharedPreferences Storage** — Persist counts across app restarts

---

## 11. ADVANCED FEATURES & INTEGRATIONS

### Model-Specific Functionality
- **Thinking Models** — O1-style models with reasoning steps
  - `<think>` tags show/hide reasoning
  - Streaming reasoning output
  - Hide Thinking toggle
- **Tool-Using Models** — Support for MCP tools/APIs
- **OpenRouter Model Catalog** — Access to 200+ models across providers

### LM Studio MCP Support
- **MCP Configuration** — Add/manage Model Context Protocol integrations
- **Native mcp.json Support** — Load existing configurations
- **Ephemeral Servers** — Inline MCP server definitions
- **Tool Invocation** — Models can call MCP tools during conversation
- **Response with Tools** — Model responses can invoke external tools

### Chat Management
- **Import Chats** — Load previously exported chat JSON
- **Export Chats** — Save conversations as JSON for backup/sharing
- **Duplicate Chat** — Create copy of existing conversation
- **Rename Chat** — Manually rename conversations

### Accessibility
- **Biometric Unlock** — Alternative to password
- **Screen Reader Support** — Semantic HTML and ARIA labels
- **Font Size Customization** — Full range of text sizes
- **Font Family Selection** — Serif, sans-serif, monospace options
- **Dark Mode** — Default dark theme with high contrast

---

## 12. CONFIGURATION & BUILD SETTINGS

### Gradle Configuration
- **Minified Release Builds** — ProGuard code obfuscation for production
- **Debug Builds** — WebView debugging enabled, cache cleared
- **Build Type Differentiation** — Different ad unit IDs for test/production

### Feature Flags
- **Debug Mode** — Accessible via version badge (tap 7x)
  - Toggles fake premium state for testing
  - Strips premium restrictions
  - Useful for QA testing

### Asset Organization
- **CSS Files** — Tailwind, theme variables, responsive styles
- **JavaScript Modules** — ~40 JS files organized by feature
- **Font Assets** — Custom fonts in assets/fonts/
- **Image Assets** — Icons, logos, UI graphics in assets/images/

---

## 13. STORAGE & PERSISTENCE

### LocalStorage Keys
- `temperature` — Temperature setting (0.0–2.0)
- `useOpenRouter` — True if cloud models active
- `openRouterApiKey` — Encrypted API key
- `useOllama` — True if Ollama mode active
- `hideThinking` — Show/hide thinking blocks
- `autoGenerateTitles` — Auto-title setting
- `autoSmartReply` — Smart Reply toggle
- `autoScroll` — Auto-scroll setting
- `enterSendsNewline` — Enter key behavior
- `systemPrompt` — Custom AI instructions
- `selectedTTSVoice` — TTS voice name
- `chatFontFamily` — Font selection
- `chatFontSize` — Font size
- `reasoningTimeout` — Thinking model timeout (seconds)
- `defaultModelId` — Auto-select model ID
- `localSelectedModel` — Last-selected local model
- `showModelLabel` — Display model name on responses
- `showChatScrollbar` — Scrollbar visibility
- `showScrollToBottom` — Scroll-to-bottom button visibility
- `lmstudioApiToken` — LM Studio auth token
- `lmstudioMcpIntegrations` — MCP configs JSON

### Chats Storage
- `chat_{chatId}` — Individual chat message history
- `chatTitles` — Map of chat IDs to display titles
- `chatOrder` — Ordered list of chat IDs

### SharedPreferences (Android Native)
- `LMSA_PREFS`/`is_premium` — Premium status flag
- `LMSA_PREFS`/`onboarding_completed` — First-run flag

### IndexedDB (Potential)
- High-speed storage for large datasets
- Alternative to localStorage for quota limits

---

## 14. PAGE & NAVIGATION STRUCTURE

### index.html (Main Chat)
- Header with logo and controls
- Loaded model display bar
- Sidebar (navigation & chat history)
- Chat message area with auto-scroll
- Input form with attachment & send buttons
- Smart reply suggestions (if enabled)
- Various modal containers (settings, model, etc.)

### templates.html (Template Selection)
- Template grid display
- Create new template button
- Preset persona cards (Math Tutor, Joker, etc.)
- Template selection flow

### Web Assets
- **Fonts** — Google Fonts + custom local fonts
- **CSS** — Modular stylesheets by feature
- **JavaScript** — Modular ES6 modules

---

## 15. ERROR HANDLING & EDGE CASES

### Connection Failures
- "Unable to connect to LM Studio" error — Suggests troubleshooting
- "Unable to connect to Ollama" error — Customized for Ollama
- "No models available" — Instructs user to load/pull models
- Fallback help links to documentation

### Rate Limiting
- Free tier message: "15 chats/day limit reached, resets at midnight"
- OpenRouter: "5 completions/day on cloud models"
- Premium: No limiting
- UI shows remaining count or "Unlimited" badge

### TTS Failures
- Watchdog recovery on timeout
- Fallback to Web Speech API if native unavailable
- Error notification to user with retry option

### File Operations
- Large file handling (base64 encoding for images)
- MIME type validation
- Save cancellation handling
- Error callbacks to JS

### Ad Failures
- Suppress ad-related JavaScript errors
- Don't crash app if ad fails to load
- Global exception handler for ad errors

### Renderer Crashes
- WebView renderer recovery (onRenderProcessGone)
- App does not force-close on WebView crashes
- Automatic recovery attempt

---

## 16. USER FLOWS & COMMON ACTIONS

### First-Time Setup
1. User opens app → Biometric lock (if enabled) → Welcome screen
2. Welcome modal appears with overview
3. User clicks "Get Started" → Settings modal
4. Configure server/OpenRouter → System prompt → Options → Font → Actions
5. Close settings → Back to main chat
6. Click "Models" → Select model → Back to chat
7. Ready to chat

### Send Message Flow
1. User types in input field
2. Clicks send or presses Enter (based on settings)
3. Rate limit check (free) → If allowed, record completion
4. API request sent with system prompt, temperature, etc.
5. Response streams in with real-time display
6. (Optional) Smart reply suggestions generated
7. (Optional) Auto-scroll to bottom
8. User can regenerate, copy, save, or continue conversation

### Switch Models
1. User clicks "Models" in sidebar
2. Model modal opens showing available models
3. User clicks desired model to load
4. Transient confirmation toast (2 sec)
5. Modal closes, new model active
6. Next message uses new model

### Use Template
1. User clicks "Templates" in sidebar
2. Redirects to templates.html page
3. User selects persona card (or creates new)
4. System prompt updated with template instructions
5. Template indicator banner shows at top of chat
6. Messages use template persona
7. User can disable by clicking "Disable" button or clearing prompt

### Export Chat
1. User opens chat history
2. Right-click chat → "Export" option
3. File picker opens
4. Chat JSON saved to device storage
5. User can share file or back up

### Purchase Premium
1. User attempts file attachment or TTS
2. Premium modal appears showing benefits
3. User clicks "Upgrade Now"
4. Google Play billing flow opens
5. User completes purchase
6. App notifies JS of premium status
7. Features unlock (ads removed, file access enabled, etc.)

---

## 17. FEATURE DEPENDENCIES & CONFLICTS

### Mutual Exclusivity
- **Local Server vs OpenRouter** — Toggle between modes
  - Enabling one disables the other
  - UI updates to reflect active mode
  
- **Smart Reply vs OpenRouter** — Smart Reply auto-disables on cloud models
  - Prevents extra API calls (would increase costs)
  - User sees warning about this limitation

- **Ollama vs Manual Model Load** — Ollama mode disables manual loading
  - Ollama expects library to handle model selection
  - Only one method active

### Premium Gates
- File attachments → Premium only
- TTS → Premium only
- Smart Reply → No gate, but shows beta warning
- Ads → Free only (premium doesn't see ads)

### Server Requirements
- LM Studio connection → LM Studio app must be running + model loaded
- Ollama connection → Ollama service running on specified IP/port
- OpenRouter → Internet connection + valid API key

### Feature Availability
- Biometric unlock → Depends on device capability
- TTS voices → Depends on Android TTS engine
- Thinking tags → Model-specific (reasoning models)
- MCP tools → LM Studio + configured integrations

---

## 18. CUSTOMIZATION OPTIONS SUMMARY

### Per-User Settings Customizable
- ✅ Temperature (0.0–2.0)
- ✅ System prompt (unlimited text)
- ✅ Server/API settings (IP, port, keys)
- ✅ Font family (5 choices)
- ✅ Font size (5 sizes: 12px–24px)
- ✅ TTS voice (20+ system voices)
- ✅ Smart Reply (on/off)
- ✅ Auto-scroll (on/off)
- ✅ Enter key behavior (newline vs send)
- ✅ Show model name (on/off)
- ✅ Show chat scrollbar (on/off)
- ✅ Hide thinking text (on/off)
- ✅ Default model (auto-select)
- ✅ Biometric unlock (on/off)
- ✅ Auto-generate titles (on/off)
- ✅ Reasoning timeout (0–600+ seconds)

### Non-Customizable (Fixed)
- ❌ Chat bubble styling (color/border fixed)
- ❌ Layout/grid (responsive but not customizable)
- ❌ Message timestamps (always off or on, not combined user control)
- ❌ Ad styling (AdMob native format)
- ❌ Header buttons (always show New Chat + Sidebar toggle)

---

## 19. KNOWN LIMITATIONS

### Smart Reply
- BETA feature — Quality varies by model
- Not recommended for reasoning/thinking models
- Disabled with OpenRouter (cost concern)
- May not always generate 2-3 suggestions

### File Attachments
- Large files may timeout on slow connections
- Some models have file size limits
- PDF support depends on model capabilities
- Premium feature only

### TTS
- Limited by device TTS engine
- Quality depends on Android version
- May fail on some devices
- Premium feature only

### Local Server Models
- Requires network connectivity to server
- Speed depends on server hardware
- Model loading time depends on model size
- Ollama alternative available

### Reasoning Models
- Different timeout settings needed per model
- May have longer response times
- Thinking sections can be very long
- Not all models support reasoning tags

---

## 20. FEATURE ROADMAP & FUTURE POSSIBILITIES

### Currently Implemented
- ✅ Local model support (LM Studio + Ollama)
- ✅ Cloud model support (OpenRouter)
- ✅ File attachments (Premium)
- ✅ Text-to-speech (Premium)
- ✅ Biometric lock
- ✅ Templates & personas
- ✅ Smart Reply (BETA)
- ✅ MCP integrations (LM Studio)
- ✅ Multi-font & size customization
- ✅ Chat import/export

### Partially Implemented
- ⚠️ Import/Export (recently fixed)
- ⚠️ Smart Reply (BETA — limited quality)
- ⚠️ Reasoning models (O1-style support — emerging)

### Potentially Future
- 🔮 Voice input/dictation
- 🔮 Streaming file uploads
- 🔮 Chat collaboration/sharing
- 🔮 Plugin system
- 🔮 Advanced analytics
- 🔮 Sync across devices
- 🔮 Web version parity

---

## APPENDIX: VERSION HISTORY & RELEASES

### Latest Features (What's New)
- New onboarding screens
- LM Studio MCP Support
- App Biometric Unlock
- Import/Export Fixed
- Font Customization
- Smart Reply (BETA)
- High-Speed Storage

### Known Issues
- Sidebar collapsibles may become invisible on WebView (paint fix applied)
- Smart Reply quality varies by model
- Some AdMob test ads may fail silently

---

**Document Generated:** April 2026  
**App Version:** Latest (Kotlin 2.0, Android 12–15)  
**Last Updated:** April 2026

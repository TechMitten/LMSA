# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> LMSA Core Features E2E Tests >> should select local provider and show configured actions
- Location: tests\app.spec.js:25:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#configured-actions')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#configured-actions')
    9 × locator resolved to <div id="configured-actions" class="welcome-actions hidden">…</div>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active]:
  - text:  
  - generic:
    - banner:
      - generic:
        - generic:
          - img "LMSA Icon"
        - heading "LMSA" [level=1]
      - generic:
        - button "Toggle Sidebar":
          - generic:
            - img
    - generic:
      - generic:
        - generic [ref=e1]:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "LMSA Icon"
                - generic:
                  - heading "Choose Your AI Provider" [level=1]
              - generic:
                - button " Local Server LM Studio, Ollama & more — private & offline Private Offline ":
                  - generic:
                    - generic:
                      - generic: 
                    - generic:
                      - heading "Local Server" [level=3]
                      - paragraph: LM Studio, Ollama & more — private & offline
                      - generic:
                        - generic: Private
                        - generic: Offline
                    - generic:
                      - generic: 
                - button " OpenRouter Hundreds of cloud models with BYOK access 100+ Models BYOK ":
                  - generic:
                    - generic:
                      - generic: 
                    - generic:
                      - heading "OpenRouter" [level=3]
                      - paragraph: Hundreds of cloud models with BYOK access
                      - generic:
                        - generic: 100+ Models
                        - generic: BYOK
                    - generic:
                      - generic: 
                - button " Custom API Any OpenAI-compatible endpoint — full control Any Provider Flexible ":
                  - generic:
                    - generic:
                      - generic: 
                    - generic:
                      - heading "Custom API" [level=3]
                      - paragraph: Any OpenAI-compatible endpoint — full control
                      - generic:
                        - generic: Any Provider
                        - generic: Flexible
                    - generic:
                      - generic: 
              - text:    
        - generic:
          - generic:
            - generic:
              - textbox "Type your message":
                - /placeholder: Type your message...
              - button "" [ref=e2] [cursor=pointer]:
                - generic: 
            - button "Send message":
              - generic:
                - generic: 
            - text: 
          - generic [ref=e3]: AI models can be inaccurate. Check for errors.
        - text:         
  - text:      
  - dialog " What's New v10.15" [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading " What's New v10.15" [level=2] [ref=e7]:
          - generic [ref=e9]: 
          - generic [ref=e10]:
            - generic [ref=e11]: What's New
            - generic [ref=e12]: v10.15
        - button "" [ref=e13] [cursor=pointer]:
          - generic [ref=e14]: 
      - generic [ref=e16]:
        - generic [ref=e19]:
          - generic [ref=e21]: 
          - generic [ref=e22]:
            - heading "Smarter UI & Streamlined Setup" [level=3] [ref=e24]
            - generic [ref=e25]:
              - paragraph [ref=e26]: We've cleaned up the interface! The Web Search toggle and + New Chat button have moved from the header to the side menu.
              - paragraph [ref=e27]: When you open the app, you'll now be greeted with a provider selection screen. Simply pick your preferred AI provider, confirm your server or API settings, and tap Apply to start chatting immediately.
        - generic [ref=e30]:
          - generic [ref=e32]: 
          - generic [ref=e33]:
            - heading "Offline Access" [level=3] [ref=e35]
            - generic [ref=e36]:
              - paragraph [ref=e37]: Offline access is now available for Premium users, so you can keep using LMSA without an internet connection.
              - paragraph [ref=e38]: "Restrictions apply: offline mode is limited to LAN-only parts of the app (such as Local Server chat, saved chats, and templates). Cloud features like OpenRouter and web search still require an active internet connection."
        - generic [ref=e41]:
          - generic [ref=e43]: 
          - generic [ref=e44]:
            - heading "Latest App Improvements" [level=3] [ref=e46]
            - generic [ref=e47]:
              - paragraph [ref=e48]: You can now import system prompts directly from LM Studio.
              - paragraph [ref=e49]: Templates are now fully v2 character card compatible, including template imports.
              - paragraph [ref=e50]: TTS is now available to free users, with voice mode changes still restricted to premium.
              - paragraph [ref=e51]: Images now persist in chat history instead of disappearing after reloads or revisits.
              - paragraph [ref=e52]: You can quickly confirm whether you are using Local Server or OpenRouter by checking the bottom of the side menu.
        - generic [ref=e55]:
          - generic [ref=e57]: 
          - generic [ref=e58]:
            - heading "Real-Time Web Search" [level=3] [ref=e60]
            - generic [ref=e61]:
              - paragraph [ref=e62]: Augment AI responses with real-time data from the web! Toggle it effortlessly via the globe icon in the side menu or in Settings.
              - paragraph [ref=e63]: When enabled, the AI performs a live search to provide up-to-date answers on recent events, news, or complex facts.
        - generic [ref=e66]:
          - generic [ref=e68]: 
          - generic [ref=e69]:
            - heading "LM Studio MCP Support" [level=3] [ref=e71]
            - generic [ref=e72]:
              - paragraph [ref=e73]: LMSA now supports MCP servers with LM Studio.
              - paragraph [ref=e74]:
                - text: You can add LM Studio MCP integrations in Settings and use both
                - code [ref=e75]: mcp.json
                - text: plugins and ephemeral MCP servers directly from the app.
        - generic [ref=e78]:
          - generic [ref=e80]: 
          - generic [ref=e81]:
            - heading "App Biometric Unlock" [level=3] [ref=e83]
            - generic [ref=e84]:
              - paragraph [ref=e85]: Secure your chats with device biometrics! You can now require fingerprint or face unlock to open the app.
              - paragraph [ref=e86]: Enable this feature anytime in the Settings menu under Security.
        - generic [ref=e89]:
          - generic [ref=e91]: 
          - generic [ref=e92]:
            - heading "Import/Export Fixed" [level=3] [ref=e94]
            - generic [ref=e95]:
              - paragraph [ref=e96]: The Import/Export feature is now fully functional again.
              - paragraph [ref=e97]: We fixed the bug so backups and restores should now work reliably.
        - generic [ref=e100]:
          - generic [ref=e102]: 
          - generic [ref=e103]:
            - heading "Swipe to Open Side Menu" [level=3] [ref=e105]
            - generic [ref=e106]:
              - paragraph [ref=e107]: You can now open the side menu by swiping in from the left edge of the screen for quicker navigation.
              - paragraph [ref=e108]: Prefer not to use gestures? You can disable this swipe action anytime in Settings.
        - generic [ref=e111]:
          - generic [ref=e113]: 
          - generic [ref=e114]:
            - heading "New High-Speed Storage" [level=3] [ref=e116]
            - paragraph [ref=e118]: We've upgraded our storage engine! Your chats are now saved directly to your device's internal storage. You can now save more chats than ever before without slowing down, ensuring the app stays lightning-fast.
        - generic [ref=e121]:
          - generic [ref=e123]: 
          - generic [ref=e124]:
            - heading "Rename Saved Chat Titles" [level=3] [ref=e126]
            - paragraph [ref=e128]: You can now rename the title of any saved chat in Chat History. Just tap the icon to the right of the title, enter a new name, and save it.
        - generic [ref=e131]:
          - generic [ref=e133]: 
          - generic [ref=e134]:
            - heading "Font Customization" [level=3] [ref=e136]
            - paragraph [ref=e138]: You can now change the font and font size used in the chat bubbles via the message history. Customize your chatting experience to match your preferences for better readability and comfort.
        - generic [ref=e141]:
          - generic [ref=e143]: 
          - generic [ref=e144]:
            - heading "OpenRouter (Cloud AI)" [level=3] [ref=e146]
            - generic [ref=e147]:
              - paragraph [ref=e148]: You can now connect to cloud models via OpenRouter using your own API key. This disables the local server connection and lets you use cloud-hosted models.
              - paragraph [ref=e149]: To configure, click "Configure OpenRouter" and enter your API key in Settings. Your key is stored locally on your device only.
        - generic [ref=e152]:
          - generic [ref=e154]: 
          - generic [ref=e155]:
            - heading "Smart Reply" [level=3] [ref=e157]
            - generic [ref=e158]:
              - paragraph [ref=e159]: Get 3 AI-powered suggestions after each response. Tap any suggestion to instantly send it - no typing required.
              - paragraph [ref=e160]:
                - strong [ref=e161]: "Note:"
                - text: Smart Reply is in BETA - suggestion quality varies by AI model. Toggle in Settings.
        - generic [ref=e164]:
          - generic [ref=e166]: 
          - generic [ref=e167]:
            - heading "Model Name in AI Responses" [level=3] [ref=e169]
            - paragraph [ref=e171]: You can now add the name of the LLM model to the bottom of AI chat response bubbles. This will be enabled by default but can be disabled at any time in the settings menu.
      - generic [ref=e173]:
        - generic [ref=e174] [cursor=pointer]:
          - checkbox "Never show this again" [ref=e175]
          - generic [ref=e176]: Never show this again
        - button " Got it!" [ref=e177] [cursor=pointer]:
          - generic [ref=e178]:
            - generic [ref=e179]: 
            - generic [ref=e180]: Got it!
  - text:       
  - dialog " Settings" [ref=e181]:
    - generic [ref=e182]:
      - generic [ref=e183]:
        - generic [ref=e184]:
          - heading " Settings" [level=2] [ref=e185]:
            - generic [ref=e186]: 
            - text: Settings
          - button "Close settings" [ref=e187] [cursor=pointer]:
            - generic [ref=e188]: 
        - paragraph [ref=e189]: Server Connection
      - generic [ref=e196]:
        - generic [ref=e197]:
          - generic [ref=e198]:
            - button " Local Server" [pressed] [ref=e199] [cursor=pointer]:
              - generic [ref=e201]: 
              - generic [ref=e202]: Local Server
            - button " OpenRouter" [ref=e203] [cursor=pointer]:
              - generic [ref=e205]: 
              - generic [ref=e206]: OpenRouter
            - button " Custom Endpoint" [ref=e207] [cursor=pointer]:
              - generic [ref=e209]: 
              - generic [ref=e210]: Custom Endpoint
          - generic [ref=e211]:
            - generic [ref=e212]:
              - generic [ref=e213]:
                - generic [ref=e214]: 
                - generic [ref=e215]: Not configured
              - button " Configure" [ref=e216] [cursor=pointer]:
                - generic [ref=e217]: 
                - generic [ref=e218]: Configure
            - generic [ref=e219]:
              - generic [ref=e220]:
                - generic [ref=e221]: 
                - generic [ref=e222]: No token (optional)
              - button " Token" [ref=e223] [cursor=pointer]:
                - generic [ref=e224]: 
                - generic [ref=e225]: Token
            - generic [ref=e226]:
              - generic [ref=e227]:
                - generic [ref=e228]: 
                - generic [ref=e229]: No MCP integrations configured
              - button " MCP" [ref=e230] [cursor=pointer]:
                - generic [ref=e231]: 
                - generic [ref=e232]: MCP
            - paragraph [ref=e233]:
              - text: Need help? Visit the
              - link "LMSA Help section" [ref=e234] [cursor=pointer]:
                - /url: "#"
              - text: .
          - text:    
          - generic [ref=e235]:
            - generic [ref=e236]:
              - heading "Saved Presets" [level=3] [ref=e238]
              - generic [ref=e239]:
                - generic [ref=e240]: Local Server
                - button "Expand saved presets" [ref=e241] [cursor=pointer]:
                  - generic [ref=e242]: 
            - text: 
        - generic [ref=e243]:
          - button " Next" [ref=e245] [cursor=pointer]:
            - generic [ref=e246]: 
            - generic [ref=e247]: Next
          - text:       
        - button " Confirm" [ref=e249] [cursor=pointer]:
          - generic [ref=e250]: 
          - generic [ref=e251]: Confirm
  - text: 
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('LMSA Core Features E2E Tests', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Navigate to the local server hosting the app
  7  |     await page.goto('/');
  8  | 
  9  |     // Handle the Terms of Service Modal that appears on first load
  10 |     // It might take a moment to animate in, so wait for it and click accept
  11 |     const acceptTermsBtn = page.locator('#accept-terms-btn');
  12 |     if (await acceptTermsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  13 |       await acceptTermsBtn.click();
  14 |       // Wait for it to hide
  15 |       await expect(page.locator('#terms-modal')).toBeHidden();
  16 |     }
  17 |   });
  18 | 
  19 |   test('should load the app and show welcome dashboard', async ({ page }) => {
  20 |     // The welcome title should be visible
  21 |     await expect(page.locator('#welcome-title')).toBeVisible();
  22 |     await expect(page.locator('#welcome-title')).toContainText('Choose Your AI Provider');
  23 |   });
  24 | 
  25 |   test('should select local provider and show configured actions', async ({ page }) => {
  26 |     // Click the Local Server option
  27 |     await page.click('#setup-local-btn');
  28 |     
  29 |     // Once configured, the get-started / configured actions should be visible
> 30 |     await expect(page.locator('#configured-actions')).toBeVisible({ timeout: 5000 });
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  31 |   });
  32 | 
  33 |   test('should open settings modal from sidebar', async ({ page }) => {
  34 |     // Bypass onboarding by clicking local provider
  35 |     await page.click('#setup-local-btn');
  36 |     
  37 |     // Click sidebar toggle
  38 |     await page.click('#sidebar-toggle');
  39 |     await expect(page.locator('#sidebar')).toBeVisible();
  40 | 
  41 |     // Click Settings
  42 |     await page.click('#settings-btn');
  43 | 
  44 |     // Wait for the settings modal to become visible
  45 |     await expect(page.locator('#settings-modal')).toBeVisible({ timeout: 5000 });
  46 |   });
  47 | 
  48 |   test('should handle chat submission and mock AI response', async ({ page }) => {
  49 |     // Mock the API response to avoid hitting a real server
  50 |     await page.route('**/v1/chat/completions', async route => {
  51 |       const json = {
  52 |         choices: [{ message: { content: 'This is a mocked AI response from Playwright tests!' } }]
  53 |       };
  54 |       await route.fulfill({ json });
  55 |     });
  56 |     
  57 |     await page.route('**/api/v1/chat/completions', async route => {
  58 |       const json = {
  59 |         choices: [{ message: { content: 'This is a mocked AI response from Playwright tests!' } }]
  60 |       };
  61 |       await route.fulfill({ json });
  62 |     });
  63 | 
  64 |     // Bypass onboarding
  65 |     await page.click('#setup-local-btn');
  66 | 
  67 |     // Type a message
  68 |     await page.fill('#user-input', 'Hello AI');
  69 |     
  70 |     // Click Send
  71 |     await page.click('#send-button');
  72 | 
  73 |     // Check if user message is in the DOM
  74 |     await expect(page.locator('#messages')).toContainText('Hello AI', { timeout: 5000 });
  75 | 
  76 |     // Check if the mock AI response appears in the DOM
  77 |     await expect(page.locator('#messages')).toContainText('This is a mocked AI response from Playwright tests!', { timeout: 15000 });
  78 |   });
  79 | 
  80 | });
  81 | 
```
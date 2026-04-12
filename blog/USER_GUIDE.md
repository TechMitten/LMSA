# LMSA User Guide — Complete Guide to AI-Powered Chat & Search

**Welcome to LMSA!** 🎉 This guide covers everything you need to know about using the app, from your first chat to advanced features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Main Interface](#the-main-interface)
3. [Sending Messages & Getting Responses](#sending-messages--getting-responses)
4. [Managing Chats](#managing-chats)
5. [Choosing Your AI Model](#choosing-your-ai-model)
6. [Customizing Settings](#customizing-settings)
7. [Using Personas & Templates](#using-personas--templates)
8. [Premium Features](#premium-features)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting & FAQ](#troubleshooting--faq)
11. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### First Time Using LMSA?

When you first open LMSA, you'll see a **Welcome Screen** that introduces you to the app. This screen highlights key features and helps you get oriented.

**What you need to know:**
- You can start chatting immediately—no setup required!
- The app uses AI models to generate responses to your questions
- You can customize everything in **Settings** later
- Free users get 20 local AI responses or 5 cloud responses per day

### Initial Setup

1. **Allow Permissions** — LMSA may ask for permission to access files and device features. These are used for:
   - Saving and exporting chats
   - Text-to-speech functionality
   - Other features you enable in settings

2. **Unlock with Biometric** (optional) — You can set up fingerprint/face unlock in Settings for quick access

3. **Choose Your First Model** — The app will suggest a default model, but you can change it anytime

---

## The Main Interface

### Layout Overview

```
┌──────────────────────────────────────────────┐
│  [Icon] LMSA        [+ NEW]  [☰ MENU]       │
├──────────────┬───────────────────────────────┤
│              │  Currently Loaded: Model Name │
│  Sidebar     ├───────────────────────────────┤
│              │                               │
│ • New Chat   │     Chat Area                 │
│ • Settings   │  (Messages & Responses)      │
│ • Models     │                              │
│ • Templates  │                              │
│ • Help, etc. │                              │
│              ├───────────────────────────────┤
│ Chat List    │ Input Area (Type here)       │
│              │ [Send Button]                │
└──────────────┴───────────────────────────────┘
```

### Key Areas Explained

#### **Header Bar** (Top of screen)
- **App Icon** — LMSA logo
- **"+" Button** — Create a new chat
- **"≡" (Hamburger Menu)** — Open/close the sidebar with all navigation options

#### **Sidebar** (Left side, toggle with ≡ menu)
The sidebar contains all navigation:

**Main Menu (Options section):**
- **New Chat** — Start a new conversation
- **Settings** — Customize app behavior (gear icon)
- **Getting Started** — View onboarding guide
- **Models** — Select and manage AI models (robot icon)
- **Templates** — Browse and create AI personas (grid icon)
- **Saved Prompts** — Access saved system prompts
- **Import/Export** — Backup and restore chats
- **What's New** — See latest features
- **Help** — Get guidance and support
- **Premium** — Upgrade or manage subscription

**Active Template Indicator:**
- Shows if a persona is currently active
- Displays template name
- Option to disable template

**Chat History:**
- Scrollable list of all your past conversations
- Tap any chat to open it
- Long-tap for options (delete, rename, etc.)

**Bottom Links:**
- Terms of Service, Privacy Policy, About

#### **Model Display Bar** (Below header)
- Shows the currently loaded AI model name
- Example: "Currently Loaded: mistral"
- Updates when you select a different model

#### **Chat Area** (Center)
- Display of your previous messages (usually in a light color)
- AI responses (in a contrasting color)
- Code blocks are highlighted for easy reading
- Scroll up to see older messages

#### **Input Area** (Bottom)
- Text field where you type your question or request
- Send button to submit your message
- Smart reply suggestions may appear below responses (BETA feature)

---

## Sending Messages & Getting Responses

### How to Send a Message

1. **Tap the input field** at the bottom of the screen
2. **Type your message** — Ask a question, request code, get ideas, or anything else
3. **Press Enter** (or tap the Send button →)
4. **Wait for response** — The AI will process your request and respond

**Message Tips:**
- Be specific — Detailed questions get better answers
- Break complex requests into smaller parts
- You can follow up with "tell me more" or related questions

### Understanding Response Features

#### **Code Highlighting**
When the AI includes code, it appears with:
- Color-coded syntax highlighting
- Easy-to-read formatting
- You can copy code blocks to use in your projects

#### **Regenerate Response**
Don't like a response? You can regenerate it:
1. Find the message you want to redo
2. Tap the "Regenerate" button/icon
3. The AI will create a new response to your original message

#### **Export Responses**
Save responses as files (Premium feature):
1. Tap the Export option on a response
2. Choose format (.txt or .markdown)
3. File is saved to your device
4. Share or edit in your favorite text editor

#### **Smart Replies** (BETA Feature)
Quick-suggestion buttons may appear below messages:
- Suggested follow-up conversations
- Help you explore topics deeper
- Just tap to ask the suggested question

### Message History
- Your messages are automatically saved
- Scroll up to review previous messages
- All messages stay until you delete the conversation

---

## Managing Chats

### Creating a New Chat
1. Tap the **"+" button** in the header (top right), OR
2. Open the sidebar (≡) and tap **"New Chat"** in the Options section
3. Start typing your first message
4. The chat is automatically saved with a title

### Chat Titles
- **Auto-generated** — The app creates a title based on your first message
- **Custom titles** — You can rename chats in the sidebar (long-tap or tap menu)

### Switching Between Chats
1. Open the **Sidebar** (tap ≡ if closed)
2. Scroll through your **Chat List**
3. Tap any chat to open it
4. Your conversation history instantly appears

### Organizing Chats
- **Search chats** — Use the search function in the sidebar to find conversations
- **Delete chats** — Long-tap a chat name and select "Delete" (or use sidebar menu)
- **Archive** — Some chat managers let you archive old conversations

### Chat Limits
- **Free Users** — 15 responses per day (local AI) or 5 responses per day (cloud AI)
- **Premium Users** — Unlimited responses per day
- Daily limits reset at midnight (your device time)

**Tip:** Save important responses as files to keep them even if you delete the chat.

---

## Choosing Your AI Model

### What are AI Models?

AI Models are different versions of artificial intelligence with different strengths:
- **Local Models** — Run on your device or local computer (faster, no internet needed)
- **Cloud Models** — Run on OpenRouter servers (more powerful, requires internet)

### Accessing Model Selection

1. Tap the **hamburger menu** (≡) in the header to open the sidebar
2. In the sidebar **Options** section, tap **"Models"** (robot icon)
3. Or from the welcome screen, tap the **"Models"** button

### Available Model Types

#### **Local Models** (Requires LM Studio or Ollama)
- Set up a local server on your computer
- Make it accessible to your phone
- Models include: Llama, Mistral, Neural Chat, and others
- **Advantages:** Fast, no internet, free
- **Disadvantages:** Less powerful, requires setup

#### **Cloud Models** (OpenRouter - Requires API Key)
- Access via OpenRouter service
- Many options: Claude, GPT, Llama variants, and more
- **Advantages:** Powerful, ease of use, active development
- **Disadvantages:** Requires internet, token-based pricing, daily limits

### Setting Up a Model

#### **Local Model Setup:**
1. Install **LM Studio** or **Ollama** on your computer
2. Download your chosen model
3. Start the server on your computer
4. In LMSA Settings, enter the server address
5. Tap "Test Connection" to verify

#### **Cloud Model Setup (OpenRouter):**
1. Visit **openrouter.ai** and create an account
2. Get your API key from the dashboard
3. In LMSA, paste your API key in Settings
4. Select your preferred model from the list
5. Adjust settings like output length

### Switching Models Mid-Conversation
1. Tap the **hamburger menu** (≡) to open sidebar
2. Tap **"Models"** in the Options section
3. Select a different model
4. The model display bar updates to show the new selection
5. Next response will use the new model
6. Full conversation history is preserved

### Model Features

| Feature | Local | Cloud |
|---------|-------|-------|
| **Speed** | Very Fast | Fast |
| **Power** | Moderate | Very High |
| **Cost** | Free | Pay-per-token |
| **Internet Required** | No | Yes |
| **Setup Difficulty** | Medium | Easy |
| **Model Variety** | Good | Excellent |

---

## Customizing Settings

### Accessing Settings

**Method 1:** Tap the **hamburger menu** (≡) in the header to open sidebar
**Method 2:** In the sidebar **Options** section, tap **"Settings"** (gear icon)
**Method 3:** From the welcome screen, tap the **"Settings"** button

### Settings Overview

LMSA has 20+ customizable options organized in categories:

#### **1. AI Behavior Settings**

**Temperature**
- **What it does:** Controls how creative vs. focused the AI is
- **Range:** 0 (focused) to 1.0 (creative)
- **Example:** Use 0.3 for factual questions, 0.8 for creative writing
- **Lock Option:** Tap to lock your chosen temperature so it doesn't change

**System Prompt**
- **What it does:** Instructs the AI how to behave
- **Edit it:** Customize the AI's personality, tone, and style
- **Example:** "You are a helpful coding assistant who explains in simple terms"

#### **2. Display Settings**

**Font Family**
- Choose your preferred font: Default, Serif, Monospace, etc.
- Most readable with plenty of line spacing

**Font Size**
- 5 size options: Small, Normal, Large, Extra Large, Huge
- Tap to preview before saving

**Auto-Scroll**
- **On:** New messages automatically scroll into view
- **Off:** Stay focused on specific messages

**Chat Scrollbar**
- Show or hide the scrollbar for navigation

#### **3. Advanced Features**

**Hide Thinking**
- For AI models that show reasoning: choose to display or hide the thinking process
- Useful for cleaner responses vs. seeing the AI's work

**Auto-Generate Titles**
- **On:** Chats are automatically named based on content
- **Off:** Name chats manually

**Biometric Unlock**
- Enable fingerprint or face unlock for app security
- Faster than typing a password

#### **4. Input & Interaction**

**Enter Key Behavior**
- **Send:** Press Enter to send messages (default)
- **Newline:** Press Enter to create new line; tap Send button to submit

#### **5. Text-to-Speech** (Premium)

**TTS Voice Selection**
- Choose from available system voices
- Preview voice before setting as default

**Note:** Requires Premium subscription

#### **6. Other Options**

**Smart Replies**
- Toggle suggested follow-up questions on/off

**Haptic Feedback**
- Enable/disable vibration feedback on actions

**Light/Dark Theme**
- Choose visual theme preference

---

## Using Personas & Templates

### What are Personas?

Personas are pre-configured AI personalities that change how the AI responds. Switch personalities instantly without retyping instructions.

### Accessing Personas

1. Tap the **hamburger menu** (≡) to open the sidebar
2. In the sidebar **Options** section, tap **"Templates"** (grid icon)
3. Browse available personas/templates
4. Tap one to activate it

### Built-in Personas

LMSA includes 13 pre-made personas:

| Persona | Best For | Tone |
|---------|----------|------|
| **General Assistant** | Everyday questions | Helpful, friendly |
| **Code Expert** | Programming help | Technical, accurate |
| **Writer** | Creative writing | Expressive, flowing |
| **Teacher** | Learning topics | Patient, clear |
| **Researcher** | Deep dives | Analytical, thorough |
| **Brainstormer** | Ideation | Creative, open-ended |
| **Business Advisor** | Professional topics | Executive, strategic |
| **Casual Friend** | Chatty conversation | Friendly, informal |
| **Skeptic** | Testing ideas | Critical, questioning |
| **Poet** | Creative expression | Lyrical, artistic |
| **Scientist** | STEM topics | Rigorous, precise |
| **Humorist** | Entertainment | Witty, funny |
| **Minimalist** | Concise answers | Brief, direct |

### Creating a Custom Persona

1. Tap the **hamburger menu** (≡) to open the sidebar
2. Tap **"Templates"** in the Options section
3. Tap **"Create New Template"** or **"+"** button
4. **Name it** — Give it a memorable name (e.g., "My Code Helper")
5. **Set the system prompt** — Write instructions for how you want the AI to behave
6. **Test it** — Start a chat to see how it works
7. **Refine** — Edit and improve based on results

### Custom Persona Tips

**Write effective prompts:**
```
"You are a Python expert. Provide code solutions with explanations. 
Always suggest the most Pythonic approach. Include type hints."
```

**Include:**
- Who the AI is pretending to be
- What tone to use
- What topics to focus on
- How detailed answers should be

**Avoid:**
- Conflicting instructions
- Extremely long prompts
- Vague descriptions

---

## Premium Features

### What's Premium?

Premium is an optional **one-time purchase** that unlocks all advanced features and removes limitations.

### Premium vs. Free Comparison

| Feature | Free | Premium |
|---------|------|---------|
| **Daily Responses** | 20 (local) OR 5 (cloud) | Unlimited |
| **Chat Limit** | No limit | No limit |
| **Ads** | Yes | No |
| **File Attachments** | ❌ | ✅ |
| **Export Responses** | Limited | ✅ |
| **Text-to-Speech** | ❌ | ✅ |
| **Custom Personas** | Shared pool | Unlimited |
| **Settings** | All available | All available |
| **Cost** | $0 (Free forever) | One-time purchase |

### How to Get Premium

1. Tap the **hamburger menu** (≡) to open sidebar
2. In the sidebar, scroll to the **"Premium"** section
3. Tap **"Remove Ads"** (or **"Upgrade"** option)
4. Review the **Premium Modal** showing all benefits
5. Tap **"Upgrade Now"**
6. Complete the purchase flow (Google Play Billing)
7. Instantly get unlimited access!

### File Attachments (Premium Only)

**What you can do:**
- Upload documents, images, or text files
- Include them with your message
- Get the AI to analyze or process them

**How to attach files:**
1. In the input area, look for attachment icon (+)
2. Select "Upload File"
3. Choose file from your device
4. The file previews in the chat
5. Type your question and send
6. AI processes the file in your question

**Supported formats:**
- Text files (.txt, .md, .csv)
- Code files (.js, .py, .java, etc.)
- Documents (.pdf - if supported by model)
- Images (.jpg, .png - if supported by model)

### Export Responses (Premium Only)

**Save any response as a file:**
1. Find the response you want to save
2. Tap the **"Export"** or **"Save"** button
3. Choose format:
   - **.txt** — Plain text
   - **.markdown** — Formatted markdown (includes code highlighting)
4. File is saved to your device storage
5. Access it in your file manager or open in any text editor

### Text-to-Speech (Premium Only)

**Hear responses read aloud:**
1. If Premium + TTS enabled, use your device's voice control
2. Or tap **"Speak"** button on any response
3. AI reads the message using your selected voice
4. Adjust voice in Settings → TTS voice selection

**Features:**
- Multiple voice options
- Stops when you tap it again
- Continues reading if interrupted

---

## Advanced Features

### Thinking Models & Reasoning

Some AI models (like Claude) include a "thinking" process where the AI reasons through complex problems.

**How it works:**
1. When you ask a complex question, the AI shows its thinking
2. Takes slightly longer but produces better answers
3. You can see the reasoning process
4. Control visibility in Settings → "Hide Thinking"

**Best for:**
- Complex math or logic problems
- Deep analysis
- Debugging code

### MCP Tools & Integrations

**MCP (Model Context Protocol)** allows AI to use external tools:
- Fetch recent weather data
- Look up information online
- Process specific data formats
- Interact with services

**How to use:**
1. Some models/configurations include MCP tools built-in
2. The AI will use them automatically when helpful
3. Results are seamlessly integrated into responses

**Example:** "Tell me today's weather" — AI uses weather tool to fetch current conditions

### Import & Export Chats

**Export all your chats:**
1. Tap the **hamburger menu** (≡) to open the sidebar
2. In the sidebar **Options**, tap **"Import/Export"**
3. Select **"Export Chats"**
4. Choose format (JSON or other compatible format)
5. Download or share the file

**Import chats:**
1. Tap the **hamburger menu** (≡) to open the sidebar
2. In the sidebar **Options**, tap **"Import/Export"**
3. Select **"Import Chats"**
4. Select the backup file
5. Conversations are restored

**Use case:** Switch devices or backup important conversations

---

## Troubleshooting & FAQ

### Common Problems

#### **"Connection Failed" Error**

*Problem:* Can't connect to local AI server or cloud service

**Solutions:**
1. **For local servers (LM Studio/Ollama):**
   - Ensure the server is running on your computer
   - Check your computer's IP address is correct
   - Verify firewall isn't blocking connections
   - Restart the server

2. **For cloud (OpenRouter):**
   - Check your internet connection
   - Verify your API key is valid
   - Check OpenRouter website status
   - Try a different model

#### **Daily Limit Reached (Free Users)**

*Problem:* Getting "limit reached" message before response

**Causes:**
- Used up daily limit (20 for local, 5 for cloud)
- Resets at midnight

**Solutions:**
1. Wait until tomorrow for limit to reset
2. Switch to the other model type if available
3. Upgrade to Premium for unlimited access
#### **Text-to-Speech Not Working**

*Problem:* Can't hear responses being read aloud

**Causes:**
- Not Premium (TTS is Premium feature)
- Device volume is muted
- TTS service disabled on device
- Network issue (for cloud models)

**Solutions:**
1. Check you have Premium subscription active
2. Unmute device volume
3. Go to **Settings** → **Text-to-Speech** → Enable
4. Restart app
5. Ensure stable internet connection

#### **File Attachment Not Working**

*Problem:* Can't upload files or attachment fails

**Causes:**
- Not Premium (attachments are Premium feature)
- File format not supported
- File too large
- Network connectivity

**Solutions:**
1. Verify you have Premium subscription
2. Try a smaller file
3. Check file format is supported by your model
4. Check internet connection

#### **Chat Title Not Auto-Generating**

*Problem:* You name the chat yourself but want auto-naming

**Solution:**
1. Go to **Settings** → **Auto-Generate Titles**
2. Toggle it **On**
3. Start a new chat — title will be automatic

#### **Settings Changes Not Saving**

*Problem:* You change a setting but it reverts

**Solutions:**
1. Tap **"Save"** or **"Confirm"** after changes
2. Restart the app
3. On Android, ensure app has permission to save data
4. Try closing other apps to free up memory

#### **Can't Find Model Selection**

*Problem:* Where is the model picker?

**Solutions:**
1. Tap the **Model Name** in the header bar
2. Or go to **Settings** → **Model Selection**
3. Or check the **Sidebar**
4. Cloud models: Settings → **OpenRouter** → select model

#### **App Crashes or Freezes**

*Problem:* App suddenly closes or becomes unresponsive

**Solutions:**
1. Force close and restart the app
2. Clear app cache: **Device Settings** → **Apps** → **LMSA** → **Storage** → **Clear Cache**
3. Restart your device
4. On serious issues: uninstall and reinstall
5. Report the issue if it persists

### Frequently Asked Questions

**Q: Is LMSA free?**
A: Yes! The core features are free forever. Premium is optional for unlimited usage and advanced features.

**Q: Do I need internet for LMSA?**
A: For local AI models, no. For cloud models, yes. Local setup requires internet only once for initial configuration.

**Q: Can I delete a chat?**
A: Yes. Long-tap a chat in the sidebar and select "Delete," or use the chat's menu options.

**Q: How are my chats stored?**
A: Chats are stored on your device locally. They don't sync to servers unless you manually export them.

**Q: Can I use LMSA offline?**
A: Yes, if you set up a local AI server. Cloud models require internet.

**Q: What happens if I don't use the app for a while?**
A: Nothing. Your chats and settings are preserved indefinitely until you delete them.

**Q: Can I have multiple personas active at once?**
A: One persona at a time per chat. You can switch personas mid-conversation to experiment.

**Q: How do I contact support?**
A: Check the **Help** section in the app for contact info, or visit the app's website/store page for support options.

**Q: Can I transfer my chats to another device?**
A: Yes! Use **Export Chats** to create a backup, then **Import Chats** on the new device.

**Q: Does LMSA track my conversations?**
A: No. Your data is stored locally on your device. For cloud models, OpenRouter may have their own privacy policy.

**Q: What if a model gives a wrong answer?**
A: Use the **Regenerate** button to get a new response, or try a different model for a second opinion.

**Q: Can I edit my messages after sending?**
A: Currently, no. But you can send a follow-up message clarifying your intent.

**Q: How often does the app update?**
A: Check your device's app store for available updates and new features.

---

## Tips & Tricks

### Becoming a Power User

#### **Persona Stacking**
Create multiple personas for different tasks:
- "Complex Analysis" — Deep research and reasoning
- "Quick Answers" — Direct, concise responses
- "Creative Mode" — Writing and brainstorming
- "Code Buddy" — Programming assistance

Tap between them as you switch tasks!

#### **Temperature Fine-Tuning**
- **0.2–0.3** — Factual questions, coding, math
- **0.5–0.6** — Balanced creative/accurate writing
- **0.8–1.0** — Creative writing, brainstorming, storytelling
- **Lock your favorite** — After setting temperature in Settings, tap the lock icon so it persists across chats

#### **Smart Use of Models**
- **Quick questions** → Use faster local model
- **Complex reasoning** → Use powerful cloud model (Claude, GPT)
- **Creative tasks** → Try creative-focused models
- **Programming** → Use code-specialized models

#### **Efficient Prompting**
Better prompts = better answers. Examples:

❌ *Weak:* "Tell me about Python"
✅ *Better:* "Explain Python decorators with a practical example I can use in a web app"

❌ *Weak:* "Write code for me"
✅ *Better:* "Write a Python function that parses a CSV file and filters rows where age > 18, then saves to a new file"

#### **Multi-Step Conversations**
Break complex tasks into steps:
1. "What are the pros and cons of X?"
2. "Now compare X and Y based on cost"
3. "Recommend the best choice for my situation"

This guides the AI and captures nuance better than one long question.

#### **File Export Workflow**
1. Get perfect responses
2. Export to .markdown files
3. Import into notes/wiki/documentation
4. Build your local knowledge base

#### **Regular Backups**
1. Periodically export your chats
2. Save to cloud storage (Google Drive, Dropbox)
3. Two-line protection against data loss

### Productivity Hacks

**Batch Similar Tasks:**
- Ask similar questions in one chat
- Helps model maintain context
- Faster responses to related follow-ups

**Use System Prompts Creatively:**
- "Explain results in bullet points"
- "Assume I'm a beginner"
- "Use simple language"
- "Provide code examples"

**Temperature Locking:**
Set your preferred temperature and lock it so it persists across chats. No more adjusting every time!

**Custom Persona Library:**
Build personas for your specific needs:
- "Email Drafting Helper"
- "Technical Documentation Writer"
- "Resume Reviewer"
- "Debugging Assistant"

### Best Practices

✅ **DO:**
- Start specific and refine with follow-ups
- Use personas to shape responses
- Export important conversations
- Give feedback via regenerate button (trains your usage patterns)
- Backup your chats occasionally

❌ **DON'T:**
- Expect AI to be 100% accurate (always verify facts)
- Share sensitive personal information
- Ask AI to do anything illegal or unethical
- Assume one answer is definitive (compare multiple models)
- Overestimate token limits (very long messages may be cut off)

---

## Keyboard Shortcuts & Quick Tips

| Action | How |
|--------|-----|
| **New Chat** | "+" button in header or sidebar "New Chat" |
| **Send Message** | Press Enter (if enabled) or tap Send button |
| **Switch Models** | Open sidebar (≡) → "Models" → select model |
| **Open Settings** | Open sidebar (≡) → "Settings" |
| **Regenerate** | Tap regenerate on response |
| **Toggle Sidebar** | Tap hamburger menu (≡) in header |
| **View Current Model** | Check model display bar below header |
| **Biometric Unlock** | Available after setup in Settings |

---

## Getting Help

### In-App Resources

1. **Help Menu** — Tap "Help" in sidebar for articles and FAQs
2. **What's New** — See latest features and updates
3. **Welcome Screen** — Review basics anytime
4. **Contact Support** — Find support info in Help menu

### External Resources

- **Official Website** — Check for tutorials and blog posts
- **Community** — Look for forums or discussion groups
- **App Store Page** — Read other users' tips in reviews

---

## Conclusion

You now have everything you need to use LMSA like a pro! 

**Quick recap:**
- ✅ Chat with any AI model
- ✅ Customize everything to your liking
- ✅ Save and export important conversations
- ✅ Use personas to shape AI behavior
- ✅ Upgrade to Premium when ready

**Next steps:**
1. Create your first chat
2. Explore different models
3. Experiment with personas
4. Customize your settings
5. Share LMSA with friends!

---

## Feedback & Questions?

We'd love to hear how you're using LMSA! If you have suggestions for the app or questions not covered in this guide, reach out through the app's Help menu or official channels.

**Happy chatting!** 🚀

---

**Version:** 1.0 | **Last Updated:** April 2026

*This guide covers LMSA features as of April 2026 and may be updated as new features are added.*

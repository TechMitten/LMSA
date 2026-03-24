/**
 * Text-to-Speech Service
 * Provides TTS functionality with Android native bridge and Web Speech API fallback
 */

class TTSService {
    constructor() {
        this.isAndroid = typeof AndroidTTS !== 'undefined';
        this.initialized = false;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.currentUtterance = null;
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        this.currentAndroidPlayback = null;
        this.androidPlaybackCounter = 0;

        // Don't auto-initialize, let it be called explicitly
        console.log('TTSService created, Android available:', this.isAndroid);
    }

    /**
     * Initialize TTS service
     */
    async initialize() {
        if (this.isInitializing) {
            if (this.initializationPromise) {
                return this.initializationPromise;
            }
            // Recover from stale native/UI flag states where isInitializing was set
            // externally but no JS initialization promise is in flight.
            console.warn('TTSService detected stale isInitializing flag; resetting and reinitializing');
            this.isInitializing = false;
        }

        // Allow re-initialization if previously initialized but engine is no longer available
        if (this.initialized && this.isAvailable()) return true;
        if (this.initialized && !this.isAvailable()) {
            this.initialized = false;
        }

        this.isInitializing = true;
        this.initializationPromise = (async () => {
            if (this.isAndroid) {
                await this.initializeAndroidTTS();
            } else {
                await this.initializeWebTTS();
            }
            return this.initialized;
        })();

        try {
            return await this.initializationPromise;
        } finally {
            this.isInitializing = false;
            this.initializationPromise = null;
        }
    }

    /**
     * Initialize Android native TTS
     */
    async initializeAndroidTTS() {
        return new Promise((resolve) => {
            let settled = false;
            if (typeof AndroidTTS === 'undefined') {
                console.warn('AndroidTTS interface not available');
                this.initialized = false;
                resolve(false);
                return;
            }

            const finalizeInitialization = (success) => {
                if (settled) {
                    this.initialized = success;
                    return;
                }
                settled = true;
                console.log('TTS initialization callback received:', success);
                this.initialized = success;
                if (success) {
                    console.log('Android TTS initialized successfully');
                } else {
                    console.error('Android TTS initialization failed');
                }
                resolve(success);
            };

            window.onTTSInitialized = (success) => {
                finalizeInitialization(success);
            };
            window.onNativeTtsReady = () => {
                finalizeInitialization(true);
            };
            window.onNativeTtsInitFailed = () => {
                finalizeInitialization(false);
            };

            try {
                if (typeof AndroidTTS.isReady === 'function' && AndroidTTS.isReady()) {
                    console.log('Android TTS already ready; resolving initialization immediately');
                    finalizeInitialization(true);
                    return;
                }
            } catch (error) {
                console.warn('Error checking Android TTS readiness before initialization:', error);
            }

            try {
                console.log('Calling AndroidTTS.initializeTTS()');
                AndroidTTS.initializeTTS();

                setTimeout(() => {
                    if (settled) {
                        return;
                    }

                    try {
                        if (typeof AndroidTTS.isReady === 'function' && AndroidTTS.isReady()) {
                            console.log('Android TTS became ready without a callback; resolving from native readiness state');
                            finalizeInitialization(true);
                        }
                    } catch (error) {
                        console.warn('Error checking Android TTS readiness after initializeTTS():', error);
                    }
                }, 250);

                setTimeout(() => {
                    if (!settled && !this.initialized) {
                        settled = true;
                        console.warn('TTS initialization timeout after 15000ms, assuming failure');
                        resolve(false);
                    }
                }, 15000);
            } catch (error) {
                settled = true;
                console.error('Error initializing Android TTS:', error);
                this.initialized = false;
                resolve(false);
            }
        });
    }

    /**
     * Initialize Web Speech API TTS
     */
    async initializeWebTTS() {
        if (!this.speechSynthesis) {
            console.warn('Web Speech API not supported');
            return false;
        }

        return new Promise((resolve) => {
            const loadVoices = () => {
                this.voices = this.speechSynthesis.getVoices();
                if (this.voices.length > 0) {
                    this.initialized = true;
                    console.log('Web Speech API initialized with', this.voices.length, 'voices');
                    resolve(true);
                } else {
                    setTimeout(loadVoices, 100);
                }
            };

            this.speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();
        });
    }

    /**
     * Speak the given text
     * @param {string} text - Text to speak
     * @param {Object} options - Speech options
     */
    async speak(text, options = {}) {
        if (!text || text.trim().length === 0) {
            console.warn('No text provided for TTS');
            return Promise.resolve(false);
        }

        if (!this.isInitialized()) {
            await this.initialize();
        }

        if (!this.isInitialized()) {
            console.error('TTS not available');
            return Promise.resolve(false);
        }

        this.stop('pre-speak-reset', true);

        if (this.isAndroid) {
            return this.speakAndroid(text, options);
        }
        return this.speakWeb(text, options);
    }

    /**
     * Speak using Android native TTS
     * @param {string} text - Text to speak
     * @param {Object} options - Speech options
     */
    speakAndroid(text, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.waitForAndroidTTSReady();

                if (options.language) {
                    AndroidTTS.setLanguage(options.language);
                }

                if (options.rate) {
                    AndroidTTS.setSpeechRate(options.rate);
                }

                if (options.pitch) {
                    AndroidTTS.setPitch(options.pitch);
                }

                const requestId = this.createAndroidPlaybackRequestId();
                this.currentAndroidPlayback = {
                    requestId,
                    resolve,
                    reject,
                    timeoutId: null,
                    started: false,
                };

                this.scheduleAndroidPlaybackTimeout(requestId, text);

                if (typeof AndroidTTS.speakWithRequestId === 'function') {
                    AndroidTTS.speakWithRequestId(requestId, text);
                } else {
                    AndroidTTS.speak(text);
                    this.startAndroidPollingFallback(requestId);
                }
            } catch (error) {
                const handled = this.rejectAndroidPlayback(error, { resetInitialized: true });
                console.error('Error speaking with Android TTS:', error);
                if (!handled) {
                    reject(error);
                }
            }
        });
    }

    createAndroidPlaybackRequestId() {
        this.androidPlaybackCounter += 1;
        return `tts_${Date.now()}_${this.androidPlaybackCounter}`;
    }

    scheduleAndroidPlaybackTimeout(requestId, text) {
        const playback = this.currentAndroidPlayback;
        if (!playback || playback.requestId !== requestId) {
            return;
        }

        const timeoutMs = Math.min(Math.max(text.length * 240, 6000), 300000) + 3000;
        playback.timeoutId = setTimeout(() => {
            if (!this.currentAndroidPlayback || this.currentAndroidPlayback.requestId !== requestId) {
                return;
            }

            console.warn('Android TTS playback timeout reached');
            this.initialized = false;
            try {
                AndroidTTS.stop();
            } catch (stopError) {
                console.error('Error stopping Android TTS after timeout:', stopError);
            }
            this.rejectAndroidPlayback(new Error('Android TTS playback timeout'), {
                resetInitialized: true,
            });
        }, timeoutMs);
    }

    clearAndroidPlaybackState() {
        if (this.currentAndroidPlayback?.timeoutId) {
            clearTimeout(this.currentAndroidPlayback.timeoutId);
        }
        this.currentAndroidPlayback = null;
    }

    resolveAndroidPlayback(result = true) {
        const playback = this.currentAndroidPlayback;
        if (!playback) {
            return false;
        }

        this.clearAndroidPlaybackState();
        playback.resolve(result);
        return true;
    }

    rejectAndroidPlayback(error, { resetInitialized = false } = {}) {
        const playback = this.currentAndroidPlayback;
        if (!playback) {
            if (resetInitialized) {
                this.initialized = false;
            }
            return false;
        }

        if (resetInitialized) {
            this.initialized = false;
        }

        this.clearAndroidPlaybackState();
        playback.reject(error instanceof Error ? error : new Error(String(error)));
        return true;
    }

    startAndroidPollingFallback(requestId) {
        const pollStartTime = Date.now();
        const maxPollMs = 300000;

        const checkCompletion = () => {
            const playback = this.currentAndroidPlayback;
            if (!playback || playback.requestId !== requestId) {
                return;
            }

            try {
                if (!AndroidTTS.isSpeaking()) {
                    this.resolveAndroidPlayback(true);
                } else if (Date.now() - pollStartTime > maxPollMs) {
                    console.warn('Android TTS polling fallback timeout reached');
                    this.rejectAndroidPlayback(new Error('Android TTS polling fallback timeout'), {
                        resetInitialized: true,
                    });
                } else {
                    setTimeout(checkCompletion, 100);
                }
            } catch (error) {
                this.rejectAndroidPlayback(error, { resetInitialized: true });
            }
        };

        setTimeout(checkCompletion, 200);
    }

    _handleNativePlaybackStarted(requestId) {
        const playback = this.currentAndroidPlayback;
        if (!playback || playback.requestId !== requestId) {
            return;
        }

        playback.started = true;
        console.log('Android TTS started:', requestId);
    }

    _handleNativePlaybackCompleted(requestId) {
        const playback = this.currentAndroidPlayback;
        if (!playback || playback.requestId !== requestId) {
            return;
        }

        console.log('Android TTS completed:', requestId);
        this.resolveAndroidPlayback(true);
    }

    _handleNativePlaybackError(requestId, message = 'Android TTS playback failed') {
        const playback = this.currentAndroidPlayback;
        if (playback && requestId && playback.requestId !== requestId) {
            return;
        }

        console.error('Android TTS playback error:', requestId, message);
        this.rejectAndroidPlayback(new Error(message), { resetInitialized: true });
    }

    _notifyPlaybackFailed(message = 'Android TTS playback failed') {
        const requestId = this.currentAndroidPlayback?.requestId ?? null;
        this._handleNativePlaybackError(requestId, message);
    }

    /**
     * Speak using Web Speech API
     * @param {string} text - Text to speak
     * @param {Object} options - Speech options
     */
    speakWeb(text, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.currentUtterance = new SpeechSynthesisUtterance(text);

                this.currentUtterance.lang = options.language || 'en-US';
                this.currentUtterance.rate = options.rate || 1.0;
                this.currentUtterance.pitch = options.pitch || 1.0;
                this.currentUtterance.volume = options.volume || 1.0;

                let voice = this.selectedVoice;
                if (!voice) {
                    voice = this.voices.find(v =>
                        v.lang.startsWith(this.currentUtterance.lang.split('-')[0])
                    );
                }
                if (voice) {
                    this.currentUtterance.voice = voice;
                }

                this.currentUtterance.onstart = () => {
                    console.log('TTS started');
                    if (options.onStart) options.onStart();
                };

                this.currentUtterance.onend = () => {
                    console.log('TTS ended');
                    this.currentUtterance = null;
                    if (options.onEnd) options.onEnd();
                    resolve(true);
                };

                this.currentUtterance.onerror = (event) => {
                    console.error('TTS error:', event.error);
                    this.currentUtterance = null;
                    if (options.onError) options.onError(event.error);
                    reject(event.error);
                };

                this.speechSynthesis.speak(this.currentUtterance);
            } catch (error) {
                console.error('Error speaking with Web Speech API:', error);
                reject(error);
            }
        });
    }

    /**
     * Stop current speech
     */
    hasActivePlayback() {
        if (this.isAndroid) {
            if (this.currentAndroidPlayback) {
                return true;
            }

            try {
                return typeof AndroidTTS !== 'undefined' &&
                    typeof AndroidTTS.isSpeaking === 'function' &&
                    AndroidTTS.isSpeaking();
            } catch (error) {
                console.error('Error checking active Android TTS playback:', error);
                return false;
            }
        }

        return !!this.currentUtterance || !!(this.speechSynthesis && this.speechSynthesis.speaking);
    }

    hasTrackedPlayback() {
        if (this.isAndroid) {
            return !!this.currentAndroidPlayback;
        }

        return !!this.currentUtterance || !!(this.speechSynthesis && this.speechSynthesis.speaking);
    }

    stop(reason = 'manual-stop', onlyIfActive = false) {
        if (onlyIfActive && !this.hasActivePlayback()) {
            return false;
        }

        if (this.isAndroid) {
            try {
                if (typeof AndroidTTS.stopWithReason === 'function') {
                    AndroidTTS.stopWithReason(reason);
                } else {
                    AndroidTTS.stop();
                }
            } catch (error) {
                console.error('Error stopping Android TTS:', error);
            }
            this.resolveAndroidPlayback(false);
        } else if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.currentUtterance = null;
        }

        return true;
    }

    /**
     * Check if TTS is currently speaking
     * @returns {boolean}
     */
    isSpeaking() {
        if (this.isAndroid) {
            try {
                return AndroidTTS.isSpeaking();
            } catch (error) {
                console.error('Error checking Android TTS speaking status:', error);
                return false;
            }
        } else if (this.speechSynthesis) {
            return this.speechSynthesis.speaking;
        }
        return false;
    }

    /**
     * Check if TTS service is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Check if TTS is available
     * @returns {boolean}
     */
    isAvailable() {
        if (this.isAndroid) {
            try {
                return typeof AndroidTTS !== 'undefined' && AndroidTTS.isAvailable();
            } catch (error) {
                console.error('Error checking Android TTS availability:', error);
                return false;
            }
        }
        return this.speechSynthesis && this.speechSynthesis.getVoices().length > 0;
    }

    /**
     * Get available voices (Web Speech API only)
     * @returns {Array}
     */
    getVoices() {
        if (!this.isAndroid && this.speechSynthesis) {
            return this.voices;
        }
        return [];
    }

    /**
     * Get available voices from Android TTS or Web Speech API
     * @returns {Promise<Array>} Array of voice objects with name, locale, quality info
     */
    async getAvailableVoices() {
        if (this.isAndroid) {
            try {
                if (!this.initialized) {
                    await this.initialize();
                }

                await this.waitForAndroidTTSReady();

                if (typeof AndroidTTS !== 'undefined' && AndroidTTS.getAvailableVoices) {
                    const voicesJSON = AndroidTTS.getAvailableVoices();
                    const voices = JSON.parse(voicesJSON);
                    console.log('Retrieved voices from Android TTS:', voices.length);
                    return voices;
                }
                return [];
            } catch (error) {
                console.error('Error getting Android TTS voices:', error);
                return [];
            }
        }

        if (!this.initialized) {
            await this.initialize();
        }

        return this.voices.map((voice) => ({
            name: voice.name,
            locale: voice.lang,
            quality: voice.localService ? 'High' : 'Network',
            isNetworkConnectionRequired: !voice.localService,
        }));
    }

    /**
     * Wait for Android TTS to be fully ready
     * @returns {Promise} Promise that resolves when TTS is ready
     */
    async waitForAndroidTTSReady() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;

            const checkReady = () => {
                attempts += 1;

                try {
                    if (typeof AndroidTTS !== 'undefined' && AndroidTTS.isReady && AndroidTTS.isReady()) {
                        console.log('Android TTS is ready after', attempts * 100, 'ms');
                        resolve();
                        return;
                    }
                } catch (error) {
                    console.error('Error checking TTS readiness:', error);
                }

                if (attempts >= maxAttempts) {
                    console.warn('Timeout waiting for Android TTS to be ready');
                    reject(new Error('TTS initialization timeout'));
                    return;
                }

                setTimeout(checkReady, 100);
            };

            checkReady();
        });
    }

    /**
     * Set the TTS voice
     * @param {string} voiceName - Name of the voice to set
     * @returns {boolean} Success status
     */
    async setVoice(voiceName) {
        if (this.isAndroid) {
            try {
                if (!this.isInitialized()) {
                    await this.initialize();
                }

                if (!voiceName) {
                    if (typeof AndroidTTS !== 'undefined' && typeof AndroidTTS.resetVoice === 'function') {
                        this.selectedVoice = null;
                        return AndroidTTS.resetVoice();
                    }
                    return false;
                }

                if (typeof AndroidTTS !== 'undefined' && AndroidTTS.setVoice) {
                    return AndroidTTS.setVoice(voiceName);
                }
                return false;
            } catch (error) {
                console.error('Error setting Android TTS voice:', error);
                return false;
            }
        }

        if (!this.isInitialized()) {
            await this.initialize();
        }

        if (!voiceName) {
            this.selectedVoice = null;
            return true;
        }

        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.selectedVoice = voice;
            console.log('Voice set to:', voiceName);
            return true;
        }

        console.warn('Voice not found:', voiceName);
        return false;
    }

    /**
     * Clean text for TTS (remove markdown, HTML, etc.)
     * @param {string} text - Raw text
     * @returns {string} - Cleaned text
     */
    cleanTextForTTS(text) {
        if (!text) return '';

        return text
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove markdown bold
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remove markdown italic
            .replace(/\*([^*]+)\*/g, '$1')
            // Replace code blocks with placeholder
            .replace(/```[\s\S]*?```/g, ' Code block. ')
            // Remove inline code backticks
            .replace(/`([^`]+)`/g, '$1')
            // Remove headers
            .replace(/#{1,6}\s*/g, '')
            // Convert links to text only
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove emojis (they cause TTS to stop or produce artifacts)
            // This regex matches most common emoji ranges
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ')
            // Remove other problematic unicode characters and symbols
            .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
            // Fix common abbreviations and acronyms
            .replace(/\bAPI\b/g, 'A P I')
            .replace(/\bURL\b/g, 'U R L')
            .replace(/\bHTML\b/g, 'H T M L')
            .replace(/\bCSS\b/g, 'C S S')
            .replace(/\bJS\b/g, 'JavaScript')
            .replace(/\bJSON\b/g, 'J S O N')
            .replace(/\bXML\b/g, 'X M L')
            .replace(/\bSQL\b/g, 'S Q L')
            // Handle numbers and special cases
            .replace(/(\d+)\.(\d+)/g, '$1 point $2')
            .replace(/\b(\d+)%/g, '$1 percent')
            .replace(/\$(\d+)/g, '$1 dollars')
            // Fix punctuation spacing to reduce audio glitches
            .replace(/([.!?])\s*([.!?])/g, '$1 ')
            .replace(/([,;:])\s*([,;:])/g, '$1 ')
            // Add pauses for better speech flow
            .replace(/\.\s+/g, '. ')
            .replace(/!\s+/g, '! ')
            .replace(/\?\s+/g, '? ')
            .replace(/:\s+/g, ': ')
            .replace(/;\s+/g, '; ')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// Create global instance
window.TTSService = new TTSService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSService;
}

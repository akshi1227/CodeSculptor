// Voice Narrator using Web Speech API
class VoiceNarrator {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.rate = 0.9;
        this.pitch = 1.0;
        this.volume = 1.0;
        
        this.loadVoices();
    }

    loadVoices() {
        // Load available voices
        const voices = this.synthesis.getVoices();
        
        if (voices.length > 0) {
            // Prefer English voices
            this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        }

        // Some browsers load voices asynchronously
        this.synthesis.onvoiceschanged = () => {
            const voices = this.synthesis.getVoices();
            this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        };
    }

    speak(text) {
        return new Promise((resolve) => {
            // Stop any ongoing speech
            this.stop();

            // Clean the text for better speech
            const cleanText = this.cleanTextForSpeech(text);

            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            if (this.voice) {
                utterance.voice = this.voice;
            }
            
            utterance.rate = this.rate;
            utterance.pitch = this.pitch;
            utterance.volume = this.volume;

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (error) => {
                console.error('Speech error:', error);
                resolve(); // Continue even if speech fails
            };

            this.synthesis.speak(utterance);
        });
    }

    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }

    cleanTextForSpeech(text) {
        // Remove special characters and format for better speech
        let cleaned = text.trim();
        
        // Replace common programming symbols
        cleaned = cleaned.replace(/<-/g, 'gets');
        cleaned = cleaned.replace(/=/g, 'equals');
        cleaned = cleaned.replace(/->/g, 'returns');
        cleaned = cleaned.replace(/\+/g, 'plus');
        cleaned = cleaned.replace(/-/g, 'minus');
        cleaned = cleaned.replace(/\*/g, 'times');
        cleaned = cleaned.replace(/\//g, 'divided by');
        cleaned = cleaned.replace(/</g, 'less than');
        cleaned = cleaned.replace(/>/g, 'greater than');
        cleaned = cleaned.replace(/!=/g, 'not equal to');
        cleaned = cleaned.replace(/==/g, 'equals equals');
        
        // Remove line numbers if present
        cleaned = cleaned.replace(/^\d+[\.:]\s*/, '');
        
        // Remove comment markers
        cleaned = cleaned.replace(/\/\//g, '');
        cleaned = cleaned.replace(/#/g, '');
        
        return cleaned;
    }

    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(2.0, rate));
    }

    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2.0, pitch));
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1.0, volume));
    }

    isSupported() {
        return 'speechSynthesis' in window;
    }
}
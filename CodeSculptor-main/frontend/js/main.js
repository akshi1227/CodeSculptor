// Main Application Controller
class CodeSculptor {
    constructor() {
        this.nlpHandler = new NLPHandler();
        this.animationEngine = new AnimationEngine();
        this.voiceNarrator = new VoiceNarrator();
        this.storageManager = new StorageManager();

        this.initializeElements();
        this.attachEventListeners();
        this.loadPreviousSession();
    }

    initializeElements() {
        this.input = document.getElementById('naturalLanguageInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.display = document.getElementById('pseudocodeDisplay');
        this.loading = document.getElementById('loadingSpinner');
        this.errorMsg = document.getElementById('errorMessage');
        this.controls = document.getElementById('animationControls');

        // New Controls
        this.accuracyToggle = document.getElementById('accuracyToggle');
        this.explanationDisplay = document.getElementById('explanationDisplay');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.pseudocodeTab = document.getElementById('pseudocodeTab');
        this.explanationTab = document.getElementById('explanationTab');
    }

    attachEventListeners() {
        this.convertBtn.addEventListener('click', () => this.handleConvert());
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.playBtn.addEventListener('click', () => this.handlePlay());
        this.pauseBtn.addEventListener('click', () => this.handlePause());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.voiceToggle.addEventListener('change', () => this.handleVoiceToggle());

        // Enable Enter key with Ctrl/Cmd
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.handleConvert();
            }
        });

        // Tab Switching Logic
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    async handleConvert() {
        const text = this.input.value.trim();

        if (!text) {
            this.showError('Please enter a natural language description!');
            return;
        }

        this.showLoading(true);
        this.hideError();
        this.controls.style.display = 'none';

        // Hide side-by-side container during loading
        const sideBySideContainer = document.getElementById('sideBySideContainer');
        if (sideBySideContainer) {
            sideBySideContainer.style.display = 'none';
        }

        try {
            const domain = this.domainSelect ? this.domainSelect.value : 'general';
            const highAccuracy = this.accuracyToggle ? this.accuracyToggle.checked : false;

            if (highAccuracy) {
                this.loading.querySelector('p').textContent = "Generating with Gemini AI (High Accuracy)...";
            } else {
                this.loading.querySelector('p').textContent = "Generating visualization...";
            }

            const result = await this.nlpHandler.convertToPseudocode(text, highAccuracy);

            if (result.success) {
                // Show side-by-side container
                if (sideBySideContainer) {
                    sideBySideContainer.style.display = 'grid';
                }

                this.displayPseudocode(result.steps);
                this.displayExplanation(result.explanation);
                this.animationEngine.loadSteps(result.steps, result.visualization);
                this.controls.style.display = 'flex';

                // Switch to pseudocode tab by default
                this.switchTab('pseudocode');

                // Save to storage
                this.storageManager.saveSession({
                    input: text,
                    pseudocode: result.pseudocode,
                    steps: result.steps,
                    visualization: result.visualization,
                    timestamp: new Date().toISOString()
                });

                // Auto-play animation
                setTimeout(() => this.handlePlay(), 500);
            } else {
                this.showError(result.error || 'Failed to generate pseudocode');
            }
        } catch (error) {
            this.showError('Connection error. Make sure the backend server is running!');
            console.error('Conversion error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displayPseudocode(steps) {
        this.display.innerHTML = '';

        steps.forEach((step, index) => {
            const line = document.createElement('div');
            line.className = `pseudocode-line line-type-${step.type}`;
            line.setAttribute('data-line', index);
            line.textContent = step.content;
            this.display.appendChild(line);
        });
    }

    handlePlay() {
        const useVoice = this.voiceToggle.checked;
        this.animationEngine.play(useVoice ? this.voiceNarrator : null);
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = false;
    }

    handlePause() {
        this.animationEngine.pause();
        this.voiceNarrator.stop();
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    handleReset() {
        this.animationEngine.reset();
        this.voiceNarrator.stop();
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    handleVoiceToggle() {
        const enabled = this.voiceToggle.checked;
        this.storageManager.saveSetting('voiceEnabled', enabled);
    }

    handleClear() {
        this.input.value = '';
        this.display.innerHTML = '<p class="placeholder">Your pseudocode will appear here...</p>';
        this.explanationDisplay.innerHTML = '<p class="placeholder">Algorithm explanation will appear here...</p>';

        const sideBySideContainer = document.getElementById('sideBySideContainer');
        if (sideBySideContainer) {
            sideBySideContainer.style.display = 'none';
        }

        const viz = document.getElementById('visualizerDisplay');
        if (viz) {
            viz.innerHTML = '';
        }

        this.controls.style.display = 'none';
        this.hideError();
        this.animationEngine.reset();
        this.voiceNarrator.stop();
        this.switchTab('pseudocode');
    }

    displayExplanation(explanation) {
        if (!explanation) {
            this.explanationDisplay.innerHTML = '<p>No explanation provided.</p>';
            return;
        }

        // Convert simple line breaks to <br> or wrap in <p>
        // Also handle bolding if provided in markdown style
        const formatted = explanation
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        this.explanationDisplay.innerHTML = `<div class="explanation-text"><p>${formatted}</p></div>`;
    }

    switchTab(tabName) {
        this.tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (tabName === 'pseudocode') {
            this.pseudocodeTab.style.display = 'block';
            this.explanationTab.style.display = 'none';
        } else {
            this.pseudocodeTab.style.display = 'none';
            this.explanationTab.style.display = 'block';
        }
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        const sideBySideContainer = document.getElementById('sideBySideContainer');
        if (sideBySideContainer) {
            sideBySideContainer.style.display = show ? 'none' : sideBySideContainer.style.display;
        }
        this.convertBtn.disabled = show;
    }

    showError(message) {
        this.errorMsg.textContent = message;
        this.errorMsg.style.display = 'block';
    }

    hideError() {
        this.errorMsg.style.display = 'none';
    }

    loadPreviousSession() {
        // Check for example from examples page
        const exampleText = localStorage.getItem('example_text');
        if (exampleText) {
            this.input.value = exampleText;
            localStorage.removeItem('example_text');
            // Auto-convert after a short delay
            setTimeout(() => this.handleConvert(), 500);
            return;
        }

        const lastSession = this.storageManager.getLastSession();
        if (lastSession && lastSession.input) {
            this.input.value = lastSession.input;
        }

        const voiceEnabled = this.storageManager.getSetting('voiceEnabled');
        if (voiceEnabled !== null) {
            this.voiceToggle.checked = voiceEnabled;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CodeSculptor();
    console.log(' CodeSculptor initialized successfully!');
});
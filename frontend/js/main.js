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
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.exportBtn = document.getElementById('exportBtn');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.display = document.getElementById('pseudocodeDisplay');
        this.loading = document.getElementById('loadingSpinner');
        this.errorMsg = document.getElementById('errorMessage');
        this.controls = document.getElementById('animationControls');

        // New Controls
        this.accuracyToggle = document.getElementById('accuracyToggle');
        this.interactiveModeToggle = document.getElementById('interactiveModeToggle');
        this.explanationDisplay = document.getElementById('explanationDisplay');
        this.explanationWhyDisplay = document.getElementById('explanationWhyDisplay');
        this.analysisTab = document.getElementById('analysisTab');
        this.complexityText = document.getElementById('complexityText');
        this.comparisonTableDisplay = document.getElementById('comparisonTableDisplay');
        this.aiIntelligenceWidget = document.getElementById('aiIntelligenceWidget');
        this.aiHintText = document.getElementById('aiHintText');
        this.realWorldText = document.getElementById('realWorldText');
        
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.pseudocodeTab = document.getElementById('pseudocodeTab');
        this.explanationTab = document.getElementById('explanationTab');
        this.testCaseSection = document.getElementById('testCaseSection');
        this.testCaseList = document.getElementById('testCaseList');
        this.addTestCaseBtn = document.getElementById('addTestCaseBtn');
    }

    attachEventListeners() {
        this.convertBtn.addEventListener('click', () => this.handleConvert());
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.playBtn.addEventListener('click', () => this.handlePlay());
        this.pauseBtn.addEventListener('click', () => this.handlePause());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.prevBtn.addEventListener('click', () => this.handlePrev());
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.speedSlider.addEventListener('input', () => this.handleSpeedChange());
        this.exportBtn.addEventListener('click', () => this.handleExport());
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

                this.displayPseudocode(result.steps, result.complexity);
                this.displayExplanation(result.explanation);
                
                // Display new fields
                if (this.explanationWhyDisplay) this.explanationWhyDisplay.innerHTML = result.explanation_why || "Data unavailable";
                if (this.complexityText) this.complexityText.innerText = result.complexity || "Data unavailable";
                
                // Render Markdown Table to HTML safely
                let compHtml = result.comparison || "<p>Data unavailable</p>";
                if (compHtml.includes("|")) {
                    // Quick and dirty markdown table to HTML converter
                    let rows = compHtml.split("\\n").filter(r => r.includes("|"));
                    if (rows.length > 1) {
                        let table = '<table style="width:100%; border-collapse: collapse; margin-top:10px;">';
                        rows.forEach((row, i) => {
                            if (row.includes("---")) return;
                            let cls = i === 0 ? "background:#f1f5f9; font-weight:bold;" : "";
                            let tag = i === 0 ? "th" : "td";
                            table += `<tr style="${cls} border-bottom: 1px solid #ccc;">`;
                            let cols = row.split("|").filter(c => c.trim() !== "");
                            cols.forEach(c => table += `<${tag} style="padding:8px; border:1px solid #ddd;">${c.trim()}</${tag}>`);
                            table += '</tr>';
                        });
                        table += '</table>';
                        compHtml = table;
                    }
                }
                if (this.comparisonTableDisplay) this.comparisonTableDisplay.innerHTML = compHtml;

                // AI Intelligence Widget Update
                if (this.aiIntelligenceWidget && result.ai_hints && result.real_world_map) {
                    this.aiHintText.innerText = result.ai_hints;
                    this.realWorldText.innerText = result.real_world_map;
                    this.aiIntelligenceWidget.style.display = 'block';
                }

                // Plot Complexity Chart if Chart.js is loaded
                if (window.Chart && this.complexityText) {
                    this.renderComplexityChart(result.algorithm || "Algorithm", result.complexity || "O(n)");
                }

                this.displayTestCases(result.algorithm?.toLowerCase().replace(/ /g, '_'), result);
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

    displayPseudocode(steps, complexity) {
        this.display.innerHTML = '';

        if (complexity) {
            const badge = document.createElement('div');
            badge.className = 'complexity-badge';
            badge.style.display = 'inline-block';
            badge.style.marginBottom = '10px';
            badge.textContent = `Complexity: ${complexity}`;
            this.display.appendChild(badge);
        }

        steps.forEach((step, index) => {
            const line = document.createElement('div');
            line.className = `pseudocode-line line-type-${step.type}`;
            line.setAttribute('data-line', index);
            line.textContent = step.content;
            this.display.appendChild(line);
        });
    }

    displayExplanation(explanation) {
        if (!explanation) {
            this.explanationDisplay.innerHTML = '<p>No explanation provided.</p>';
            return;
        }

        // Convert simple line breaks to <br> or wrap in <p>
        const formatted = explanation
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        this.explanationDisplay.innerHTML = `<div class="explanation-text"><p>${formatted}</p></div>`;
    }

    displayTestCases(algorithmType, result) {
        this.testCaseSection.style.display = 'block';
        this.testCaseList.innerHTML = '';

        // Pre-defined test cases based on algorithm type
        const testCases = this.getPredefinedTestCases(algorithmType);

        testCases.forEach((tc, idx) => {
            const item = document.createElement('div');
            item.className = 'test-case-item';

            // Check if result matches test case
            const passed = this.validateResult(tc, result);
            const statusClass = passed ? 'status-pass' : 'status-fail';
            const statusText = passed ? 'PASS' : 'FAIL';

            item.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="test-case-status ${statusClass}"></div>
                    <div class="test-case-info">
                        <strong>Test ${idx + 1}:</strong> Input: ${JSON.stringify(tc.input)}
                    </div>
                </div>
                <div class="test-case-result" style="color: ${passed ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${statusText}
                </div>
            `;
            this.testCaseList.appendChild(item);
        });
    }

    getPredefinedTestCases(algo) {
        const cases = {
            'two_sum': [
                { input: { data: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
                { input: { data: [3, 2, 4], target: 6 }, expected: [1, 2] }
            ],
            'bubble_sort': [
                { input: { data: [5, 1, 4, 2] }, expected: [1, 2, 4, 5] }
            ]
        };
        return cases[algo] || [{ input: 'Default Input', expected: 'N/A' }];
    }

    validateResult(tc, result) {
        // Simple validation logic
        if (!result) return false;
        if (result.result) {
            return JSON.stringify(result.result) === JSON.stringify(tc.expected);
        }
        return true; // Default pass for simple visualizations
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
            if(this.pseudocodeTab) this.pseudocodeTab.style.display = 'block';
            if(this.explanationTab) this.explanationTab.style.display = 'none';
            if(this.analysisTab) this.analysisTab.style.display = 'none';
        } else if (tabName === 'explanation') {
            if(this.pseudocodeTab) this.pseudocodeTab.style.display = 'none';
            if(this.explanationTab) this.explanationTab.style.display = 'block';
            if(this.analysisTab) this.analysisTab.style.display = 'none';
        } else if (tabName === 'analysis') {
            if(this.pseudocodeTab) this.pseudocodeTab.style.display = 'none';
            if(this.explanationTab) this.explanationTab.style.display = 'none';
            if(this.analysisTab) this.analysisTab.style.display = 'block';
        }
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
        this.updatePlaybackButtons();
    }

    handlePrev() {
        this.animationEngine.previousStep();
    }

    handleNext() {
        if (this.interactiveModeToggle && this.interactiveModeToggle.checked) {
            // Briefly pause and ask
            this.handlePause();
            const predict = prompt("Interactive Learning Mode: What do you think happens in the next step?");
            if (predict !== null) {
                // We don't judge the answer yet, just force them to think
                alert("Let's see if you're right!");
                this.animationEngine.nextStep();
            }
        } else {
            this.animationEngine.nextStep();
        }
    }

    renderComplexityChart(algoName, complexityStr) {
        const ctx = document.getElementById('complexityChart');
        if (!ctx) return;
        
        ctx.style.display = 'block';
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const labels = [10, 50, 100, 500, 1000];
        let data = [];
        let label = 'Complexity';

        const compStr = complexityStr.toLowerCase();
        if (compStr.includes('o(1)')) {
            data = labels.map(() => 1);
            label = 'O(1) - Constant';
        } else if (compStr.includes('o(log n)')) {
            data = labels.map(n => Math.log2(n));
            label = 'O(log n) - Logarithmic';
        } else if (compStr.includes('o(n log n)')) {
            data = labels.map(n => n * Math.log2(n));
            label = 'O(n log n) - Linearithmic';
        } else if (compStr.includes('o(n2)') || compStr.includes('o(n^2)') || compStr.includes('o(n²)')) {
            data = labels.map(n => n * n);
            label = 'O(n²) - Quadratic';
        } else {
            // Default O(n)
            data = labels.map(n => n);
            label = 'O(n) - Linear';
        }

        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: \`\${algoName} Time Complexity (\${label})\`,
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Input Size (n)' }
                    },
                    y: {
                        title: { display: true, text: 'Operations' },
                        ticks: { display: false } // Hide exact numbers for abstract complexity
                    }
                }
            }
        });
    }

    handleSpeedChange() {
        const speed = parseFloat(this.speedSlider.value);
        this.speedValue.textContent = `${speed}x`;
        this.animationEngine.setSpeed(speed);
    }

    handleExport() {
        // Simple canvas export for now (placeholder for future GIF/Video export)
        const viz = document.getElementById('visualizerDisplay');
        if (!viz) return;

        alert("Screenshot export initiated! (GIF/Video export coming in Phase 5)");
        // Logical export code would go here
    }

    updatePlaybackButtons() {
        const isPlaying = this.animationEngine.isPlaying;
        this.playBtn.disabled = isPlaying;
        this.pauseBtn.disabled = !isPlaying;

        if (!isPlaying) {
            this.playBtn.innerHTML = '<span>▶️</span> Play';
        } else {
            this.playBtn.innerHTML = '<span>⏸️</span> Playing';
        }
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
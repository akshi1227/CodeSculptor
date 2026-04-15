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
        this.ensureUIReady();
    }

    ensureUIReady() {
        console.log('CodeSculptor UI initialized successfully.');

        const missing = [];
        [
            'input', 'convertBtn', 'clearBtn', 'playBtn', 'pauseBtn', 'resetBtn',
            'prevBtn', 'nextBtn', 'speedSlider', 'speedValue', 'exportBtn',
            'voiceToggle', 'display', 'loading', 'errorMsg', 'controls',
            'explanationDisplay', 'codeDisplay', 'languageSelect'
        ].forEach(name => {
            if (!this[name]) missing.push(name);
        });

        if (missing.length) {
            console.error('Missing UI elements:', missing);
            if (this.errorMsg) {
                this.errorMsg.textContent = 'UI initialization error: missing elements. Please refresh the page.';
                this.errorMsg.style.display = 'block';
            }
            if (this.convertBtn) {
                this.convertBtn.disabled = true;
            }
        } else {
            this.nlpHandler.checkHealth().then(healthy => {
                if (!healthy && this.errorMsg) {
                    this.errorMsg.textContent = 'Backend not reachable. Start the Flask server and reload the page.';
                    this.errorMsg.style.display = 'block';
                }
            });
        }
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
        this.codeTab = document.getElementById('codeTab');
        this.codeDisplay = document.getElementById('codeDisplay');
        this.languageSelect = document.getElementById('languageSelect');
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
        const startTime = Date.now(); // Track start time for duration

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
            const selectedLanguage = this.languageSelect ? this.languageSelect.value : 'pseudocode';
            const selectedDomain = 'general';

            if (highAccuracy) {
                this.loading.querySelector('p').textContent = "Generating with Gemini AI (High Accuracy)...";
            } else {
                this.loading.querySelector('p').textContent = "Generating visualization...";
            }

            const healthOk = await this.nlpHandler.checkHealth();
            if (!healthOk) {
                throw new Error('Backend health check failed. Is the Flask server running on http://127.0.0.1:5000 ?');
            }

            const result = await this.nlpHandler.convertToPseudocode(text, highAccuracy, selectedLanguage, selectedDomain);
            
            console.log('Convert result:', result);

            if (result.success) {
                // Show side-by-side container
                if (sideBySideContainer) {
                    sideBySideContainer.style.display = 'grid';
                }

                this.displayPseudocode(result.steps, result.complexity);
                this.displayCode(result.code, result.language);
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

                this.displayTestCases((result.algorithm || '').toLowerCase().replace(/ /g, '_'), result);
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

                // Add to MongoDB activity history
                if (result.success) {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    // Save ALL data including AI-generated content
                    const historyData = {
                        input: text,
                        pseudocode: result.pseudocode,
                        generated_code: result.code,
                        language: result.language || selectedLanguage,
                        duration: duration,
                        timestamp: new Date().toISOString(),
                        // Additional AI data for full reload
                        complexity: result.complexity,
                        explanation: result.explanation,
                        explanation_why: result.explanation_why,
                        ai_hints: result.ai_hints,
                        real_world_map: result.real_world_map,
                        comparison: result.comparison,
                        algorithm: result.algorithm,
                        steps: result.steps,
                        visualization: result.visualization
                    };
                    
                    console.log('Saving to MongoDB history:', historyData);
                    
                    // Send to MongoDB via API
                    fetch('http://localhost:5000/api/save-history', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                        },
                        body: JSON.stringify(historyData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('MongoDB: History saved successfully');
                            // Reload history display
                            if (window.mongoDBHistory) {
                                window.mongoDBHistory.loadHistory();
                            }
                        } else {
                            console.error('MongoDB: Failed to save history:', data.error);
                        }
                    })
                    .catch(error => {
                        console.error('MongoDB: Error saving history:', error);
                    });
                }

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
    
    reloadFromHistory(result) {
        console.log('Reloading from history:', result);
        
        // Show side-by-side container
        const sideBySideContainer = document.getElementById('sideBySideContainer');
        if (sideBySideContainer) {
            sideBySideContainer.style.display = 'grid';
        }
        
        // Display all the components
        this.displayPseudocode(result.steps || [], result.complexity);
        this.displayCode(result.code, result.language);
        this.displayExplanation(result.explanation);
        
        // Update explanation why
        if (this.explanationWhyDisplay && result.explanation_why) {
            this.explanationWhyDisplay.innerHTML = `
                <div style="padding: 16px; background: rgba(99,102,241,0.1); border-radius: 8px; border-left: 3px solid #6366f1;">
                    <h4 style="margin: 0 0 10px 0; color: #e0e8f0;">Why This Approach?</h4>
                    <p style="margin: 0; color: rgba(224,232,240,0.9); line-height: 1.6;">${result.explanation_why}</p>
                </div>
            `;
        }
        
        // Update complexity display
        if (this.complexityText && result.complexity) {
            this.complexityText.innerHTML = `<span class="complexity-badge">${result.complexity}</span>`;
        }
        
        // Update comparison table
        if (this.comparisonTableDisplay && result.comparison) {
            let compHtml = `<div style="padding:12px; background:rgba(0,0,0,0.2); border-radius:6px;"><pre style="margin:0; white-space:pre-wrap; font-family:inherit; font-size:0.9rem;">${result.comparison}</pre></div>`;
            if (result.comparison.includes("|")) {
                let rows = result.comparison.split("\n").map(r => r.trim()).filter(r => r && !r.startsWith("+"));
                let table = '<table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-top:8px;">';
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
            this.comparisonTableDisplay.innerHTML = compHtml;
        }
        
        // Update AI Intelligence Widget
        if (this.aiIntelligenceWidget && result.ai_hints && result.real_world_map) {
            this.aiHintText.innerText = result.ai_hints;
            this.realWorldText.innerText = result.real_world_map;
            this.aiIntelligenceWidget.style.display = 'block';
        }
        
        // Load animation
        this.animationEngine.loadSteps(result.steps || [], result.visualization);
        this.controls.style.display = 'flex';
        
        // Switch to pseudocode tab
        this.switchTab('pseudocode');
        
        // Show controls
        this.controls.style.display = 'flex';
        
        console.log('Reloaded from history successfully');
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

    displayCode(code, language) {
        if (!this.codeDisplay) return;

        if (code && language && language !== 'pseudocode') {
            const langLabel = { python:'Python', javascript:'JavaScript', java:'Java', cpp:'C++' }[language] || language;
            const langIcon  = { python:'🐍', javascript:'🟨', java:'☕', cpp:'⚙️' }[language] || '💻';

            this.codeDisplay.innerHTML = `
                <div style="
                    display:flex; justify-content:space-between; align-items:center;
                    padding:10px 14px; background:rgba(0,0,0,0.3);
                    border-bottom:1px solid rgba(255,255,255,0.07);
                    border-radius:8px 8px 0 0;
                ">
                    <span style="font-size:0.8rem;font-weight:600;color:rgba(224,232,240,0.6);display:flex;align-items:center;gap:6px;">
                        ${langIcon} ${langLabel}
                    </span>
                    <button id="copyCodeBtn" onclick="
                        navigator.clipboard.writeText(this.closest('.panel-content').querySelector('code').textContent);
                        this.textContent='✓ Copied!'; setTimeout(()=>this.textContent='Copy',2000);
                    " style="
                        background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
                        border-radius:6px; padding:3px 10px; font-size:0.75rem; color:rgba(224,232,240,0.7);
                        cursor:pointer; transition:0.2s;
                    ">Copy</button>
                </div>
                <pre style="
                    margin:0; padding:16px; overflow-x:auto;
                    background:#0d1117; border-radius:0 0 8px 8px;
                    font-family:'Fira Code','SF Mono',monospace;
                    font-size:0.85rem; line-height:1.7;
                    color:#c9d1d9;
                "><code class="language-${language}">${this.escapeHtml(code)}</code></pre>
            `;
        } else {
            this.codeDisplay.innerHTML = '<p class="placeholder" style="padding:2rem;text-align:center;color:rgba(224,224,224,0.4);">Select a programming language above to generate code.</p>';
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Always hide ALL tabs first, then show the selected one
        const allTabs = [this.pseudocodeTab, this.codeTab, this.explanationTab, this.analysisTab];
        allTabs.forEach(tab => { if (tab) tab.style.display = 'none'; });

        if      (tabName === 'pseudocode')   { if (this.pseudocodeTab)   this.pseudocodeTab.style.display   = 'block'; }
        else if (tabName === 'code')         { if (this.codeTab)         this.codeTab.style.display         = 'block'; }
        else if (tabName === 'explanation')  { if (this.explanationTab)  this.explanationTab.style.display  = 'block'; }
        else if (tabName === 'analysis')     { if (this.analysisTab)     this.analysisTab.style.display     = 'block'; }
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
        } else if (compStr.includes('o(n2)') || compStr.includes('o(n^2)') || compStr.includes('o(n^2)')) {
            data = labels.map(n => n * n);
            label = 'O(n^2) - Quadratic';
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
                    label: algoName + ' Time Complexity (' + label + ')',
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

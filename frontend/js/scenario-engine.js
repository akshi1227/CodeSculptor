/**
 * ScenarioEngine — Scenario-Based Learning JS Controller
 * CodeSculptor AI
 */

const BACKEND_URL = 'http://127.0.0.1:5000';

const PRESET_SCENARIOS = [
    // ── LEETCODE PROBLEMS ──────────────────────────────────
    {
        key: 'two_sum',
        icon: '🗺️',
        title: 'Two Sum',
        desc: 'Return indices of two numbers that add up to target.',
        ds: 'HashMap',
        color: '#6366f1',
        rgb: '99,102,241',
        badge: 'LeetCode #1 · Easy',
        text: `Two Sum\n\nGiven an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume each input would have exactly one solution, and you may not use the same element twice.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]`
    },
    {
        key: 'valid_parentheses',
        icon: '📚',
        title: 'Valid Parentheses',
        desc: 'Determine if a string of brackets is valid and correctly nested.',
        ds: 'Stack',
        color: '#ec4899',
        rgb: '236,72,153',
        badge: 'LeetCode #20 · Easy',
        text: `Valid Parentheses\n\nGiven a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n\nExample:\nInput: s = "()[]{}"\nOutput: true`
    },
    {
        key: 'longest_substring',
        icon: '🪟',
        title: 'Longest Substring',
        desc: 'Find the longest substring without repeating characters.',
        ds: 'Sliding Window',
        color: '#14b8a6',
        rgb: '20,184,166',
        badge: 'LeetCode #3 · Medium',
        text: `Longest Substring Without Repeating Characters\n\nGiven a string s, find the length of the longest substring without repeating characters.\n\nExample:\nInput: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.`
    },
    {
        key: 'climbing_stairs',
        icon: '🪜',
        title: 'Climbing Stairs',
        desc: 'Count distinct ways to climb n stairs taking 1 or 2 steps.',
        ds: 'Dynamic Programming',
        color: '#f97316',
        rgb: '249,115,22',
        badge: 'LeetCode #70 · Easy',
        text: `Climbing Stairs\n\nYou are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample:\nInput: n = 5\nOutput: 8`
    },
    // ── REAL-WORLD SCENARIOS ───────────────────────────────
    {
        key: 'restaurant',
        icon: '🍽️',
        title: 'Restaurant Orders',
        desc: 'A busy restaurant receives orders in sequence.',
        ds: 'Queue',
        color: '#f59e0b',
        rgb: '245,158,11',
        badge: 'Real-World',
        text: 'A busy restaurant keeps receiving customer orders. The chef needs to process each order in the exact order it was received — the first order in should be the first one prepared. What data structure should the system use?'
    },
    {
        key: 'browser',
        icon: '🌐',
        title: 'Browser Navigation',
        desc: 'Implement back/forward navigation for a web browser.',
        ds: 'Stack',
        color: '#8b5cf6',
        rgb: '139,92,246',
        badge: 'Real-World',
        text: 'Design a browser history system that supports: visiting a new URL, pressing the Back button to return to the previous page, and pressing Forward to go back. What data structure(s) should you use?'
    },
    {
        key: 'social',
        icon: '👥',
        title: 'Friend Recommendations',
        desc: 'Suggest "People You May Know" on a social network.',
        ds: 'Graph + BFS',
        color: '#06b6d4',
        rgb: '6,182,212',
        badge: 'Real-World',
        text: 'A social network wants to recommend friends. If Alice is friends with Bob, and Bob is friends with Dave, then Dave should be recommended to Alice. How would you design this "People You May Know" system?'
    },
    {
        key: 'autocomplete',
        icon: '🔤',
        title: 'Search Autocomplete',
        desc: 'Show instant suggestions as the user types in a search bar.',
        ds: 'Trie',
        color: '#10b981',
        rgb: '16,185,129',
        badge: 'Real-World',
        text: 'Build an autocomplete system for a search engine. As the user types a prefix (e.g. "app"), the system should instantly return all words that start with that prefix. What data structure enables the fastest prefix search?'
    }
];

class ScenarioEngine {
    constructor() {
        this.currentData = null;
        this.currentStep = -1;
        this.isPlaying = false;
        this.playInterval = null;
        this.dsColor = '#00d4ff';
        this.dsRgb = '0,212,255';
        this.challengeMode = false;
        this.challengeAnswered = false;

        this.initElements();
        this.buildPresets();
        this.attachEvents();
    }

    initElements() {
        this.textarea        = document.getElementById('scenarioInput');
        this.analyzeBtn      = document.getElementById('analyzeBtn');
        this.clearBtn        = document.getElementById('clearBtn');
        this.loadingEl       = document.getElementById('scenarioLoading');
        this.resultsEl       = document.getElementById('scenarioResults');
        this.errorEl         = document.getElementById('errorCard');
        this.challengePanel  = document.getElementById('challengePanel');
        this.challengeToggle = document.getElementById('challengeToggle');
        this.presetsGrid     = document.getElementById('presetsGrid');

        // Result elements
        this.dsIconEl        = document.getElementById('dsIcon');
        this.dsNameEl        = document.getElementById('dsName');
        this.dsWhyEl         = document.getElementById('dsWhy');
        this.difficultyEl    = document.getElementById('dsDifficulty');
        this.categoryEl      = document.getElementById('dsCategory');
        this.stepTimeline    = document.getElementById('stepTimeline');
        this.stepProgress    = document.getElementById('stepProgress');
        this.scenarioCanvas  = document.getElementById('scenarioCanvas');
        this.pseudocodeEl    = document.getElementById('pseudocodeBlock');
        this.codeBlockEl     = document.getElementById('codeBlock');
        this.diagramEl       = document.getElementById('mermaidDiagram');
        this.complexityEl    = document.getElementById('complexityContent');
        this.realWorldEl     = document.getElementById('realWorldText');
        this.scenarioTitleEl = document.getElementById('scenarioTitle');

        // Step controls
        this.prevStepBtn  = document.getElementById('prevStepBtn');
        this.nextStepBtn  = document.getElementById('nextStepBtn');
        this.playStepBtn  = document.getElementById('playStepBtn');

        // Code tabs
        this.codeTabBtns = document.querySelectorAll('.code-tab-btn');
    }

    buildPresets() {
        if (!this.presetsGrid) return;

        // Section headers
        const lcHeader = document.createElement('div');
        lcHeader.style.cssText = 'grid-column:1/-1;font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-top:0.25rem;';
        lcHeader.textContent = '⚡ LeetCode Problems';
        this.presetsGrid.appendChild(lcHeader);

        const lcProblems = PRESET_SCENARIOS.filter(s => s.badge?.includes('LeetCode'));
        const rwScenarios = PRESET_SCENARIOS.filter(s => s.badge === 'Real-World');

        lcProblems.forEach(scenario => this._buildCard(scenario));

        const rwHeader = document.createElement('div');
        rwHeader.style.cssText = 'grid-column:1/-1;font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-top:0.75rem;';
        rwHeader.textContent = '🌍 Real-World Scenarios';
        this.presetsGrid.appendChild(rwHeader);

        rwScenarios.forEach(scenario => this._buildCard(scenario));
    }

    _buildCard(scenario) {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.style.setProperty('--preset-color', scenario.color);
        card.dataset.key = scenario.key;
        card.innerHTML = `
            <div class="preset-icon">${scenario.icon}</div>
            <div class="preset-info">
                <h4>${scenario.title}</h4>
                <p>${scenario.desc}</p>
                <span class="preset-ds-tag">${scenario.ds}</span>
                ${scenario.badge ? `<span style="display:inline-block;margin-left:4px;padding:0.12rem 0.45rem;border-radius:20px;font-size:0.65rem;font-weight:700;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);">${scenario.badge}</span>` : ''}
            </div>
        `;
        card.addEventListener('click', () => this.loadPreset(scenario));
        this.presetsGrid.appendChild(card);
    }

    loadPreset(scenario) {
        // Update active state
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        document.querySelector(`.preset-card[data-key="${scenario.key}"]`)?.classList.add('active');

        this.textarea.value = scenario.text;
        this.textarea.focus();

        // Auto-scroll to input
        this.textarea.closest('.scenario-input-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    attachEvents() {
        this.analyzeBtn?.addEventListener('click', () => this.analyzeScenario());
        this.clearBtn?.addEventListener('click', () => this.clearAll());

        this.textarea?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this.analyzeScenario();
        });

        this.challengeToggle?.addEventListener('change', () => {
            this.challengeMode = this.challengeToggle.checked;
        });

        this.prevStepBtn?.addEventListener('click', () => this.prevStep());
        this.nextStepBtn?.addEventListener('click', () => this.nextStep());
        this.playStepBtn?.addEventListener('click', () => this.togglePlay());

        // Code tabs
        this.codeTabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchCodeTab(btn.dataset.tab));
        });

        // Copy code
        document.getElementById('copyCodeBtn')?.addEventListener('click', () => this.copyCode());
    }

    async analyzeScenario() {
        const text = this.textarea?.value?.trim();
        if (!text) {
            this.showError('Please describe a scenario or select a preset above.');
            return;
        }

        // Challenge mode — show guess panel first
        if (this.challengeMode && !this.challengeAnswered) {
            this.showChallengePanel(text);
            return;
        }

        this.challengeAnswered = false;
        this.showLoading(true);
        this.hideError();
        this.hideResults();

        try {
            // Health check
            const healthRes = await fetch(`${BACKEND_URL}/api/health`).catch(() => null);
            if (!healthRes?.ok) throw new Error('Backend not reachable. Start the Flask server first.');

            const res = await fetch(`${BACKEND_URL}/api/scenario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: text, language: 'python' })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to analyze scenario');

            this.renderResults(data);
        } catch (err) {
            this.showError(err.message);
            console.error('[ScenarioEngine]', err);
        } finally {
            this.showLoading(false);
        }
    }

    showChallengePanel(text) {
        if (!this.challengePanel) return;

        const options = ['Queue', 'Stack', 'Graph + BFS', 'Trie', 'HashMap', 'Binary Tree', 'Linked List', 'Heap'];
        const optionsHtml = options.map(opt =>
            `<button class="challenge-option" data-ds="${opt}">${opt}</button>`
        ).join('');

        this.challengePanel.innerHTML = `
            <div class="challenge-prompt">
                <div class="icon">🧠</div>
                <div>
                    <h3>Challenge Mode — What data structure fits this scenario?</h3>
                    <p style="font-size:0.82rem;color:var(--color-muted);margin-top:0.3rem;">Think about it and pick one before seeing the answer.</p>
                </div>
            </div>
            <div class="challenge-options">${optionsHtml}</div>
        `;

        this.challengePanel.style.display = 'block';

        const self = this;
        this.challengePanel.querySelectorAll('.challenge-option').forEach(btn => {
            btn.addEventListener('click', async function() {
                self.challengeAnswered = true;

                // Get the actual answer by calling the API silently
                self.challengePanel.style.display = 'none';
                await self.analyzeScenario();

                // Highlight the guess vs actual
                if (self.currentData) {
                    const actual = self.currentData.data_structure?.toLowerCase() || '';
                    const guess = btn.dataset.ds.toLowerCase();
                    const correct = actual.includes(guess) || guess.includes(actual.split(' ')[0].toLowerCase());
                    btn.classList.add(correct ? 'correct' : 'incorrect');

                    // Show feedback toast
                    self.showToast(correct
                        ? `✅ Correct! ${self.currentData.data_structure} is the right choice!`
                        : `❌ Close! The answer was ${self.currentData.data_structure}. See why below.`
                    , correct ? 'success' : 'warning');
                }
            });
        });
    }

    renderResults(data) {
        this.currentData = data;
        this.currentStep = 0;

        // Set DS color CSS variables
        this.dsColor = data.ds_color || '#00d4ff';
        this.dsRgb = this.hexToRgb(this.dsColor);
        document.documentElement.style.setProperty('--ds-color', this.dsColor);
        document.documentElement.style.setProperty('--ds-rgb', this.dsRgb);

        // --- Banner ---
        if (this.scenarioTitleEl) this.scenarioTitleEl.textContent = data.scenario_title || 'Scenario Analysis';
        if (this.dsIconEl) this.dsIconEl.textContent = data.ds_icon || '🔧';
        if (this.dsNameEl) this.dsNameEl.textContent = data.data_structure || '';
        if (this.dsWhyEl) this.dsWhyEl.textContent = data.why_this_ds || '';

        // Banner glow
        const banner = document.getElementById('dsBanner');
        if (banner) {
            banner.style.setProperty('--ds-color', this.dsColor);
            banner.style.setProperty('--ds-rgb', this.dsRgb);
        }

        // Difficulty badge
        if (this.difficultyEl) {
            const diff = (data.difficulty || 'Beginner').toLowerCase();
            this.difficultyEl.textContent = `🎯 ${data.difficulty || 'Beginner'}`;
            this.difficultyEl.className = `meta-badge difficulty-${diff}`;
        }
        if (this.categoryEl) this.categoryEl.textContent = `📁 ${data.category || 'General'}`;

        // --- Step Timeline ---
        this.renderStepTimeline(data.approach_steps || []);

        // --- Canvas Visualization ---
        this.drawVisualization(data, 0);

        // --- Pseudocode ---
        this.renderPseudocode(data.pseudocode || '');

        // --- Code ---
        if (this.codeBlockEl) {
            this.codeBlockEl.textContent = data.code || data.code_python || '';
        }

        // --- Diagram ---
        this.renderDiagram(data.diagram || '');

        // --- Complexity ---
        this.renderComplexity(data.complexity || '', data.real_world_connection || '');

        // Show results with animation
        this.showResults();

        // Auto-play step animation after 800ms
        setTimeout(() => this.autoPlaySteps(), 800);
    }

    renderStepTimeline(steps) {
        if (!this.stepTimeline) return;
        this.stepTimeline.innerHTML = '';

        steps.forEach((step, i) => {
            const el = document.createElement('div');
            el.className = 'step-item';
            el.dataset.step = i;

            const stateHtml = (step.ds_state || []).map(s =>
                `<span class="ds-state-item">${this.escape(s)}</span>`
            ).join('');

            el.innerHTML = `
                <div class="step-num">${step.step || i + 1}</div>
                <div class="step-body">
                    <div class="step-title">${this.escape(step.title || '')}</div>
                    <div class="step-detail">${this.escape(step.detail || '')}</div>
                    ${stateHtml ? `<div class="step-ds-state">${stateHtml}</div>` : ''}
                </div>
            `;
            this.stepTimeline.appendChild(el);
        });

        this.updateStepUI();
    }

    updateStepUI() {
        const steps = this.stepTimeline?.querySelectorAll('.step-item') || [];
        const total = steps.length;

        steps.forEach((el, i) => {
            el.classList.toggle('active', i === this.currentStep);
            el.classList.toggle('visible', i <= this.currentStep);
        });

        if (this.stepProgress) {
            this.stepProgress.textContent = `${this.currentStep + 1} / ${total}`;
        }
        if (this.prevStepBtn) this.prevStepBtn.disabled = this.currentStep <= 0;
        if (this.nextStepBtn) this.nextStepBtn.disabled = this.currentStep >= total - 1;

        // Scroll active step into view
        const activeEl = this.stepTimeline?.querySelector('.step-item.active');
        activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Update canvas for current step
        if (this.currentData) {
            this.drawVisualization(this.currentData, this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepUI();
        }
    }

    nextStep() {
        const total = this.stepTimeline?.querySelectorAll('.step-item').length || 0;
        if (this.currentStep < total - 1) {
            this.currentStep++;
            this.updateStepUI();
        } else {
            this.stopPlay();
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stopPlay();
        } else {
            this.startPlay();
        }
    }

    startPlay() {
        this.isPlaying = true;
        if (this.playStepBtn) this.playStepBtn.innerHTML = '⏸ Pause';
        this.playInterval = setInterval(() => {
            const total = this.stepTimeline?.querySelectorAll('.step-item').length || 0;
            if (this.currentStep >= total - 1) {
                this.stopPlay();
            } else {
                this.nextStep();
            }
        }, 1800);
    }

    stopPlay() {
        this.isPlaying = false;
        if (this.playStepBtn) this.playStepBtn.innerHTML = '▶ Auto Play';
        clearInterval(this.playInterval);
    }

    autoPlaySteps() {
        this.currentStep = 0;
        this.updateStepUI();
        this.startPlay();
    }

    // ===== CANVAS VISUALIZATION =====
    drawVisualization(data, stepIndex) {
        const canvas = this.scenarioCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const W = canvas.width  = canvas.offsetWidth  || 520;
        const H = canvas.height = canvas.offsetHeight || 320;
        ctx.clearRect(0, 0, W, H);

        const step = (data.approach_steps || [])[stepIndex];
        const items = step?.ds_state || [];
        const ds = (data.data_structure || '').toLowerCase();
        const color = data.ds_color || '#00d4ff';

        // Background
        ctx.fillStyle = 'rgba(8,14,26,0.5)';
        ctx.fillRect(0, 0, W, H);

        if (ds.includes('queue')) {
            this.drawQueue(ctx, W, H, items, color);
        } else if (ds.includes('stack')) {
            this.drawStack(ctx, W, H, items, color);
        } else if (ds.includes('graph') || ds.includes('bfs')) {
            this.drawGraph(ctx, W, H, items, color, stepIndex);
        } else if (ds.includes('trie')) {
            this.drawTrie(ctx, W, H, items, color, stepIndex);
        } else if (ds.includes('hashmap') || ds.includes('hash map') || ds.includes('dictionary') || ds.includes('sliding window') || ds.includes('dynamic programming') || ds.includes('dp')) {
            this.drawHashMap(ctx, W, H, items, color, data.data_structure);
        } else {
            this.drawGeneric(ctx, W, H, items, color);
        }
    }

    drawHashMap(ctx, W, H, items, color, dsLabel) {
        // Title
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px "DM Sans"';
        ctx.textAlign = 'center';
        ctx.fillText(dsLabel || 'HashMap', W / 2, 22);

        // Filter out empty items
        const entries = items.filter(Boolean);
        if (!entries.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px "DM Sans"';
            ctx.fillText('(empty)', W / 2, H / 2);
            return;
        }

        // Draw key-value slot table
        const slotH = 42, slotW = Math.min(260, W - 60), gap = 8;
        const totalH = entries.length * (slotH + gap) - gap;
        let y = (H - totalH) / 2;
        const x = (W - slotW) / 2;
        const keyW = slotW * 0.38;
        const valW = slotW - keyW - 2;

        // Table header
        ctx.fillStyle = color + '20';
        ctx.strokeStyle = color + '40';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y - 28, slotW, 24, 4);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'bold 10px "DM Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('KEY', x + keyW / 2, y - 12);
        ctx.fillText('VALUE / STATE', x + keyW + valW / 2, y - 12);

        entries.forEach((item, i) => {
            const iy = y + i * (slotH + gap);
            const isLast = i === entries.length - 1;

            // Slot background
            ctx.fillStyle = isLast ? color + '22' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isLast ? color : 'rgba(255,255,255,0.09)';
            ctx.lineWidth = isLast ? 1.5 : 1;
            this.roundRect(ctx, x, iy, slotW, slotH, 7);
            ctx.fill(); ctx.stroke();

            // Divider between key and value
            ctx.beginPath();
            ctx.moveTo(x + keyW, iy + 8);
            ctx.lineTo(x + keyW, iy + slotH - 8);
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Parse key:value or display as single entry
            const colonIdx = item.indexOf(':');
            const key = colonIdx > -1 ? item.substring(0, colonIdx).trim() : `[${i}]`;
            const val = colonIdx > -1 ? item.substring(colonIdx + 1).trim() : item;

            ctx.fillStyle = isLast ? color : 'rgba(255,255,255,0.5)';
            ctx.font = `bold 11px "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(key, x + keyW / 2, iy + slotH / 2 + 4);

            ctx.fillStyle = isLast ? '#ffffff' : 'rgba(255,255,255,0.8)';
            ctx.font = `${isLast ? 'bold ' : ''}11px "Fira Code", monospace`;
            this.wrapText(ctx, val, x + keyW + valW / 2, iy + slotH / 2 + 4, valW - 10, 13);

            // Hash indicator
            ctx.fillStyle = color + '60';
            ctx.font = '9px "DM Sans"';
            ctx.textAlign = 'left';
            ctx.fillText(`#${i}`, x - 20, iy + slotH / 2 + 4);
        });
    }

    drawQueue(ctx, W, H, items, color) {
        ctx.font = 'bold 13px "DM Sans", sans-serif';
        ctx.textAlign = 'center';

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px "DM Sans"';
        ctx.fillText('← DEQUEUE (front)                                     ENQUEUE (back) →', W / 2, 24);

        const boxW = 110, boxH = 50, gap = 12;
        const totalW = items.length * (boxW + gap) - gap;
        let startX = Math.max(24, (W - totalW) / 2);
        const y = H / 2 - boxH / 2;

        // Track arrow
        if (items.length > 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(28, H / 2);
            ctx.lineTo(W - 28, H / 2);
            ctx.stroke();
        }

        items.forEach((item, i) => {
            const x = startX + i * (boxW + gap);
            const isFirst = i === 0;
            const isLast  = i === items.length - 1;

            // Box
            ctx.fillStyle = isFirst
                ? color + '33'
                : isLast
                    ? color + '22'
                    : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isFirst ? color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isFirst ? 2 : 1;

            this.roundRect(ctx, x, y, boxW, boxH, 10);
            ctx.fill();
            ctx.stroke();

            // Arrow between boxes
            if (i < items.length - 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(x + boxW + 3, H / 2);
                ctx.lineTo(x + boxW + gap - 3, H / 2 - 5);
                ctx.lineTo(x + boxW + gap - 3, H / 2 + 5);
                ctx.closePath();
                ctx.fill();
            }

            // Text
            ctx.fillStyle = isFirst ? color : 'rgba(255,255,255,0.8)';
            ctx.font = `${isFirst ? 'bold ' : ''}12px "DM Sans"`;
            ctx.textAlign = 'center';
            this.wrapText(ctx, item, x + boxW / 2, y + boxH / 2 + 5, boxW - 12, 15);
        });

        if (items.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px "DM Sans"';
            ctx.textAlign = 'center';
            ctx.fillText('Queue is empty ✓', W / 2, H / 2 + 6);
        }

        // Labels
        if (items.length > 0) {
            ctx.fillStyle = color;
            ctx.font = 'bold 10px "DM Sans"';
            ctx.textAlign = 'center';
            const startXFirst = Math.max(24, (W - totalW) / 2);
            ctx.fillText('FRONT', startXFirst + boxW / 2, y - 8);
            const lastX = startXFirst + (items.length - 1) * (boxW + gap);
            ctx.fillText('BACK', lastX + boxW / 2, y - 8);
        }
    }

    drawStack(ctx, W, H, items, color) {
        const boxW = 180, boxH = 46, gap = 6;
        const totalH = items.length * (boxH + gap);
        let startY = (H - totalH) / 2 + totalH - boxH;
        const x = (W - boxW) / 2;

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px "DM Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('↑ TOP (most recent)', W / 2, 24);
        ctx.fillText('↓ BOTTOM (oldest)', W / 2, H - 12);

        [...items].reverse().forEach((item, i) => {
            const y = startY - i * (boxH + gap);
            const isTop = i === items.length - 1;

            ctx.fillStyle = isTop ? color + '33' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isTop ? color : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isTop ? 2 : 1;

            this.roundRect(ctx, x, y, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isTop ? color : 'rgba(255,255,255,0.75)';
            ctx.font = `${isTop ? 'bold ' : ''}13px "DM Sans"`;
            ctx.textAlign = 'center';
            this.wrapText(ctx, item, x + boxW / 2, y + boxH / 2 + 5, boxW - 16, 15);
        });

        if (items.length > 0) {
            // TOP label
            const topY = startY - (items.length - 1) * (boxH + gap);
            ctx.fillStyle = color;
            ctx.font = 'bold 10px "DM Sans"';
            ctx.textAlign = 'left';
            ctx.fillText('← TOP', x + boxW + 10, topY + boxH / 2 + 4);
        }

        if (items.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px "DM Sans"';
            ctx.textAlign = 'center';
            ctx.fillText('Stack is empty', W / 2, H / 2 + 6);
        }
    }

    drawGraph(ctx, W, H, items, color, stepIndex) {
        // Fixed node positions for social graph
        const nodes = [
            { id: 'Alice', x: W/2, y: H/2, color: color, size: 30, type: 'source' },
            { id: 'Bob',   x: W/2 - 100, y: H/2 - 80, color: 'rgba(255,255,255,0.6)', size: 24, type: '1st' },
            { id: 'Carol', x: W/2 + 100, y: H/2 - 80, color: 'rgba(255,255,255,0.6)', size: 24, type: '1st' },
            { id: 'Dave',  x: W/2 - 160, y: H/2 + 60, color: '#f59e0b', size: 20, type: '2nd' },
            { id: 'Eve',   x: W/2 - 50,  y: H/2 + 90, color: '#f59e0b', size: 20, type: '2nd' },
            { id: 'Frank', x: W/2 + 130, y: H/2 + 60, color: '#f59e0b', size: 20, type: '2nd' },
        ];

        const edges = [
            ['Alice','Bob'], ['Alice','Carol'],
            ['Bob','Dave'], ['Bob','Eve'],
            ['Carol','Frank']
        ];

        // Draw edges
        edges.forEach(([a, b]) => {
            const na = nodes.find(n => n.id === a);
            const nb = nodes.find(n => n.id === b);
            ctx.beginPath();
            ctx.moveTo(na.x, na.y);
            ctx.lineTo(nb.x, nb.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Draw nodes
        nodes.forEach(node => {
            const isHighlighted = items.some(i => i.toLowerCase().includes(node.id.toLowerCase()));
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted ? node.color + '40' : 'rgba(255,255,255,0.04)';
            ctx.fill();
            ctx.strokeStyle = isHighlighted ? node.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isHighlighted ? 2.5 : 1;
            ctx.stroke();

            ctx.fillStyle = isHighlighted ? node.color : 'rgba(255,255,255,0.5)';
            ctx.font = `bold ${node.size > 24 ? 12 : 10}px "DM Sans"`;
            ctx.textAlign = 'center';
            ctx.fillText(node.id, node.x, node.y + 4);
        });

        // Legend
        ctx.fillStyle = color;
        ctx.font = 'bold 10px "DM Sans"';
        ctx.textAlign = 'left';
        ctx.fillText('● Source', 16, H - 38);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('● 2nd-degree (Recommendations)', 16, H - 22);
    }

    drawTrie(ctx, W, H, items, color, stepIndex) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px "DM Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('Trie Prefix Tree', W / 2, 22);

        // Draw simplified trie
        const root = { label: 'root', x: W / 2, y: 45, children: [] };
        const nodeA = { label: 'a', x: W / 2, y: 100, children: [] };
        const nodeP1 = { label: 'p', x: W / 2, y: 155, children: [] };
        const nodeP2 = { label: 'p', x: W / 2 - 60, y: 210, children: [] };
        const nodeT  = { label: 't ✓', x: W / 2 + 60, y: 210, children: [], end: true };
        const nodeE  = { label: 'e ✓', x: W / 2 - 80, y: 265, children: [], end: true };
        const nodeL  = { label: 'l', x: W / 2 - 10, y: 265, children: [] };

        const allNodes = [root, nodeA, nodeP1, nodeP2, nodeT, nodeE, nodeL];
        const edges2 = [[root, nodeA], [nodeA, nodeP1], [nodeP1, nodeP2], [nodeP1, nodeT], [nodeP2, nodeE], [nodeP2, nodeL]];

        edges2.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y + 12);
            ctx.lineTo(b.x, b.y - 12);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        allNodes.forEach(node => {
            const active = items.some(i => i.toLowerCase().startsWith(node.label.replace(' ✓', '').toLowerCase()));
            ctx.beginPath();
            ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = node.end ? color + '30' : active ? color + '20' : 'rgba(255,255,255,0.04)';
            ctx.fill();
            ctx.strokeStyle = node.end ? color : active ? color + '88' : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = node.end ? 2 : 1;
            ctx.stroke();

            ctx.fillStyle = node.end ? color : 'rgba(255,255,255,0.75)';
            ctx.font = `${node.end ? 'bold ' : ''}10px "Fira Code"`;
            ctx.textAlign = 'center';
            ctx.fillText(node.label, node.x, node.y + 4);
        });
    }

    drawGeneric(ctx, W, H, items, color) {
        const boxW = 120, boxH = 44, gap = 10;
        const cols = Math.min(3, items.length);
        const rows = Math.ceil(items.length / cols);
        const totalW = cols * (boxW + gap) - gap;
        const totalH = rows * (boxH + gap) - gap;
        const startX = (W - totalW) / 2;
        const startY = (H - totalH) / 2;

        items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (boxW + gap);
            const y = startY + row * (boxH + gap);

            ctx.fillStyle = color + '20';
            ctx.strokeStyle = color + '60';
            ctx.lineWidth = 1;
            this.roundRect(ctx, x, y, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '12px "DM Sans"';
            ctx.textAlign = 'center';
            this.wrapText(ctx, item, x + boxW / 2, y + boxH / 2 + 5, boxW - 12, 14);
        });
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = String(text).split(' ');
        let line = '';
        let offsetY = 0;
        words.forEach(word => {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > maxWidth && line !== '') {
                ctx.fillText(line.trim(), x, y + offsetY);
                line = word + ' ';
                offsetY += lineHeight;
            } else {
                line = test;
            }
        });
        ctx.fillText(line.trim(), x, y + offsetY);
    }

    // ===== PSEUDOCODE =====
    renderPseudocode(pseudocode) {
        if (!this.pseudocodeEl) return;
        const lines = pseudocode.split('\n').filter(l => l.trim());
        this.pseudocodeEl.innerHTML = lines.map(line =>
            `<span class="pseudo-line">${this.escape(line)}</span>`
        ).join('');
    }

    // ===== MERMAID DIAGRAM =====
    renderDiagram(diagram) {
        if (!this.diagramEl || !diagram) return;
        this.diagramEl.removeAttribute('data-processed');
        this.diagramEl.innerHTML = diagram;
        try {
            if (window.mermaid) {
                mermaid.init(undefined, this.diagramEl);
            }
        } catch (e) {
            console.warn('Mermaid render error:', e);
            this.diagramEl.innerHTML = `<pre style="color:rgba(255,255,255,0.4);font-size:0.75rem;padding:1rem;overflow:auto">${diagram}</pre>`;
        }
    }

    // ===== COMPLEXITY =====
    renderComplexity(complexity, realWorld) {
        if (!this.complexityEl) return;
        const lines = complexity.split('\n').filter(l => l.trim());
        this.complexityEl.innerHTML = lines.map(line => {
            const parts = line.split(':');
            const label = parts[0]?.trim() || 'Complexity';
            const value = parts.slice(1).join(':').trim() || line;
            return `
                <div class="complexity-item">
                    <span class="complexity-label">${this.escape(label)}</span>
                    <span class="complexity-value">${this.escape(value)}</span>
                </div>
            `;
        }).join('');

        if (this.realWorldEl) {
            this.realWorldEl.textContent = realWorld || '';
        }
    }

    // ===== CODE TABS =====
    switchCodeTab(tab) {
        document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.code-tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tab));
    }

    copyCode() {
        const code = this.codeBlockEl?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copyCodeBtn');
            if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
        });
    }

    // ===== UI STATE =====
    showLoading(show) {
        if (this.loadingEl) this.loadingEl.style.display = show ? 'block' : 'none';
        if (this.analyzeBtn) this.analyzeBtn.disabled = show;
        if (show && this.resultsEl) this.resultsEl.style.display = 'none';
    }

    showResults() {
        if (!this.resultsEl) return;
        this.resultsEl.style.display = 'block';
        requestAnimationFrame(() => {
            this.resultsEl.classList.add('visible');
            this.resultsEl.querySelectorAll('.animate-up').forEach((el, i) => {
                setTimeout(() => el.classList.add('visible'), i * 120);
            });
        });
        this.resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideResults() {
        if (this.resultsEl) {
            this.resultsEl.classList.remove('visible');
            this.resultsEl.style.display = 'none';
        }
    }

    showError(msg) {
        if (this.errorEl) {
            this.errorEl.textContent = '⚠️ ' + msg;
            this.errorEl.style.display = 'block';
        }
    }

    hideError() {
        if (this.errorEl) this.errorEl.style.display = 'none';
    }

    clearAll() {
        if (this.textarea) this.textarea.value = '';
        this.hideResults();
        this.hideError();
        this.stopPlay();
        this.currentData = null;
        this.currentStep = -1;
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        if (this.challengePanel) {
            this.challengePanel.style.display = 'none';
            this.challengePanel.innerHTML = '';
        }
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; z-index: 9999;
            background: ${type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'};
            border: 1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'};
            color: ${type === 'success' ? '#10b981' : '#f59e0b'};
            padding: 0.875rem 1.5rem; border-radius: 12px;
            font-size: 0.9rem; font-weight: 600;
            backdrop-filter: blur(12px);
            animation: fadeSlideIn 0.3s ease;
            max-width: 380px; line-height: 1.4;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
            : '0,212,255';
    }

    escape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.scenarioEngine = new ScenarioEngine();
    console.log('ScenarioEngine initialized ✅');
});

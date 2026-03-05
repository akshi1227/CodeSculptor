// Animation Engine using GSAP
class AnimationEngine {
    constructor() {
        this.steps = [];
        this.visualizationSteps = [];
        this.visualizationData = null;
        this.currentStep = 0;
        this.currentVizStep = 0;
        this.isPlaying = false;
        this.timeline = null;
        this.speed = 1.5;
        this.vizContainer = document.getElementById('visualizerDisplay');
        this.renderer = new AdvancedRenderer(this.vizContainer);
        this.isStepping = false;
    }

    loadSteps(steps, visualization = null) {
        this.steps = steps;
        this.visualizationData = visualization;
        this.visualizationSteps = visualization ? visualization.steps : [];
        this.currentStep = 0;
        this.currentVizStep = 0;
        this.reset();

        // Only show visualization if we have valid visualization data
        if (visualization && visualization.visualization_type && visualization.steps && visualization.steps.length > 0) {
            this.vizContainer.style.display = 'flex';
            // Renderer will handle initialization
        } else {
            // For generic/unknown algorithms, show a message in the viz panel
            this.vizContainer.style.display = 'flex';
            this.vizContainer.innerHTML = `
                <div class="viz-description" style="text-align: center; padding: 40px 20px;">
                    <h3 style="color: var(--color-light); margin-bottom: 15px;">📝 Pseudocode Execution</h3>
                    <p style="color: rgba(243, 244, 244, 0.8); line-height: 1.6;">
                        This algorithm will be executed step-by-step through the pseudocode on the right.
                        <br><br>
                        Watch the highlighted lines to follow the execution flow.
                    </p>
                </div>
            `;
        }
    }

    play(voiceNarrator = null) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.animateSteps(voiceNarrator);
    }

    pause() {
        this.isPlaying = false;
        if (this.timeline) {
            this.timeline.pause();
        }
    }

    reset() {
        this.isPlaying = false;
        this.currentStep = 0;

        if (this.timeline) {
            this.timeline.kill();
        }

        // Reset all lines
        const lines = document.querySelectorAll('.pseudocode-line');
        lines.forEach(line => {
            line.classList.remove('active');
            gsap.set(line, { opacity: 0.6, x: 0 });
        });
    }

    async animateSteps(voiceNarrator) {
        const totalSteps = Math.max(this.steps.length, this.visualizationSteps.length);

        if (this.currentStep >= totalSteps - 1) {
            this.currentStep = 0;
            this.currentVizStep = 0;
        }

        for (let i = this.currentStep; i < totalSteps; i++) {
            if (!this.isPlaying) {
                this.currentStep = i;
                break;
            }

            // Sync current steps
            this.currentStep = i;
            this.currentVizStep = i;

            await this.executeStep(i, voiceNarrator);

            // Wait before next step - respect speed (lower is faster in wait)
            // Slider 0.5x to 2.5x -> speed 2.0s to 0.4s
            const waitTime = (1 / this.speed) * 2000;
            await this.wait(waitTime);
        }

        if (this.currentStep >= totalSteps - 1) {
            this.isPlaying = false;
            if (window.app && typeof window.app.updatePlaybackButtons === 'function') {
                window.app.updatePlaybackButtons();
            }
        }
    }

    async executeStep(i, voiceNarrator = null) {
        // 1. Update Pseudocode
        if (this.steps[i]) {
            this.highlightLine(i);
            // Speak if voice narrator is enabled
            if (voiceNarrator && this.isPlaying) {
                await voiceNarrator.speak(this.steps[i].content);
            }
        }

        // 2. Update Visualization
        if (this.visualizationSteps[i] && this.visualizationData) {
            this.renderer.render(this.visualizationData, this.visualizationSteps[i]);
        }
    }

    async nextStep() {
        const totalSteps = Math.max(this.steps.length, this.visualizationSteps.length);
        if (this.currentStep < totalSteps - 1) {
            this.currentStep++;
            this.currentVizStep = this.currentStep;
            await this.executeStep(this.currentStep);
        }
    }

    async previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.currentVizStep = this.currentStep;
            await this.executeStep(this.currentStep);
        }
    }

    initViz(visualization) {
        this.vizContainer.innerHTML = '';

        const description = document.createElement('div');
        description.className = 'visualizer-description';
        description.id = 'vizDescription';
        description.textContent = 'Preparing algorithm visualization...';
        this.vizContainer.appendChild(description);

        if (visualization.algorithm.includes('Sort')) {
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';
            arrayContainer.id = 'arrayContainer';

            const initialArray = visualization.initial_array || [];
            initialArray.forEach((val, idx) => {
                const bar = document.createElement('div');
                bar.className = 'array-bar';
                bar.style.height = `${(val / Math.max(...initialArray)) * 100}%`;
                bar.textContent = val;
                bar.id = `bar-${idx}`;
                arrayContainer.appendChild(bar);
            });
            this.vizContainer.appendChild(arrayContainer);
        } else if (visualization.algorithm.includes('Search') || visualization.algorithm.includes('Even/Odd')) {
            const numberDisplay = document.createElement('div');
            numberDisplay.className = 'number-display';
            numberDisplay.id = 'numberDisplay';
            numberDisplay.textContent = visualization.number || visualization.target || '-';
            this.vizContainer.appendChild(numberDisplay);
        }
    }

    updateViz(step) {
        const description = document.getElementById('vizDescription');
        if (description) description.textContent = step.description;

        const arrayContainer = document.getElementById('arrayContainer');
        if (arrayContainer && step.array) {
            const maxVal = Math.max(...step.array);
            step.array.forEach((val, idx) => {
                const bar = document.getElementById(`bar-${idx}`);
                if (bar) {
                    bar.style.height = `${(val / maxVal) * 100}%`;
                    bar.textContent = val;

                    // Reset classes
                    bar.className = 'array-bar';

                    if (step.comparing_indices && step.comparing_indices.includes(idx)) {
                        bar.classList.add('compare');
                    }
                    if (step.highlighted_indices && step.highlighted_indices.includes(idx)) {
                        bar.classList.add('highlight');
                    }
                    if (step.sorted_indices && step.sorted_indices.includes(idx)) {
                        bar.classList.add('sorted');
                    }
                }
            });
        }

        const numberDisplay = document.getElementById('numberDisplay');
        if (numberDisplay) {
            if (step.number !== undefined) numberDisplay.textContent = step.number;
            if (step.result) {
                numberDisplay.style.color = step.result === 'even' ? 'var(--success-color)' : 'var(--error-color)';
            }
        }
    }

    highlightLine(index) {
        const lines = document.querySelectorAll('.pseudocode-line');

        // Remove previous highlights
        lines.forEach(line => line.classList.remove('active'));

        // Highlight current line
        if (lines[index]) {
            lines[index].classList.add('active');

            // Animate with GSAP
            gsap.fromTo(lines[index],
                { opacity: 0.6, x: 0 },
                {
                    opacity: 1,
                    x: 5,
                    duration: 0.3,
                    ease: "power2.out"
                }
            );

            // Scroll into view
            lines[index].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}
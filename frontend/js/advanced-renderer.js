// Advanced Visualization Renderer - Visualgo-style rendering engine
// Supports: Arrays, Graphs, Trees, Recursion Trees, and more

class AdvancedRenderer {
    constructor(container) {
        this.container = container;
        this.svgNS = "http://www.w3.org/2000/svg";
        this.currentVisualization = null;
    }

    render(visualizationData, step) {
        const vizType = visualizationData.visualization_type;

        switch (vizType) {
            case 'array':
                return this.renderArray(step);
            case 'array_search':
                return this.renderArraySearch(step);
            case 'graph':
                return this.renderGraph(step, visualizationData);
            case 'weighted_graph':
                return this.renderWeightedGraph(step, visualizationData);
            case 'tree':
                return this.renderTree(step, visualizationData);
            case 'hash_map_search':
                return this.renderHashMapSearch(step);
            case 'grid_search':
                return this.renderGridSearch(step);
            case 'recursion_tree':
                return this.renderRecursionTree(step);
            case 'conceptual':
                return this.renderConceptual(step);
            case 'mermaid':
                return this.renderMermaid(step);
            case 'image':
                return this.renderImage(step);
            default:
                return this.renderArray(step);
        }
    }

    renderArray(step) {
        let arrayContainer = this.container.querySelector('.array-visualization');
        let description = this.container.querySelector('.viz-description');

        if (!arrayContainer) {
            this.container.innerHTML = '';
            description = document.createElement('div');
            description.className = 'viz-description';
            this.container.appendChild(description);

            arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-visualization';
            this.container.appendChild(arrayContainer);
        }

        description.textContent = step.description;
        const array = step.array || [];
        const maxVal = Math.max(...array, 1);

        // Update or create bars
        array.forEach((value, index) => {
            let barWrapper = arrayContainer.children[index];
            if (!barWrapper) {
                barWrapper = document.createElement('div');
                barWrapper.className = 'array-bar-wrapper';

                const bar = document.createElement('div');
                bar.className = 'array-bar';

                const indexLabel = document.createElement('div');
                indexLabel.className = 'array-index';
                indexLabel.textContent = index;

                barWrapper.appendChild(bar);
                barWrapper.appendChild(indexLabel);
                arrayContainer.appendChild(barWrapper);
            }

            const bar = barWrapper.querySelector('.array-bar');

            // Use GSAP for height change if it's already there
            const targetHeight = (value / maxVal) * 150;
            gsap.to(bar, {
                height: targetHeight,
                duration: 0.3,
                ease: "power2.out"
            });
            bar.textContent = value;

            // Apply state classes
            bar.className = 'array-bar';
            if (step.comparing_indices && step.comparing_indices.includes(index)) bar.classList.add('comparing');
            if (step.swapped_indices && step.swapped_indices.includes(index)) bar.classList.add('swapped');
            if (step.highlighted_indices && step.highlighted_indices.includes(index)) bar.classList.add('highlighted');
            if (step.sorted_indices && step.sorted_indices.includes(index)) bar.classList.add('sorted');
        });

        // Remove extra bars if any
        while (arrayContainer.children.length > array.length) {
            arrayContainer.removeChild(arrayContainer.lastChild);
        }
    }

    renderArraySearch(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Target display
        const targetDisplay = document.createElement('div');
        targetDisplay.className = 'target-display';
        targetDisplay.innerHTML = `<span class="label">Target:</span> <span class="value">${step.target}</span>`;
        this.container.appendChild(targetDisplay);

        // Array container with search space
        const arrayContainer = document.createElement('div');
        arrayContainer.className = 'array-visualization search-mode';

        const array = step.array || [];

        array.forEach((value, index) => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'array-bar-wrapper';

            // Index label
            const indexLabel = document.createElement('div');
            indexLabel.className = 'array-index';
            indexLabel.textContent = index;

            // Bar
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.textContent = value;

            // Apply state classes
            const inSearchSpace = step.search_space && step.search_space.includes(index);

            if (!inSearchSpace) {
                bar.classList.add('excluded');
            }
            if (step.highlighted_indices && step.highlighted_indices.includes(index)) {
                bar.classList.add('highlighted');
            }
            if (index === step.mid) {
                bar.classList.add('mid-point');
            }
            if (step.action === 'found' && step.highlighted_indices && step.highlighted_indices.includes(index)) {
                bar.classList.add('found');
            }

            barWrapper.appendChild(bar);
            barWrapper.appendChild(indexLabel);
            arrayContainer.appendChild(barWrapper);
        });

        this.container.appendChild(arrayContainer);

        // Pointers display
        if (step.left !== undefined && step.right !== undefined) {
            const pointersDisplay = document.createElement('div');
            pointersDisplay.className = 'pointers-display';
            pointersDisplay.innerHTML = `
                <span class="pointer left">Left: ${step.left}</span>
                <span class="pointer mid">Mid: ${step.mid >= 0 ? step.mid : '-'}</span>
                <span class="pointer right">Right: ${step.right}</span>
            `;
            this.container.appendChild(pointersDisplay);
        }
    }

    renderGraph(step, visualizationData) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Queue/Stack display
        if (step.queue_or_stack && step.queue_or_stack.length > 0) {
            const queueDisplay = document.createElement('div');
            queueDisplay.className = 'queue-display';
            const label = visualizationData.algorithm === 'BFS' ? 'Queue' : 'Stack';
            queueDisplay.innerHTML = `<span class="label">${label}:</span> <span class="value">[${step.queue_or_stack.join(', ')}]</span>`;
            this.container.appendChild(queueDisplay);
        }

        // SVG for graph
        const svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '400');
        svg.setAttribute('class', 'graph-svg');

        const graph = step.graph;
        const nodes = step.nodes || [];

        // Calculate node positions (circular layout)
        const centerX = 300;
        const centerY = 200;
        const radius = 120;
        const nodePositions = {};

        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
            nodePositions[node] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Draw edges
        const edgesGroup = document.createElementNS(this.svgNS, 'g');
        edgesGroup.setAttribute('class', 'edges');

        Object.keys(graph).forEach(source => {
            const neighbors = graph[source] || [];
            neighbors.forEach(target => {
                if (nodePositions[source] && nodePositions[target]) {
                    const line = document.createElementNS(this.svgNS, 'line');
                    line.setAttribute('x1', nodePositions[source].x);
                    line.setAttribute('y1', nodePositions[source].y);
                    line.setAttribute('x2', nodePositions[target].x);
                    line.setAttribute('y2', nodePositions[target].y);
                    line.setAttribute('class', 'edge');

                    // Highlight edge if in highlighted_edges
                    if (step.highlighted_edges && step.highlighted_edges.some(e => e[0] === source && e[1] === target)) {
                        line.classList.add('highlighted');
                    }

                    edgesGroup.appendChild(line);
                }
            });
        });
        svg.appendChild(edgesGroup);

        // Draw nodes
        const nodesGroup = document.createElementNS(this.svgNS, 'g');
        nodesGroup.setAttribute('class', 'nodes');

        nodes.forEach(node => {
            const pos = nodePositions[node];

            // Node circle
            const circle = document.createElementNS(this.svgNS, 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 25);
            circle.setAttribute('class', 'node');

            // Apply state classes
            if (step.visited && step.visited.includes(node)) {
                circle.classList.add('visited');
            }
            if (step.current === node) {
                circle.classList.add('current');
            }

            nodesGroup.appendChild(circle);

            // Node label
            const text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y);
            text.setAttribute('class', 'node-label');
            text.textContent = node;
            nodesGroup.appendChild(text);
        });
        svg.appendChild(nodesGroup);

        this.container.appendChild(svg);

        // Visited nodes display
        if (step.visited && step.visited.length > 0) {
            const visitedDisplay = document.createElement('div');
            visitedDisplay.className = 'visited-display';
            visitedDisplay.innerHTML = `<span class="label">Visited:</span> <span class="value">[${step.visited.join(' → ')}]</span>`;
            this.container.appendChild(visitedDisplay);
        }
    }

    renderWeightedGraph(step, visualizationData) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Distances display
        if (step.distances) {
            const distDisplay = document.createElement('div');
            distDisplay.className = 'distances-display';
            const dists = Object.entries(step.distances).map(([k, v]) => `${k}:${v === Infinity ? '∞' : v}`).join(', ');
            distDisplay.innerHTML = `<span class="label">Distances:</span> <span class="value">[${dists}]</span>`;
            this.container.appendChild(distDisplay);
        }

        // SVG for graph
        const svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '400');
        svg.setAttribute('class', 'graph-svg');

        const graph = step.graph;
        const nodes = visualizationData.nodes || Object.keys(graph);

        // Circular layout
        const centerX = 300;
        const centerY = 200;
        const radius = 120;
        const nodePositions = {};

        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
            nodePositions[node] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Draw edges
        const edgesGroup = document.createElementNS(this.svgNS, 'g');
        edgesGroup.setAttribute('class', 'edges');

        Object.keys(graph).forEach(source => {
            const neighbors = graph[source] || [];
            neighbors.forEach(neighborObj => {
                const target = neighborObj.node;
                const weight = neighborObj.weight;

                if (nodePositions[source] && nodePositions[target]) {
                    const line = document.createElementNS(this.svgNS, 'line');
                    line.setAttribute('x1', nodePositions[source].x);
                    line.setAttribute('y1', nodePositions[source].y);
                    line.setAttribute('x2', nodePositions[target].x);
                    line.setAttribute('y2', nodePositions[target].y);
                    line.setAttribute('class', 'edge');
                    if (step.current === source && step.neighbor === target) line.classList.add('highlighted');
                    edgesGroup.appendChild(line);

                    // Edge weight label
                    const midX = (nodePositions[source].x + nodePositions[target].x) / 2;
                    const midY = (nodePositions[source].y + nodePositions[target].y) / 2;
                    const text = document.createElementNS(this.svgNS, 'text');
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY - 5);
                    text.setAttribute('class', 'edge-weight');
                    text.textContent = weight;
                    edgesGroup.appendChild(text);
                }
            });
        });
        svg.appendChild(edgesGroup);

        // Draw nodes
        const nodesGroup = document.createElementNS(this.svgNS, 'g');
        nodesGroup.setAttribute('class', 'nodes');

        nodes.forEach(node => {
            const pos = nodePositions[node];
            const circle = document.createElementNS(this.svgNS, 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 25);
            circle.setAttribute('class', 'node');

            if (step.visited && step.visited.includes(node)) circle.classList.add('visited');
            if (step.current === node) circle.classList.add('current');

            nodesGroup.appendChild(circle);

            const text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y);
            text.setAttribute('class', 'node-label');
            text.textContent = node;
            nodesGroup.appendChild(text);
        });
        svg.appendChild(nodesGroup);

        this.container.appendChild(svg);
    }

    renderTree(step, visualizationData) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // SVG for tree
        const svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '400');
        svg.setAttribute('class', 'tree-svg');

        const tree = step.tree;
        const root = step.root;

        if (!root) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-tree-message';
            emptyMsg.textContent = 'Tree is empty';
            this.container.appendChild(emptyMsg);
            return;
        }

        // Calculate tree layout
        const nodePositions = this.calculateTreeLayout(tree, root);

        // Draw edges
        const edgesGroup = document.createElementNS(this.svgNS, 'g');
        edgesGroup.setAttribute('class', 'tree-edges');

        Object.keys(tree).forEach(nodeValue => {
            const node = tree[nodeValue];
            const pos = nodePositions[nodeValue];

            if (node.left !== null) {
                const childPos = nodePositions[node.left];
                const line = document.createElementNS(this.svgNS, 'line');
                line.setAttribute('x1', pos.x);
                line.setAttribute('y1', pos.y);
                line.setAttribute('x2', childPos.x);
                line.setAttribute('y2', childPos.y);
                line.setAttribute('class', 'tree-edge');
                edgesGroup.appendChild(line);
            }

            if (node.right !== null) {
                const childPos = nodePositions[node.right];
                const line = document.createElementNS(this.svgNS, 'line');
                line.setAttribute('x1', pos.x);
                line.setAttribute('y1', pos.y);
                line.setAttribute('x2', childPos.x);
                line.setAttribute('y2', childPos.y);
                line.setAttribute('class', 'tree-edge');
                edgesGroup.appendChild(line);
            }
        });
        svg.appendChild(edgesGroup);

        // Draw nodes
        const nodesGroup = document.createElementNS(this.svgNS, 'g');
        nodesGroup.setAttribute('class', 'tree-nodes');

        Object.keys(nodePositions).forEach(nodeValue => {
            const pos = nodePositions[nodeValue];

            // Node circle
            const circle = document.createElementNS(this.svgNS, 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 20);
            circle.setAttribute('class', 'tree-node');

            // Highlight current node
            if (step.current === parseInt(nodeValue)) {
                circle.classList.add('current');
            }

            // Highlight path
            if (step.path && step.path.includes(parseInt(nodeValue))) {
                circle.classList.add('in-path');
            }

            nodesGroup.appendChild(circle);

            // Node label
            const text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y);
            text.setAttribute('class', 'tree-node-label');
            text.textContent = nodeValue;
            nodesGroup.appendChild(text);
        });
        svg.appendChild(nodesGroup);

        this.container.appendChild(svg);
    }

    calculateTreeLayout(tree, root) {
        const positions = {};
        const levelWidth = 80;
        const levelHeight = 70;

        const calculatePositions = (nodeValue, depth, leftBound, rightBound) => {
            if (nodeValue === null) return;

            const x = (leftBound + rightBound) / 2;
            const y = 50 + depth * levelHeight;
            positions[nodeValue] = { x, y };

            const node = tree[nodeValue];
            const mid = (leftBound + rightBound) / 2;

            if (node.left !== null) {
                calculatePositions(node.left, depth + 1, leftBound, mid);
            }
            if (node.right !== null) {
                calculatePositions(node.right, depth + 1, mid, rightBound);
            }
        };

        calculatePositions(root, 0, 50, 550);
        return positions;
    }

    renderRecursionTree(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Call stack display
        if (step.call_stack && step.call_stack.length > 0) {
            const stackDisplay = document.createElement('div');
            stackDisplay.className = 'call-stack-display';
            stackDisplay.innerHTML = `<span class="label">Call Stack:</span> <span class="value">${step.call_stack.join(' → ')}</span>`;
            this.container.appendChild(stackDisplay);
        }

        // Current call highlight
        const currentCall = document.createElement('div');
        currentCall.className = 'current-call';
        currentCall.innerHTML = `<span class="label">Current:</span> <span class="value">${step.current_call || '-'}</span>`;
        if (step.result !== undefined) {
            currentCall.innerHTML += ` <span class="result">= ${step.result}</span>`;
        }
        this.container.appendChild(currentCall);
    }

    renderMermaid(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.style.textAlign = 'center';
        mermaidDiv.style.background = 'rgba(255, 255, 255, 0.03)';
        mermaidDiv.style.padding = '20px';
        mermaidDiv.style.borderRadius = '12px';
        mermaidDiv.style.border = '1px solid rgba(0, 255, 234, 0.1)';
        mermaidDiv.textContent = step.diagram || 'graph TD\nA[Start] --> B[Wait]';
        this.container.appendChild(mermaidDiv);

        // Re-initialize mermaid for the new content
        try {
            if (window.mermaid) {
                window.mermaid.init(undefined, mermaidDiv);
            }
        } catch (e) {
            console.error('Mermaid init error:', e);
        }
    }

    renderHashMapSearch(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Targeted Logic Display (The "Mathematical Animation")
        if (step.action === 'check' || step.action === 'found' || step.action === 'add_to_map') {
            const mathDisplay = document.createElement('div');
            mathDisplay.className = 'two-sum-logic';
            const currentNum = step.nums[step.current_idx];
            mathDisplay.innerHTML = `
                <span class="target">Target: ${step.target || 9}</span>
                <span class="minus"> - </span>
                <span class="current-val">${currentNum}</span>
                <span class="equals"> = </span>
                <span class="complement">Wanted: ${step.complement ?? (step.target - currentNum)}</span>
            `;
            this.container.appendChild(mathDisplay);
            if (window.gsap) gsap.from(mathDisplay, { opacity: 0, x: -30, duration: 0.5 });
        }

        // Header for Numbers
        const numsHeader = document.createElement('div');
        numsHeader.className = 'viz-sub-header';
        numsHeader.textContent = 'Input Array';
        this.container.appendChild(numsHeader);

        // Nums container
        const numsContainer = document.createElement('div');
        numsContainer.className = 'array-visualization mini';
        const nums = step.nums || [];
        nums.forEach((num, index) => {
            const item = document.createElement('div');
            item.className = 'array-item';
            if (index === step.current_idx) item.classList.add('current');
            if (index === step.pair_idx) item.classList.add('found');
            item.innerHTML = `<div class="val">${num}</div><div class="idx">${index}</div>`;
            numsContainer.appendChild(item);

            if (window.gsap && index === step.current_idx) {
                gsap.to(item, { y: -5, duration: 0.3, yoyo: true, repeat: 1 });
            }
        });
        this.container.appendChild(numsContainer);

        // Hash Map Display
        const mapHeader = document.createElement('div');
        mapHeader.className = 'viz-sub-header';
        mapHeader.innerHTML = 'Hash Map <span style="font-size: 0.7em; opacity: 0.5; margin-left:10px;">(Previous elements index)</span>';
        this.container.appendChild(mapHeader);

        const mapContainer = document.createElement('div');
        mapContainer.className = 'hash-map-viz';
        const hash_map = step.hash_map || {};
        const entries = Object.entries(hash_map);

        if (entries.length === 0) {
            mapContainer.innerHTML = '<div class="empty-map" style="color: rgba(255,255,255,0.3); padding: 20px;">Hash Map is empty...</div>';
        } else {
            entries.forEach(([val, idx], i) => {
                const entry = document.createElement('div');
                entry.className = 'map-entry';

                // Highlight if it's the complement we're looking for
                if (parseInt(val) === step.complement) {
                    if (step.action === 'found') entry.classList.add('match');
                    else entry.classList.add('searching');
                }

                entry.innerHTML = `<span class="key">${val}</span>: <span class="val">${idx}</span>`;
                mapContainer.appendChild(entry);

                if (window.gsap && i === entries.length - 1 && step.action === 'add_to_map') {
                    gsap.from(entry, { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(1.7)" });
                }
            });
        }
        this.container.appendChild(mapContainer);
    }

    renderGridSearch(step) {
        this.container.innerHTML = '';

        // Description bar with stats
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${step.description}</span>
                <span style="background: rgba(74, 222, 128, 0.2); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(74, 222, 128, 0.4); color: #4ADE80; font-weight: 700;">
                    Islands Found: ${step.count || 0}
                </span>
            </div>
        `;
        this.container.appendChild(description);

        const grid = step.grid || [];
        const rows = grid.length;
        const cols = rows > 0 ? grid[0].length : 0;

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-visualization';
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 40px)`;

        grid.forEach((row, r) => {
            row.forEach((cell, c) => {
                const square = document.createElement('div');
                square.className = 'grid-square';
                if (cell === 1) square.classList.add('land');
                else square.classList.add('water');

                // Check if visited
                const isVisited = step.visited && step.visited.some(v => v[0] === r && v[1] === c);
                if (isVisited) square.classList.add('visited');

                // Current cell
                if (step.current && step.current[0] === r && step.current[1] === c) {
                    square.classList.add('current');
                }

                gridContainer.appendChild(square);

                if (window.gsap && (square.classList.contains('current') || square.classList.contains('visited'))) {
                    gsap.from(square, { scale: 0.5, duration: 0.3 });
                }
            });
        });
        this.container.appendChild(gridContainer);
    }

    renderImage(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        const img = document.createElement('img');
        img.src = step.url;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        img.style.borderRadius = '12px';
        img.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        img.style.border = '1px solid rgba(0, 255, 234, 0.2)';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        this.container.appendChild(img);
    }

    renderConceptual(step) {
        this.container.innerHTML = `
            <div class="viz-description" style="text-align: center; padding: 60px 20px; animation: fadeIn 0.8s ease-out;">
                <div class="viz-icon" style="font-size: 50px; margin-bottom: 25px; filter: drop-shadow(0 0 10px rgba(0, 255, 234, 0.4));">📚</div>
                <h3 style="color: var(--color-light); margin-bottom: 15px; font-size: 24px; letter-spacing: 1px;">Conceptual Overview</h3>
                <p style="color: rgba(243, 244, 244, 0.82); line-height: 1.8; font-size: 16px; max-width: 450px; margin: 0 auto;">
                    This is a general knowledge query. Follow the **detailed explanation** in the right-hand tab for a full breakdown of the concept.
                    <br><br>
                    <span style="color: var(--color-accent); font-style: italic;">The step-by-step logic is highlighted in the Pseudocode panel.</span>
                </p>
            </div>
        `;
    }

    clear() {
        this.container.innerHTML = '<p class="placeholder">Visualization will appear here...</p>';
    }
}

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
            case 'tree':
                return this.renderTree(step, visualizationData);
            case 'recursion_tree':
                return this.renderRecursionTree(step);
            default:
                return this.renderArray(step);
        }
    }

    renderArray(step) {
        this.container.innerHTML = '';

        // Description
        const description = document.createElement('div');
        description.className = 'viz-description';
        description.textContent = step.description;
        this.container.appendChild(description);

        // Array container
        const arrayContainer = document.createElement('div');
        arrayContainer.className = 'array-visualization';

        const array = step.array || [];
        const maxVal = Math.max(...array, 1);

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
            bar.style.height = `${(value / maxVal) * 150}px`;
            bar.textContent = value;

            // Apply state classes
            if (step.comparing_indices && step.comparing_indices.includes(index)) {
                bar.classList.add('comparing');
            }
            if (step.swapped_indices && step.swapped_indices.includes(index)) {
                bar.classList.add('swapped');
            }
            if (step.highlighted_indices && step.highlighted_indices.includes(index)) {
                bar.classList.add('highlighted');
            }
            if (step.sorted_indices && step.sorted_indices.includes(index)) {
                bar.classList.add('sorted');
            }

            barWrapper.appendChild(bar);
            barWrapper.appendChild(indexLabel);
            arrayContainer.appendChild(barWrapper);
        });

        this.container.appendChild(arrayContainer);
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

    clear() {
        this.container.innerHTML = '<p class="placeholder">Visualization will appear here...</p>';
    }
}

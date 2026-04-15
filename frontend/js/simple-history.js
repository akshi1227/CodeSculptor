// Enhanced Activity History - Improved Version
class EnhancedHistory {
    constructor() {
        this.historyContainer = document.getElementById('historyContainer');
        this.searchInput = document.getElementById('historySearch');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Enhanced properties
        this.maxHistoryItems = 100; // Increased from 50
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        this.init();
    }
    
    init() {
        console.log('EnhancedHistory: Initializing...');
        this.loadHistory();
        this.attachEventListeners();
        this.renderHistory();
        
        // Enhanced initialization
        this.setupPagination();
        this.setupAdvancedSearch();
    }
    
    attachEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.handleSearch());
        }
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
        }
        
        // Add test button listener
        const testBtn = document.getElementById('testHistoryBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                console.log('Test button clicked!');
                if (window.simpleHistory) {
                    // Add example bubble sort entry
                    window.simpleHistory.addExecution({
                        input: "array {5,2,4,6,2,1}",
                        pseudocode: "function bubbleSort(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j];\n      }\n    }\n  }\n  return arr;\n}",
                        generatedCode: "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
                        language: "python",
                        duration: 1250
                    });
                    alert('Example bubble sort added to history! Check below in history section.');
                } else {
                    alert('Simple history not available');
                }
            });
        }
    }
    
    // Enhanced methods
    setupPagination() {
        console.log('EnhancedHistory: Setting up pagination');
    }
    
    setupAdvancedSearch() {
        console.log('EnhancedHistory: Setting up advanced search');
    }
    
    getCurrentUser() {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) return 'guest';
        
        try {
            const currentUser = JSON.parse(currentUserStr);
            return currentUser.email || 'guest';
        } catch (e) {
            return currentUserStr || 'guest';
        }
    }
    
    getHistoryKey() {
        const user = this.getCurrentUser();
        return `activity_history_${user}`;
    }
    
    loadHistory() {
        try {
            const historyKey = this.getHistoryKey();
            const historyData = localStorage.getItem(historyKey);
            this.history = historyData ? JSON.parse(historyData) : [];
            console.log('SimpleHistory: Loaded', this.history.length, 'items for user:', this.getCurrentUser());
        } catch (error) {
            console.error('SimpleHistory: Failed to load history:', error);
            this.history = [];
        }
    }
    
    saveHistory() {
        try {
            const historyKey = this.getHistoryKey();
            localStorage.setItem(historyKey, JSON.stringify(this.history));
            console.log('SimpleHistory: Saved', this.history.length, 'items');
        } catch (error) {
            console.error('SimpleHistory: Failed to save history:', error);
        }
    }
    
    addExecution(data) {
        const execution = {
            id: Date.now(),
            input: data.input,
            pseudocode: data.pseudocode || '',
            generatedCode: data.generatedCode || '',
            language: data.language || 'pseudocode',
            timestamp: new Date().toISOString(),
            duration: data.duration || 0
        };
        
        this.history.unshift(execution);
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        this.renderHistory();
        
        console.log('SimpleHistory: Added execution, total items:', this.history.length);
    }
    
    handleSearch() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        
        if (!searchTerm) {
            this.renderHistory();
            return;
        }
        
        const filtered = this.history.filter(item => 
            item.input.toLowerCase().includes(searchTerm) ||
            item.pseudocode.toLowerCase().includes(searchTerm) ||
            item.generatedCode.toLowerCase().includes(searchTerm) ||
            item.language.toLowerCase().includes(searchTerm)
        );
        
        this.renderHistory(filtered);
    }
    
    clearAllHistory() {
        if (confirm('Clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
    
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    loadExecutionIntoInput(execution) {
        const inputField = document.getElementById('naturalLanguageInput');
        if (inputField) {
            inputField.value = execution.input;
            inputField.focus();
        }
    }
    
    createHistoryCard(execution) {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // Truncate long text for display
        const truncatedPseudocode = this.truncateText(execution.pseudocode, 150);
        const truncatedCode = this.truncateText(execution.generatedCode, 150);
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #3776ab; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                        ${execution.language.toUpperCase()}
                    </span>
                    <span style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">
                        ${this.formatTimestamp(execution.timestamp)}
                    </span>
                </div>
                <button onclick="simpleHistory.deleteExecution(${execution.id})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </div>
            
            <div style="color: #e0e0e0; margin-bottom: 8px; font-size: 0.9rem; line-height: 1.4;">
                <strong style="color: #ffffff; display: block; margin-bottom: 4px;">INPUT:</strong>
                <div onclick="simpleHistory.loadExecutionIntoInput(${JSON.stringify(execution).replace(/"/g, '&quot;')})" style="color: #ffffff; cursor: pointer; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.2);">
                    ${this.truncateText(execution.input, 120)}
                </div>
            </div>
            
            ${execution.pseudocode ? `
                <div style="margin-bottom: 8px;">
                    <strong style="color: #ffffff; display: block; margin-bottom: 4px;">PSEUDOCODE:</strong>
                    <div style="color: #f8f9fa; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.3); font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; border-left: 3px solid #3776ab;">
                        ${truncatedPseudocode}
                    </div>
                </div>
            ` : ''}
            
            ${execution.generatedCode ? `
                <div style="margin-bottom: 8px;">
                    <strong style="color: #ffffff; display: block; margin-bottom: 4px;">GENERATED CODE:</strong>
                    <div style="color: #f8f9fa; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.3); font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; border-left: 3px solid #f39c12;">
                        ${truncatedCode}
                    </div>
                </div>
            ` : ''}
            
            ${execution.duration ? `
                <div style="color: #00d4ff; font-size: 0.8rem; text-align: center; padding-top: 8px;">
                    ⏱️ ${execution.duration}ms
                </div>
            ` : ''}
        `;
        
        return card;
    }
    
    renderHistory(items = null) {
        if (!this.historyContainer) return;
        
        const historyToRender = items || this.history;
        
        if (historyToRender.length === 0) {
            this.historyContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <p>No history yet. Generate some visualizations!</p>
                </div>
            `;
            return;
        }
        
        this.historyContainer.innerHTML = '';
        historyToRender.forEach(execution => {
            const card = this.createHistoryCard(execution);
            this.historyContainer.appendChild(card);
        });
    }
    
    deleteExecution(id) {
        if (confirm('Delete this history item?')) {
            this.history = this.history.filter(item => item.id !== id);
            this.saveHistory();
            this.renderHistory();
        }
    }
}

// Initialize enhanced history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing EnhancedHistory...');
    window.enhancedHistory = new EnhancedHistory();
    console.log('EnhancedHistory initialized:', window.enhancedHistory);
});

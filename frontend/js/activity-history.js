// Activity History Manager
class ActivityHistory {
    constructor() {
        this.historyContainer = document.getElementById('historyContainer');
        this.searchInput = document.getElementById('historySearch');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.historySection = document.getElementById('historySection');
        
        this.history = [];
        this.filteredHistory = [];
        
        this.init();
    }
    
    init() {
        console.log('ActivityHistory initializing...');
        console.log('Current user:', this.getCurrentUser());
        
        this.loadHistory();
        this.attachEventListeners();
        this.renderHistory();
        
        console.log('ActivityHistory initialized with history:', this.history);
    }
    
    attachEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
        
        // Add debug button listeners
        const addTestBtn = document.getElementById('addTestHistoryBtn');
        const refreshBtn = document.getElementById('refreshHistoryBtn');
        
        if (addTestBtn) {
            addTestBtn.addEventListener('click', () => {
                if (window.activityHistory) {
                    window.activityHistory.addExecution({
                        input: "Test algorithm: " + new Date().toLocaleTimeString(),
                        pseudocode: "function test() { return true; }",
                        generatedCode: "console.log('test');",
                        language: "javascript",
                        duration: 100
                    });
                    alert('Test history added! Check console for details.');
                } else {
                    alert('Activity history not available');
                }
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (window.activityHistory) {
                    window.activityHistory.loadHistory();
                    window.activityHistory.renderHistory();
                    alert('History refreshed!');
                } else {
                    alert('Activity history not available');
                }
            });
        }
    }
    
    getCurrentUser() {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) return null;
        
        try {
            const currentUser = JSON.parse(currentUserStr);
            return currentUser.email || currentUser;
        } catch (e) {
            return currentUserStr;
        }
    }
    
    getHistoryKey() {
        const user = this.getCurrentUser();
        const key = user ? `activity_history_${user}` : 'activity_history_guest';
        console.log('History key for user', user, ':', key);
        return key;
    }
    
    loadHistory() {
        try {
            const historyKey = this.getHistoryKey();
            const historyData = localStorage.getItem(historyKey);
            console.log('Loading history from key:', historyKey);
            console.log('Raw history data:', historyData);
            
            this.history = historyData ? JSON.parse(historyData) : [];
            this.filteredHistory = [...this.history];
            
            console.log('Parsed history:', this.history);
        } catch (error) {
            console.error('Failed to load history:', error);
            this.history = [];
            this.filteredHistory = [];
        }
    }
    
    saveHistory() {
        try {
            const historyKey = this.getHistoryKey();
            console.log('Saving history to key:', historyKey);
            console.log('History data being saved:', this.history);
            
            localStorage.setItem(historyKey, JSON.stringify(this.history));
            console.log('History saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save history:', error);
            return false;
        }
    }
    
    addExecution(data) {
        console.log('ActivityHistory.addExecution called with:', data);
        
        const execution = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            input: data.input,
            pseudocode: data.pseudocode || '',
            generatedCode: data.generatedCode || '',
            language: data.language || 'pseudocode',
            timestamp: new Date().toISOString(),
            duration: data.duration || 0
        };
        
        this.history.unshift(execution); // Add to beginning (latest first)
        
        // Keep only last 50 executions per user
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        this.handleSearch(); // Re-render with current search filter
        
        console.log('History after adding:', this.history);
    }
    
    deleteExecution(id) {
        if (confirm('Are you sure you want to delete this history item?')) {
            this.history = this.history.filter(item => item.id !== id);
            this.saveHistory();
            this.handleSearch(); // Re-render with current search filter
        }
    }
    
    clearAllHistory() {
        if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.handleSearch();
        }
    }
    
    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredHistory = [...this.history];
        } else {
            this.filteredHistory = this.history.filter(item => 
                item.input.toLowerCase().includes(searchTerm) ||
                item.pseudocode.toLowerCase().includes(searchTerm) ||
                item.generatedCode.toLowerCase().includes(searchTerm) ||
                item.language.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderHistory();
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.handleSearch();
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }
    
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    loadExecutionIntoInput(execution) {
        const inputField = document.getElementById('naturalLanguageInput');
        const languageSelect = document.getElementById('languageSelect');
        
        if (inputField) {
            inputField.value = execution.input;
            inputField.focus();
        }
        
        if (languageSelect && execution.language) {
            languageSelect.value = execution.language;
        }
        
        // Scroll to input
        inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    createHistoryCard(execution) {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.dataset.id = execution.id;
        
        const languageColors = {
            'pseudocode': '#6366f1',
            'python': '#3776ab',
            'javascript': '#f7df1e',
            'java': '#f89820',
            'cpp': '#00599c'
        };
        
        const languageColor = languageColors[execution.language] || '#6b7280';
        
        card.innerHTML = `
            <div class="history-card-header">
                <div class="history-card-meta">
                    <span class="history-language" style="background-color: ${languageColor}">
                        ${execution.language.toUpperCase()}
                    </span>
                    <span class="history-time">${this.formatTimestamp(execution.timestamp)}</span>
                </div>
                <button class="history-delete-btn" onclick="activityHistory.deleteExecution('${execution.id}')" title="Delete">
                    🗑️
                </button>
            </div>
            <div class="history-card-content">
                <div class="history-input" onclick="activityHistory.loadExecutionIntoInput(${JSON.stringify(execution).replace(/"/g, '&quot;')})">
                    <strong>Input:</strong> ${this.truncateText(execution.input)}
                </div>
                ${execution.pseudocode ? `
                    <div class="history-pseudocode">
                        <strong>Pseudocode:</strong> ${this.truncateText(execution.pseudocode, 80)}
                    </div>
                ` : ''}
                ${execution.generatedCode ? `
                    <div class="history-code">
                        <strong>Generated Code:</strong> ${this.truncateText(execution.generatedCode, 80)}
                    </div>
                ` : ''}
            </div>
            ${execution.duration ? `
                <div class="history-duration">
                    ⏱️ ${execution.duration}ms
                </div>
            ` : ''}
        `;
        
        return card;
    }
    
    renderHistory() {
        console.log('renderHistory called, filteredHistory length:', this.filteredHistory.length);
        
        if (!this.historyContainer) {
            console.error('History container not found!');
            return;
        }
        
        if (this.filteredHistory.length === 0) {
            console.log('Showing placeholder, total history length:', this.history.length);
            this.historyContainer.innerHTML = `
                <div class="history-placeholder">
                    <p>${this.history.length === 0 ? 
                        'No activity history yet. Start generating visualizations to see your history here!' : 
                        'No history items match your search criteria.'}</p>
                </div>
            `;
            return;
        }
        
        console.log('Rendering', this.filteredHistory.length, 'history cards');
        this.historyContainer.innerHTML = '';
        
        this.filteredHistory.forEach(execution => {
            const card = this.createHistoryCard(execution);
            this.historyContainer.appendChild(card);
        });
        
        console.log('History container children count:', this.historyContainer.children.length);
    }
}

// Initialize activity history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.activityHistory = new ActivityHistory();
});

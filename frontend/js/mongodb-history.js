// MongoDB Enhanced History System
class MongoDBHistory {
    constructor() {
        this.historyContainer = document.getElementById('historyContainer');
        this.searchInput = document.getElementById('historySearch');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Enhanced properties
        this.maxHistoryItems = 200;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.token = this.getStoredToken();
        
        this.init();
    }
    
    init() {
        console.log('MongoDBHistory: Initializing...');
        this.attachEventListeners();
        this.loadHistory();
    }
    
    getStoredToken() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) return null;
        
        try {
            const user = JSON.parse(userData);
            return user.token || null;
        } catch (e) {
            return null;
        }
    }
    
    async makeApiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        console.log(`MongoDBHistory: API call to ${url}`);
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers,
                body: options.body ? JSON.stringify(options.body) : null
            });
            
            console.log(`MongoDBHistory: Response status ${response.status}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('MongoDBHistory: API request failed:', error);
            throw error;
        }
    }
    
    attachEventListeners() {
        // Simple search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filterHistory(term);
            });
        }
    }
    
    filterHistory(term) {
        if (!term) {
            this.renderHistory();
            return;
        }
        const filtered = this.history.filter(item => 
            item.input.toLowerCase().includes(term) ||
            (item.language && item.language.toLowerCase().includes(term))
        );
        this.renderFiltered(filtered);
    }
    
    renderFiltered(items) {
        if (!this.historyContainer) return;
        this.historyContainer.innerHTML = '';
        items.forEach(execution => {
            const card = this.createHistoryCard(execution);
            this.historyContainer.appendChild(card);
        });
    }
    
    async loadHistory() {
        console.log('MongoDBHistory: Loading history from API...');
        try {
            const result = await this.makeApiRequest('/get-history', {
                method: 'GET'
            });
            
            console.log('MongoDBHistory: API result:', result);
            
            if (result.success) {
                this.history = result.history || [];
                this.totalItems = result.total || 0;
                this.totalPages = result.total_pages || 1;
                console.log(`MongoDBHistory: Loaded ${this.history.length} items`);
                this.renderHistory();
            } else {
                console.error('MongoDBHistory: Failed to load history:', result.error);
                this.history = [];
                this.renderHistory();
            }
        } catch (error) {
            console.error('MongoDBHistory: Error loading history:', error);
            alert('History load error: ' + error.message);
            this.history = [];
            this.renderHistory();
        }
    }
    
    async addExecution(data) {
        try {
            const result = await this.makeApiRequest('/save-history', {
                method: 'POST',
                body: data
            });
            
            if (result.success) {
                // Add to local cache immediately with the data we sent
                const historyItem = {
                    ...data,
                    _id: result.item_id || Date.now().toString(),
                    created_at: new Date().toISOString()
                };
                this.history.unshift(historyItem);
                if (this.history.length > this.maxHistoryItems) {
                    this.history = this.history.slice(0, this.maxHistoryItems);
                }
                this.totalItems++;
                this.renderHistory();
                this.updatePaginationInfo();
                this.updateHistoryStats();
                
                console.log('MongoDBHistory: Added execution, total items:', this.history.length);
                return true;
            } else {
                console.error('MongoDBHistory: Failed to add history:', result.error);
                return false;
            }
        } catch (error) {
            console.error('MongoDBHistory: Error adding execution:', error);
            return false;
        }
    }
    
    async deleteExecution(id) {
        if (confirm('Delete this history item? This action cannot be undone.')) {
            try {
                const result = await this.makeApiRequest(`/history/${id}`, {
                    method: 'DELETE'
                });
                
                if (result.success) {
                    this.history = this.history.filter(item => item._id !== id);
                    this.totalItems--;
                    this.renderHistory();
                    this.updatePaginationInfo();
                    this.updateHistoryStats();
                    console.log('MongoDBHistory: Deleted item:', id);
                } else {
                    this.showError('Failed to delete item: ' + result.error);
                }
            } catch (error) {
                console.error('MongoDBHistory: Error deleting item:', error);
                this.showError('Error deleting item: ' + error.message);
            }
        }
    }
    
    async clearAllHistory() {
        if (confirm('Clear all history? This will permanently delete all your activity history and cannot be undone.')) {
            try {
                const result = await this.makeApiRequest('/history/clear', {
                    method: 'DELETE'
                });
                
                if (result.success) {
                    this.history = [];
                    this.totalItems = 0;
                    this.currentPage = 1;
                    this.renderHistory();
                    this.updatePaginationInfo();
                    this.updateHistoryStats();
                    console.log('MongoDBHistory: Cleared all history');
                } else {
                    this.showError('Failed to clear history: ' + result.error);
                }
            } catch (error) {
                console.error('MongoDBHistory: Error clearing history:', error);
                this.showError('Error clearing history: ' + error.message);
            }
        }
    }
    
    async handleSearch() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('search', searchTerm);
        url.searchParams.delete('page'); // Reset to page 1
        window.history.pushState({}, '', url.toString());
        
        // Reload history with search
        this.currentPage = 1;
        await this.loadHistory();
    }
    
    async applyFilters() {
        const languageFilter = document.getElementById('languageFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const hasCodeFilter = document.getElementById('hasCodeFilter').checked;
        const hasPseudocodeFilter = document.getElementById('hasPseudocodeFilter').checked;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('language', languageFilter);
        url.searchParams.set('date_range', dateFilter);
        url.searchParams.set('has_code', hasCodeFilter);
        url.searchParams.set('has_pseudocode', hasPseudocodeFilter);
        url.searchParams.delete('page'); // Reset to page 1
        window.history.pushState({}, '', url.toString());
        
        // Reload history with filters
        this.currentPage = 1;
        await this.loadHistory();
    }
    
    resetFilters() {
        document.getElementById('languageFilter').value = '';
        document.getElementById('dateFilter').value = '';
        document.getElementById('hasCodeFilter').checked = false;
        document.getElementById('hasPseudocodeFilter').checked = false;
        
        // Clear all URL params
        const url = new URL(window.location);
        url.searchParams.delete('language');
        url.searchParams.delete('date_range');
        url.searchParams.delete('has_code');
        url.searchParams.delete('has_pseudocode');
        url.searchParams.delete('search');
        url.searchParams.delete('page');
        window.history.pushState({}, '', url.toString());
        
        // Reload history
        this.currentPage = 1;
        this.loadHistory();
    }
    
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            const url = new URL(window.location);
            url.searchParams.set('page', this.currentPage);
            window.history.pushState({}, '', url.toString());
            await this.loadHistory();
        }
    }
    
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            const url = new URL(window.location);
            url.searchParams.set('page', this.currentPage);
            window.history.pushState({}, '', url.toString());
            await this.loadHistory();
        }
    }
    
    setupPagination() {
        // Minimal pagination - no complex controls added
        console.log('Pagination setup (minimal)');
    }
    
    setupAdvancedSearch() {
        // Minimal search - no extra filters
        console.log('Advanced search (minimal)');
    }
    
    setupHistoryStats() {
        // Simple stats display only
        console.log('History stats (minimal)');
    }
    
    async updateHistoryStats() {
        // Disabled - no stats endpoint in simple API
        // console.log('MongoDBHistory: Stats update skipped (no endpoint)');
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
        if (diffDays < 30) return date.toLocaleDateString();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    loadExecutionIntoInput(execution) {
        // Load the input
        const inputField = document.getElementById('naturalLanguageInput');
        const languageSelect = document.getElementById('languageSelect');
        
        if (inputField) {
            inputField.value = execution.input;
            inputField.focus();
        }
        
        if (languageSelect && execution.language) {
            languageSelect.value = execution.language;
        }
        
        // If we have full data stored, reload the visualization
        if (window.codeSculptor && execution.pseudocode && execution.generated_code) {
            console.log('Reloading full visualization from history:', execution);
            
            // Create a result object like the convert API returns
            const result = {
                success: true,
                pseudocode: execution.pseudocode,
                code: execution.generated_code,
                language: execution.language || 'pseudocode',
                steps: execution.steps || this.parsePseudocodeToSteps(execution.pseudocode),
                visualization: execution.visualization || null,
                complexity: execution.complexity || 'O(n)',
                explanation: execution.explanation || '',
                explanation_why: execution.explanation_why || '',
                ai_hints: execution.ai_hints || '',
                real_world_map: execution.real_world_map || '',
                comparison: execution.comparison || '',
                algorithm: execution.algorithm || 'Algorithm'
            };
            
            // Reload the visualization
            window.codeSculptor.reloadFromHistory(result);
            
            console.log('Loaded from history:', execution.input);
        } else {
            console.log('History item has partial data - input loaded only');
        }
    }
    
    parsePseudocodeToSteps(pseudocode) {
        // Parse pseudocode text into steps array
        if (!pseudocode) return [];
        
        const lines = pseudocode.split('\n').filter(line => line.trim());
        return lines.map((line, index) => ({
            line_number: index + 1,
            content: line.trim(),
            type: this.getStepType(line.trim())
        }));
    }
    
    getStepType(line) {
        const lower = line.toLowerCase();
        if (lower.includes('for') || lower.includes('while') || lower.includes('loop')) return 'loop';
        if (lower.includes('if') || lower.includes('else')) return 'conditional';
        if (lower.includes('return')) return 'return';
        if (lower.includes('function') || lower.includes('def ')) return 'function';
        if (lower.includes('start') || lower.includes('begin')) return 'start';
        if (lower.includes('end')) return 'end';
        return 'action';
    }
    
    exportHistoryItem(execution) {
        // Create comprehensive export data
        const exportData = {
            title: execution.input,
            language: execution.language || 'pseudocode',
            timestamp: execution.timestamp,
            duration_ms: execution.duration,
            
            pseudocode: execution.pseudocode || 'Not available',
            generated_code: execution.generated_code || 'Not available',
            
            complexity: execution.complexity || 'Not analyzed',
            explanation: execution.explanation || '',
            explanation_why: execution.explanation_why || '',
            ai_hints: execution.ai_hints || '',
            real_world_applications: execution.real_world_map || '',
            comparison: execution.comparison || '',
            
            visualization_data: execution.visualization || null,
            algorithm_name: execution.algorithm || 'Unknown'
        };
        
        // Create and download the file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `codesculptor_${execution.input.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Exported:', execution.input);
    }
    
    downloadPseudocodeText(execution) {
        if (!execution.pseudocode) {
            alert('No pseudocode available for this item');
            return;
        }
        
        // Create text content with header
        const content = `
========================================
PSEUDOCODE: ${execution.input}
Language: ${execution.language || 'pseudocode'}
Generated: ${new Date(execution.timestamp).toLocaleString()}
Complexity: ${execution.complexity || 'Not analyzed'}
========================================

${execution.pseudocode}

========================================
Generated by CodeSculptor
========================================
`;
        
        // Create and download file
        const blob = new Blob([content.trim()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pseudocode_${execution.input.replace(/\s+/g, '_').toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Pseudocode downloaded:', execution.input);
    }
    
    async downloadCode(id) {
        try {
            const url = `${this.apiBaseUrl}/history/download/${id}?type=code`;
            const link = document.createElement('a');
            link.href = url;
            link.download = `code_${id}.txt`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('MongoDBHistory: Error downloading code:', error);
            this.showError('Error downloading code: ' + error.message);
        }
    }
    
    async exportAllHistory() {
        try {
            const url = `${this.apiBaseUrl}/history/export`;
            const link = document.createElement('a');
            link.href = url;
            link.download = `codesculptor_history_${new Date().toISOString().split('T')[0]}.json`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('MongoDBHistory: Error exporting history:', error);
            this.showError('Error exporting history: ' + error.message);
        }
    }
    
    createHistoryCard(execution) {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        card.onmouseenter = () => card.style.background = 'rgba(255, 255, 255, 0.08)';
        card.onmouseleave = () => card.style.background = 'rgba(255, 255, 255, 0.05)';
        
        const languageColors = {
            'javascript': '#f7df1e',
            'python': '#3776ab',
            'java': '#f89820',
            'cpp': '#00599c',
            'pseudocode': '#6366f1'
        };
        
        const lang = execution.language || 'pseudocode';
        const langColor = languageColors[lang] || '#6b7280';
        
        const execJson = JSON.stringify(execution).replace(/"/g, '&quot;');
        const hasPseudocode = execution.pseudocode && execution.pseudocode.trim().length > 0;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: ${langColor}; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem; font-weight: 600;">
                        ${lang.toUpperCase()}
                    </span>
                    <span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;">
                        ${this.formatTimestamp(execution.timestamp)}
                    </span>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button onclick="event.stopPropagation(); window.mongoDBHistory.loadExecutionIntoInput(${execJson})" 
                        style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px;"
                        onmouseover="this.style.color='rgba(255,255,255,0.9)'; this.style.borderColor='rgba(255,255,255,0.4)'" 
                        onmouseout="this.style.color='rgba(255,255,255,0.6)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                        ↻ Load
                    </button>
                    ${hasPseudocode ? `
                    <button onclick="event.stopPropagation(); window.mongoDBHistory.downloadPseudocodeText(${execJson})" 
                        style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #86efac; cursor: pointer; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px;"
                        onmouseover="this.style.background='rgba(34,197,94,0.25)'; this.style.color='#bbf7d0'" 
                        onmouseout="this.style.background='rgba(34,197,94,0.15)'; this.style.color='#86efac'">
                        📄 Pseudocode
                    </button>
                    ` : ''}
                    <button onclick="event.stopPropagation(); window.mongoDBHistory.exportHistoryItem(${execJson})" 
                        style="background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); color: #a5b4fc; cursor: pointer; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px;"
                        onmouseover="this.style.background='rgba(99,102,241,0.3)'; this.style.color='#c7d2fe'" 
                        onmouseout="this.style.background='rgba(99,102,241,0.2)'; this.style.color='#a5b4fc'">
                        ⬇ Export All
                    </button>
                </div>
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.9rem; line-height: 1.4;" onclick="window.mongoDBHistory.loadExecutionIntoInput(${execJson})">
                ${this.truncateText(execution.input, 120)}
            </div>
        `;
        
        return card;
    }
    
    renderHistory() {
        console.log('MongoDBHistory: renderHistory called, container:', this.historyContainer);
        console.log('MongoDBHistory: history array:', this.history);
        
        if (!this.historyContainer) {
            console.error('MongoDBHistory: History container not found!');
            alert('Error: History container not found in DOM');
            return;
        }
        
        if (!this.history || this.history.length === 0) {
            console.log('MongoDBHistory: No history to render');
            this.historyContainer.innerHTML = `
                <div class="history-empty-state" style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.7;">📚</div>
                    <p style="font-size: 0.95rem; margin: 0;">No history yet</p>
                    <p style="font-size: 0.8rem; margin-top: 8px; opacity: 0.6;">Generate algorithms to see them here</p>
                </div>
            `;
            return;
        }
        
        // Clear and render history
        this.historyContainer.innerHTML = '';
        
        // Add history items
        this.history.forEach((execution, index) => {
            console.log(`MongoDBHistory: Rendering item ${index}:`, execution.input);
            const card = this.createHistoryCard(execution);
            this.historyContainer.appendChild(card);
        });
        
        console.log('MongoDBHistory: Rendered', this.history.length, 'items');
    }
    
    updatePaginationInfo() {
        const currentPageInfo = document.getElementById('currentPageInfo');
        const totalPagesInfo = document.getElementById('totalPagesInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (currentPageInfo) currentPageInfo.textContent = this.currentPage;
        if (totalPagesInfo) totalPagesInfo.textContent = this.totalPages || 1;
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= (this.totalPages || 1);
    }
    
    async addTestHistory() {
        const sampleData = [
            {
                input: "Sort array using bubble sort",
                pseudocode: "function bubbleSort(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j];\n      }\n    }\n  }\n  return arr;\n}",
                generated_code: "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
                language: "python",
                duration: 850,
                success: true
            },
            {
                input: "Find maximum element in array",
                pseudocode: "function findMax(arr) {\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > max) {\n      max = arr[i];\n    }\n  }\n  return max;\n}",
                generated_code: "function find_max(arr):\n    max_val = arr[0]\n    for val in arr:\n        if val > max_val:\n            max_val = val\n    return max_val",
                language: "javascript",
                duration: 650,
                success: true
            },
            {
                input: "Binary search tree implementation",
                pseudocode: "class Node:\n  constructor(value) {\n    this.value = value\n    this.left = null\n    this.right = null\n  }\n\nclass BinaryTree:\n  constructor() {\n    this.root = null\n  }\n\nfunction insert(root, value) {\n  const newNode = new Node(value)\n  if (!root) {\n    root = newNode\n  } else {\n    insertRec(root, value)\n  }\n}\n\nfunction insertRec(node, value) {\n  if (value < node.value) {\n    node.left = insertRec(node.left, value)\n  } else {\n    node.right = insertRec(node.right, value)\n  }\n  return node\n}\n\nfunction search(root, value) {\n  return searchRec(root, value)\n}\n\nfunction searchRec(node, value) {\n  if (!node) {\n    return false\n  }\n  if (value === node.value) {\n    return true\n  }\n  if (value < node.value) {\n    return searchRec(node.left, value)\n  }\n  return searchRec(node.right, value)\n}",
                generated_code: "class BinarySearchTree:\n  def __init__(self):\n        self.root = None\n    \n    def insert(self, value):\n        new_node = Node(value)\n        if not self.root:\n            self.root = new_node\n        else:\n            self._insert(self.root, new_node)\n    \n    def _insert(self, node, value):\n        if value < node.value:\n            node.left = self._insert(node.left, value)\n        else:\n            node.right = self._insert(node.right, value)\n        return node\n    \n    def search(self, value):\n        return self._search(self.root, value)\n    \n    def _search(self, node, value):\n        if not node:\n            return False\n        if value == node.value:\n            return True\n        if value < node.value:\n            return self._search(node.left, value)\n        return self._search(node.right, value)",
                language: "python",
                duration: 1200,
                success: true
            }
        ];
        
        for (const item of sampleData) {
            await this.addExecution(item);
        }
        
        alert('Generated 3 sample history items for testing!');
    }
    
    showError(message) {
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize MongoDB history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing MongoDBHistory...');
    window.mongoDBHistory = new MongoDBHistory();
    console.log('MongoDBHistory initialized:', window.mongoDBHistory);
});

// Enhanced Activity History - Improved Version
class EnhancedHistory {
    constructor() {
        this.historyContainer = document.getElementById('historyContainer');
        this.searchInput = document.getElementById('historySearch');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Enhanced properties
        this.maxHistoryItems = 200; // Increased from 50
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchFilters = {
            language: false,
            dateRange: false,
            hasCode: false,
            hasPseudocode: false
        };
        
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
        this.setupHistoryStats();
    }
    
    getCurrentUser() {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) return 'guest';
        
        try {
            const currentUser = JSON.parse(currentUserStr);
            return currentUser.email || currentUser;
        } catch (e) {
            return currentUserStr || 'guest';
        }
    }
    
    getHistoryKey() {
        const user = this.getCurrentUser();
        const key = `activity_history_${user}`;
        console.log('EnhancedHistory: History key for user', user, ':', key);
        return key;
    }
    
    loadHistory() {
        try {
            const historyKey = this.getHistoryKey();
            const historyData = localStorage.getItem(historyKey);
            this.history = historyData ? JSON.parse(historyData) : [];
            console.log('EnhancedHistory: Loaded', this.history.length, 'items for user:', this.getCurrentUser());
        } catch (error) {
            console.error('EnhancedHistory: Failed to load history:', error);
            this.history = [];
        }
    }
    
    saveHistory() {
        try {
            const historyKey = this.getHistoryKey();
            localStorage.setItem(historyKey, JSON.stringify(this.history));
            console.log('EnhancedHistory: Saved', this.history.length, 'items');
            return true;
        } catch (error) {
            console.error('EnhancedHistory: Failed to save history:', error);
            return false;
        }
    }
    
    addExecution(data) {
        const execution = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            input: data.input,
            pseudocode: data.pseudocode || '',
            generatedCode: data.generatedCode || '',
            language: data.language || 'pseudocode',
            timestamp: new Date().toISOString(),
            duration: data.duration || 0,
            success: data.success !== false,
            error: data.error || null
        };
        
        this.history.unshift(execution);
        
        // Keep only last max items
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }
        
        const saved = this.saveHistory();
        if (saved) {
            this.renderHistory();
            this.updateHistoryStats();
        }
        
        console.log('EnhancedHistory: Added execution, total items:', this.history.length);
    }
    
    deleteExecution(id) {
        if (confirm('Delete this history item? This action cannot be undone.')) {
            this.history = this.history.filter(item => item.id !== id);
            this.saveHistory();
            this.renderHistory();
            this.updateHistoryStats();
        }
    }
    
    clearAllHistory() {
        if (confirm('Clear all history? This will permanently delete all your activity history and cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            this.updateHistoryStats();
        }
    }
    
    handleSearch() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        
        if (!searchTerm) {
            this.searchFilters = {
                language: false,
                dateRange: false,
                hasCode: false,
                hasPseudocode: false
            };
            this.renderHistory();
            return;
        }
        
        // Apply search filters
        this.filteredHistory = this.history.filter(item => 
            item.input.toLowerCase().includes(searchTerm) ||
            item.pseudocode.toLowerCase().includes(searchTerm) ||
            item.generatedCode.toLowerCase().includes(searchTerm) ||
            item.language.toLowerCase().includes(searchTerm)
        );
        
        this.currentPage = 1; // Reset to first page when searching
        this.renderHistory();
    }
    
    setupPagination() {
        // Add pagination controls to history section
        const existingControls = document.querySelector('.history-controls');
        
        if (existingControls) {
            const paginationHtml = `
                <div class="pagination-controls" style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                    <button id="prevPageBtn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;">
                        ← Previous
                    </button>
                    <span style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                        Page <span id="currentPageInfo">1</span> of <span id="totalPagesInfo">1</span>
                    </span>
                    <button id="nextPageBtn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;">
                        Next →
                    </button>
                </div>
            `;
            
            existingControls.insertAdjacentHTML('beforeend', paginationHtml);
            
            // Add pagination event listeners
            document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
            document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());
        }
    }
    
    setupAdvancedSearch() {
        // Add advanced search controls
        const existingControls = document.querySelector('.history-controls');
        
        if (existingControls) {
            const searchHtml = `
                <div class="advanced-search" style="margin-top: 10px; display: flex; gap: 10px; align-items: center;">
                    <select id="languageFilter" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.9rem;">
                        <option value="">All Languages</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="pseudocode">Pseudocode</option>
                    </select>
                    
                    <select id="dateFilter" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.9rem;">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    
                    <label style="display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                        <input type="checkbox" id="hasCodeFilter"> Has Generated Code
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                        <input type="checkbox" id="hasPseudocodeFilter"> Has Pseudocode
                    </label>
                    
                    <button id="resetFiltersBtn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;">
                        Reset Filters
                    </button>
                </div>
            `;
            
            existingControls.insertAdjacentHTML('beforeend', searchHtml);
            
            // Add advanced search event listeners
            document.getElementById('languageFilter').addEventListener('change', () => this.applyFilters());
            document.getElementById('dateFilter').addEventListener('change', () => this.applyFilters());
            document.getElementById('hasCodeFilter').addEventListener('change', () => this.applyFilters());
            document.getElementById('hasPseudocodeFilter').addEventListener('change', () => this.applyFilters());
            document.getElementById('resetFiltersBtn').addEventListener('click', () => this.resetFilters());
        }
    }
    
    applyFilters() {
        const languageFilter = document.getElementById('languageFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const hasCodeFilter = document.getElementById('hasCodeFilter').checked;
        const hasPseudocodeFilter = document.getElementById('hasPseudocodeFilter').checked;
        
        this.searchFilters = {
            language: languageFilter !== '',
            dateRange: dateFilter !== '',
            hasCode: hasCodeFilter,
            hasPseudocode: hasPseudocodeFilter
        };
        
        this.currentPage = 1; // Reset to first page when applying filters
        this.renderHistory();
    }
    
    resetFilters() {
        document.getElementById('languageFilter').value = '';
        document.getElementById('dateFilter').value = '';
        document.getElementById('hasCodeFilter').checked = false;
        document.getElementById('hasPseudocodeFilter').checked = false;
        
        this.applyFilters();
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderHistory();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.getFilteredHistory().length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderHistory();
        }
    }
    
    getFilteredHistory() {
        let filtered = this.history;
        
        // Apply active search term
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.input.toLowerCase().includes(searchTerm) ||
                item.pseudocode.toLowerCase().includes(searchTerm) ||
                item.generatedCode.toLowerCase().includes(searchTerm) ||
                item.language.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply advanced filters
        if (this.searchFilters.language) {
            filtered = filtered.filter(item => item.language === this.searchFilters.language);
        }
        
        if (this.searchFilters.hasCode) {
            filtered = filtered.filter(item => item.generatedCode && item.generatedCode.trim() !== '');
        }
        
        if (this.searchFilters.hasPseudocode) {
            filtered = filtered.filter(item => item.pseudocode && item.pseudocode.trim() !== '');
        }
        
        // Apply date range filter
        if (this.searchFilters.dateRange) {
            const now = new Date();
            const filterDate = new Date();
            
            switch (this.searchFilters.dateRange) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth());
                    filterDate.setDate(1);
                    break;
                case 'year':
                    filterDate.setFullYear(now.getFullYear());
                    filterDate.setMonth(0);
                    filterDate.setDate(1);
                    break;
            }
            
            filtered = filtered.filter(item => new Date(item.timestamp) >= filterDate);
        }
        
        return filtered;
    }
    
    setupHistoryStats() {
        // Add history statistics display
        const existingControls = document.querySelector('.history-controls');
        
        if (existingControls) {
            const statsHtml = `
                <div class="history-stats" style="margin-top: 10px; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.9);">
                        <strong>📊 History Stats</strong><br>
                        Total: <span id="totalItems">0</span> items | 
                        This Month: <span id="monthlyItems">0</span> items
                    </div>
                </div>
            `;
            
            existingControls.insertAdjacentHTML('beforeend', statsHtml);
        }
    }
    
    updateHistoryStats() {
        const totalItems = document.getElementById('totalItems');
        const monthlyItems = document.getElementById('monthlyItems');
        
        if (totalItems) totalItems.textContent = this.history.length;
        
        if (monthlyItems) {
            const now = new Date();
            const thisMonth = this.history.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.getMonth() === now.getMonth() && 
                       itemDate.getFullYear() === now.getFullYear();
            }).length;
            monthlyItems.textContent = thisMonth.length;
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
        if (diffDays < 30) return date.toLocaleDateString();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
    }
    
    createHistoryCard(execution) {
        const card = document.createElement('div');
        card.className = 'history-card enhanced';
        card.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            position: relative;
        `;
        
        // Enhanced card content
        const hasError = execution.error || execution.success === false;
        const cardOpacity = hasError ? '0.7' : '1';
        
        const languageColors = {
            'javascript': '#f7df1e',
            'python': '#3776ab',
            'java': '#f89820',
            'cpp': '#00599c',
            'pseudocode': '#6366f1'
        };
        
        card.innerHTML = `
            <div class="history-card-header">
                <div class="history-card-meta">
                    <div class="history-card-left">
                        <span class="history-language" style="background-color: ${languageColors[execution.language] || '#6b7280'};">
                            ${execution.language ? execution.language.toUpperCase() : 'PSEUDO'}
                        </span>
                        <span class="history-time">${this.formatTimestamp(execution.timestamp)}</span>
                        ${hasError ? '<span class="history-error">❌ Error</span>' : '<span class="history-success">✅ Success</span>'}
                    </div>
                    <div class="history-card-right">
                        <button class="history-delete-btn" onclick="enhancedHistory.deleteExecution('${execution.id}')" title="Delete item">
                            🗑️
                        </button>
                        <button class="history-reload-btn" onclick="enhancedHistory.loadExecutionIntoInput(${JSON.stringify(execution).replace(/"/g, '&quot;')})" title="Load into input">
                            🔄 Reload
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="history-card-content" style="opacity: ${cardOpacity};">
                <div class="history-input-section">
                    <strong style="color: #ffffff; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                        INPUT:
                    </strong>
                    <div class="history-input-text" onclick="enhancedHistory.loadExecutionIntoInput(${JSON.stringify(execution).replace(/"/g, '&quot;')})">
                        ${this.truncateText(execution.input, 150)}
                    </div>
                </div>
                
                ${execution.pseudocode ? `
                    <div class="history-code-section">
                        <strong style="color: #ffffff; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                            PSEUDOCODE:
                        </strong>
                        <div class="history-code-content">
                            <pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border-left: 3px solid #6366f1; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; overflow-x: auto; white-space: pre-wrap;">${this.truncateText(execution.pseudocode, 200)}</pre>
                        </div>
                    </div>
                ` : ''}
                
                ${execution.generatedCode ? `
                    <div class="history-code-section">
                        <strong style="color: #ffffff; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                            GENERATED CODE (${execution.language.toUpperCase()}):
                        </strong>
                        <div class="history-code-content">
                            <pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border-left: 3px solid ${languageColors[execution.language] || '#6b7280'}; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; overflow-x: auto; white-space: pre-wrap;">${this.truncateText(execution.generatedCode, 200)}</pre>
                        </div>
                    </div>
                ` : ''}
                
                ${execution.error ? `
                    <div class="history-error-section">
                        <strong style="color: #ff6b6b; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                            ERROR:
                        </strong>
                        <div class="history-error-content">
                            ${execution.error}
                        </div>
                    </div>
                ` : ''}
                
                <div class="history-card-footer">
                    <div class="history-duration">
                        ⏱️ ${execution.duration}ms
                    </div>
                    <div class="history-actions">
                        <button class="history-export-btn" onclick="enhancedHistory.exportExecution('${execution.id}')" title="Export item">
                            📤 Export
                        </button>
                        <button class="history-share-btn" onclick="enhancedHistory.shareExecution('${execution.id}')" title="Share item">
                            🔗 Share
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    renderHistory() {
        if (!this.historyContainer) {
            console.error('EnhancedHistory: History container not found!');
            return;
        }
        
        const filteredHistory = this.getFilteredHistory();
        const totalPages = Math.ceil(filteredHistory.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, filteredHistory.length);
        const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
        
        if (filteredHistory.length === 0) {
            this.historyContainer.innerHTML = `
                <div class="history-empty-state" style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📚</div>
                    <h3>No history found</h3>
                    <p>Try generating some visualizations to see your activity history here!</p>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" onclick="enhancedHistory.generateSampleData()" style="padding: 12px 24px; font-size: 1rem;">
                            🎯 Generate Sample Data
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Clear and render history
        this.historyContainer.innerHTML = '';
        
        // Add history items
        paginatedHistory.forEach((execution, index) => {
            const card = this.createHistoryCard(execution);
            this.historyContainer.appendChild(card);
            
            // Animate card appearance
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // Update pagination info
        this.updatePaginationInfo(totalPages, paginatedHistory.length);
        
        // Update stats
        this.updateHistoryStats();
        
        console.log('EnhancedHistory: Rendered', paginatedHistory.length, 'items on page', this.currentPage);
    }
    
    updatePaginationInfo(totalPages, currentItemCount) {
        const currentPageInfo = document.getElementById('currentPageInfo');
        const totalPagesInfo = document.getElementById('totalPagesInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (currentPageInfo) currentPageInfo.textContent = this.currentPage;
        if (totalPagesInfo) totalPagesInfo.textContent = totalPages;
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }
    
    generateSampleData() {
        const sampleData = [
            {
                input: "Sort array using bubble sort",
                pseudocode: "function bubbleSort(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j];\n      }\n    }\n  }\n  return arr;\n}",
                generatedCode: "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
                language: "python",
                duration: 850,
                success: true
            },
            {
                input: "Find maximum element in array",
                pseudocode: "function findMax(arr) {\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > max) {\n      max = arr[i];\n    }\n  }\n  return max;\n}",
                generatedCode: "function find_max(arr):\n    max_val = arr[0]\n    for val in arr:\n        if val > max_val:\n            max_val = val\n    return max_val",
                language: "javascript",
                duration: 650,
                success: true
            },
            {
                input: "Binary search tree implementation",
                pseudocode: "class Node:\n  constructor(value) {\n    this.value = value\n    this.left = null\n    this.right = null\n  }\n\nclass BinaryTree:\n  constructor() {\n    this.root = null\n  }\n\nfunction insert(root, value) {\n  const newNode = new Node(value)\n  if (!root) {\n    root = newNode\n  } else {\n    insertRec(root, value)\n  }\n}\n\nfunction insertRec(node, value) {\n  if (value < node.value) {\n    node.left = insertRec(node.left, value)\n  } else {\n    node.right = insertRec(node.right, value)\n  }\n  return node\n}\n\nfunction search(root, value) {\n  return searchRec(root, value)\n}\n\nfunction searchRec(node, value) {\n  if (!node) {\n    return false\n  }\n  if (value === node.value) {\n    return true\n  }\n  if (value < node.value) {\n    return searchRec(node.left, value)\n  }\n  return searchRec(node.right, value)\n}",
                generatedCode: "class BinarySearchTree:\n  def __init__(self):\n        self.root = None\n    \n    def insert(self, value):\n        new_node = Node(value)\n        if not self.root:\n            self.root = new_node\n        else:\n            self._insert(self.root, new_node)\n    \n    def _insert(self, node, value):\n        if value < node.value:\n            node.left = self._insert(node.left, value)\n        else:\n            node.right = self._insert(node.right, value)\n        return node\n    \n    def search(self, value):\n        return self._search(self.root, value)\n    \n    def _search(self, node, value):\n        if not node:\n            return False\n        if value == node.value:\n            return True\n        if value < node.value:\n            return self._search(node.left, value)\n        return self._search(node.right, value)",
                language: "python",
                duration: 1200,
                success: true
            }
        ];
        
        sampleData.forEach(item => this.addExecution(item));
        
        alert('Generated 3 sample history items for testing!');
    }
    
    exportExecution(id) {
        const execution = this.history.find(item => item.id === id);
        if (execution) {
            const exportData = {
                input: execution.input,
                pseudocode: execution.pseudocode,
                generatedCode: execution.generatedCode,
                language: execution.language,
                timestamp: execution.timestamp,
                duration: execution.duration
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `history_${execution.id}_${execution.timestamp.replace(/[:.]/g, '-')}.json`;
            a.textContent = `Export ${execution.input.substring(0, 30)}...`;
            a.click();
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }
    
    shareExecution(id) {
        const execution = this.history.find(item => item.id === id);
        if (execution) {
            const shareData = {
                input: execution.input,
                pseudocode: execution.pseudocode,
                generatedCode: execution.generatedCode,
                language: execution.language,
                timestamp: execution.timestamp
            };
            
            const shareText = `🔗 ${execution.input} (CodeSculptor Algorithm)\n\n${execution.pseudocode ? 'Pseudocode: ' + execution.pseudocode.substring(0, 200) + '\\n\\n' : ''}${execution.generatedCode ? 'Generated Code (' + execution.language.toUpperCase() + '): ' + execution.generatedCode.substring(0, 200) : ''}\\n\\n⏱️ Duration: ${execution.duration}ms\\n🕐 Timestamp: ${new Date(execution.timestamp).toLocaleString()}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'CodeSculptor Algorithm',
                    text: shareText
                }).catch(err => console.error('Share failed:', err));
            } else {
                // Fallback: copy to clipboard
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Algorithm details copied to clipboard!');
            }
        }
    }
}

// Initialize enhanced history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing EnhancedHistory...');
    window.enhancedHistory = new EnhancedHistory();
    console.log('EnhancedHistory initialized:', window.enhancedHistory);
});

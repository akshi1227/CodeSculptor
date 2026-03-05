// Storage Manager - Handles LocalStorage operations
class StorageManager {
    constructor() {
        this.prefix = 'codesculptor_';
        this.sessionKey = this.prefix + 'last_session';
        this.settingsKey = this.prefix + 'settings';
        this.historyKey = this.prefix + 'history';
    }

    // Session Management
    saveSession(sessionData) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            this.addToHistory(sessionData);
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    }

    getLastSession() {
        try {
            const data = localStorage.getItem(this.sessionKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }

    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
            return true;
        } catch (error) {
            console.error('Failed to clear session:', error);
            return false;
        }
    }

    // Settings Management
    saveSetting(key, value) {
        try {
            const settings = this.getSettings();
            settings[key] = value;
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save setting:', error);
            return false;
        }
    }

    getSetting(key, defaultValue = null) {
        try {
            const settings = this.getSettings();
            return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
        } catch (error) {
            console.error('Failed to get setting:', error);
            return defaultValue;
        }
    }

    getSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {};
        }
    }

    // History Management
    addToHistory(sessionData) {
        try {
            const history = this.getHistory();
            
            // Add new entry with timestamp
            history.unshift({
                ...sessionData,
                id: Date.now()
            });

            // Keep only last 10 entries
            if (history.length > 10) {
                history.length = 10;
            }

            localStorage.setItem(this.historyKey, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Failed to add to history:', error);
            return false;
        }
    }

    getHistory() {
        try {
            const data = localStorage.getItem(this.historyKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.historyKey);
            return true;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    }

    // Export/Import
    exportData() {
        try {
            const data = {
                session: this.getLastSession(),
                settings: this.getSettings(),
                history: this.getHistory()
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `codesculptor_backup_${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Failed to export data:', error);
            return false;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.session) {
                this.saveSession(data.session);
            }
            
            if (data.settings) {
                localStorage.setItem(this.settingsKey, JSON.stringify(data.settings));
            }
            
            if (data.history) {
                localStorage.setItem(this.historyKey, JSON.stringify(data.history));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Clear all data
    clearAll() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear all data:', error);
            return false;
        }
    }
}
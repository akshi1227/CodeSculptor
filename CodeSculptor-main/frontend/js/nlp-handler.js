// NLP Handler - Communicates with Flask Backend
class NLPHandler {
    constructor() {
        // Backend base URL (FIXED)
        this.apiUrl = 'http://localhost:5000';

    }

    async convertToPseudocode(text, highAccuracy = false) {
        try {
            const response = await fetch(`${this.apiUrl}/api/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    high_accuracy: highAccuracy
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('NLP Handler Error:', error);
            return {
                success: false,
                error: 'Failed to connect to backend'
            };
        }
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

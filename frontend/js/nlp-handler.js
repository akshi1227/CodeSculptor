// NLP Handler - Communicates with Flask Backend
class NLPHandler {
    constructor() {
        // Backend base URL (FIXED)
        this.apiUrl = 'http://127.0.0.1:5000';

    }

    async convertToPseudocode(text, highAccuracy = false, language = 'pseudocode', domain = 'general') {
        try {
            console.log(`🚀 Sending request to ${this.apiUrl}/api/convert... Language: ${language}`);
            const response = await fetch(`${this.apiUrl}/api/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    high_accuracy: highAccuracy,
                    language,
                    domain
                })
            });

            if (!response.ok) {
                console.error(`❌ Backend returned error ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Backend response received:', data);
            return data;

        } catch (error) {
            console.error('❌ NLP Handler Error:', error);
            return {
                success: false,
                error: `Connection Failed: ${error.message}`
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
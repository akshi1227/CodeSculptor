// Code Editor functionality
class CodeEditor {
    constructor() {
        this.editor = document.getElementById('codeEditor');
        this.consoleOutput = document.getElementById('consoleOutput');
        this.runBtn = document.getElementById('runCodeBtn');
        this.clearBtn = document.getElementById('clearEditorBtn');
        this.clearConsoleBtn = document.getElementById('clearConsoleBtn');
        this.languageSelect = document.getElementById('editorLanguage');
        
        this.originalConsoleLog = console.log;
        this.originalConsoleError = console.error;
        this.originalConsoleWarn = console.warn;
        this.originalConsoleInfo = console.info;
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.runBtn.addEventListener('click', () => this.runCode());
        this.clearBtn.addEventListener('click', () => this.clearEditor());
        this.clearConsoleBtn.addEventListener('click', () => this.clearConsole());
        
        // Language change handler
        this.languageSelect.addEventListener('change', () => this.handleLanguageChange());
        
        // Tab indentation support
        this.editor.addEventListener('keydown', (e) => this.handleTabKey(e));
        
        // Auto-resize textarea
        this.editor.addEventListener('input', () => this.autoResize());
    }
    
    handleTabKey(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.editor.selectionStart;
            const end = this.editor.selectionEnd;
            
            this.editor.value = this.editor.value.substring(0, start) + '    ' + this.editor.value.substring(end);
            this.editor.selectionStart = this.editor.selectionEnd = start + 4;
        }
    }
    
    autoResize() {
        this.editor.style.height = 'auto';
        this.editor.style.height = this.editor.scrollHeight + 'px';
    }
    
    handleLanguageChange() {
        const language = this.languageSelect.value;
        const placeholders = {
            'javascript': `// Write your JavaScript code here...
console.log('Hello, World!');

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));`,
            'python': `# Write your Python code here...
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))`,
            'html': `<!-- Write your HTML code here... -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <script>
        console.log('Page loaded!');
    </script>
</body>
</html>`
        };
        
        this.editor.placeholder = placeholders[language] || placeholders['javascript'];
    }
    
    clearEditor() {
        this.editor.value = '';
        this.autoResize();
    }
    
    clearConsole() {
        this.consoleOutput.innerHTML = '<span style="color: #6a9955;">// Console output will appear here...</span>';
    }
    
    async runCode() {
        const code = this.editor.value.trim();
        const language = this.languageSelect.value;
        
        if (!code) {
            this.logToConsole('⚠️ Please enter some code to run', 'warn');
            return;
        }
        
        this.clearConsole();
        this.logToConsole('▶️ Running code...', 'info');
        
        try {
            switch (language) {
                case 'javascript':
                    this.runJavaScript(code);
                    break;
                case 'python':
                    await this.runPython(code);
                    break;
                case 'html':
                    this.runHTML(code);
                    break;
                default:
                    this.logToConsole('❌ Language not supported yet', 'error');
            }
        } catch (error) {
            this.logToConsole(`❌ Error: ${error.message}`, 'error');
        }
    }
    
    runJavaScript(code) {
        // Override console methods to capture output
        console.log = (...args) => {
            this.logToConsole(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'log');
        };
        
        console.error = (...args) => {
            this.logToConsole(args.join(' '), 'error');
        };
        
        console.warn = (...args) => {
            this.logToConsole(args.join(' '), 'warn');
        };
        
        console.info = (...args) => {
            this.logToConsole(args.join(' '), 'info');
        };
        
        try {
            // Create a safe execution context
            const safeCode = `
                (function() {
                    ${code}
                })()
            `;
            
            // Execute the code
            eval(safeCode);
            this.logToConsole('✅ Code executed successfully', 'success');
        } catch (error) {
            this.logToConsole(`❌ JavaScript Error: ${error.message}`, 'error');
        } finally {
            // Restore original console methods
            console.log = this.originalConsoleLog;
            console.error = this.originalConsoleError;
            console.warn = this.originalConsoleWarn;
            console.info = this.originalConsoleInfo;
        }
    }
    
    async runPython(code) {
        this.logToConsole('🐍 Sending Python code to backend for execution...', 'info');
        
        try {
            const response = await fetch('http://localhost:5000/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    language: 'python'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.logToConsole('✅ Python code executed successfully!', 'success');
                if (result.output) {
                    this.logToConsole('📤 Output:', 'info');
                    this.logToConsole(result.output, 'log');
                }
                if (result.error) {
                    this.logToConsole('⚠️ Errors:', 'warn');
                    this.logToConsole(result.error, 'error');
                }
            } else {
                this.logToConsole(`❌ Error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.logToConsole(`❌ Network Error: ${error.message}`, 'error');
            this.logToConsole('💡 Make sure backend server is running on http://localhost:5000', 'info');
        }
    }
    
    runHTML(code) {
        // Create a new window or iframe to render HTML
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (newWindow) {
            newWindow.document.write(code);
            newWindow.document.close();
            this.logToConsole('✅ HTML rendered in new window', 'success');
        } else {
            // Fallback: create an iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '400px';
            iframe.style.border = '1px solid #ddd';
            iframe.style.borderRadius = '6px';
            
            this.logToConsole('🖼️ Rendering HTML below:', 'info');
            this.consoleOutput.appendChild(iframe);
            
            iframe.contentDocument.open();
            iframe.contentDocument.write(code);
            iframe.contentDocument.close();
        }
    }
    
    logToConsole(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            'log': '#d4d4d4',
            'error': '#f87171',
            'warn': '#fbbf24',
            'info': '#60a5fa',
            'success': '#34d399',
            'code': '#a78bfa'
        };
        
        const icons = {
            'log': '📝',
            'error': '❌',
            'warn': '⚠️',
            'info': 'ℹ️',
            'success': '✅',
            'code': '📋'
        };
        
        const logEntry = document.createElement('div');
        logEntry.style.marginBottom = '4px';
        logEntry.style.fontSize = '12px';
        logEntry.style.lineHeight = '1.4';
        
        if (type === 'code') {
            logEntry.innerHTML = `<span style="color: #6a9955;">${timestamp}</span> <span style="color: ${colors[type]}; font-family: monospace; white-space: pre-wrap;">${message}</span>`;
        } else {
            logEntry.innerHTML = `<span style="color: #6a9955;">${timestamp}</span> <span style="color: ${colors[type]};">${icons[type]} ${message}</span>`;
        }
        
        // Remove placeholder if it exists
        const placeholder = this.consoleOutput.querySelector('span[style*="#6a9955"]');
        if (placeholder && placeholder.textContent.includes('Console output will appear here')) {
            placeholder.remove();
        }
        
        this.consoleOutput.appendChild(logEntry);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }
}

// Initialize the code editor when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.codeEditor = new CodeEditor();
});

// Tab switching functionality for the editor tab
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');
            
            // Add active class to clicked button and show corresponding content
            button.classList.add('active');
            
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
});

# 🚀 CodeSculptor AI

## 🌟 Overview
CodeSculptor AI is an intelligent learning platform that converts natural language into pseudocode, step-by-step execution, and interactive visualizations.

---

## 🧠 Key Features
- Natural Language Input
- AI-generated Pseudocode
- Step-by-step Visualization
- Mermaid Diagrams
- Voice Narration
- Multi-AI Support (Gemini + Groq)

---

## 🛠️ Tech Stack
- Backend: Python, Flask  
- Frontend: HTML, CSS, JavaScript  
- AI: Gemini API, Groq API  
- Visualization: Mermaid.js  

---

## 🚀 How to Run

### Start Backend
python backend/app.py

### Start Frontend
cd frontend  
python -m http.server 8000  

Open:
http://localhost:8000/index.html

---

## 📂 Project Structure
CodeSculptor/
│
├── backend/
├── frontend/
├── start_project.bat
├── README.md

---

## 🎯 Use Cases
- **Algorithm Learning** - Students learn sorting, searching, graph algorithms through interactive visualizations
- **Visual Understanding** - Step-by-step execution helps understand algorithm flow and logic
- **Interview Preparation** - Practice algorithm explanations and code generation for technical interviews
- **Code Testing** - Live JavaScript execution in browser for testing code snippets
- **Activity Tracking** - Monitor learning progress with per-user history system
- **Multi-Language Support** - Generate implementations in Python, JavaScript, Java, C++
- **AI-Powered Learning** - Leverage Gemini and Groq APIs for intelligent algorithm generation

## 🔧 Installation & Setup

### Prerequisites
- **Python 3.7+** - Backend server requirements
- **Node.js** (optional) - For frontend development
- **Modern Browser** - Chrome, Firefox, Safari, Edge
- **API Keys** - Gemini API key and Groq API key

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/CodeSculptor.git

# Start both servers
cd CodeSculptor
start_project.bat

# Or start manually
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
python app.py

# Terminal 2: Frontend  
cd frontend
python -m http.server 8000

# Access the application
http://localhost:8000
```

## 🏗️ Architecture Overview

### Backend (Flask)
```
backend/
├── app.py              # Main Flask application
├── requirements.txt       # Python dependencies
├── nlp_handler.py       # Natural language processing
├── algorithm_visualizer.py  # Algorithm visualization logic
└── storage_manager.py    # Data persistence
```

### Frontend (HTML/CSS/JS)
```
frontend/
├── index.html           # Landing page with authentication
├── login.html           # User login/signup system
├── app.html             # Main application interface
├── css/
│   ├── style.css          # Main application styles
│   └── auth.css           # Authentication styles
└── js/
    ├── main.js               # Core application controller
    ├── auth.js               # User authentication logic
    ├── storage-manager.js     # LocalStorage management
    ├── nlp-handler.js         # Backend communication
    ├── activity-history.js     # Legacy history system (deprecated)
    ├── enhanced-history.js     # Enhanced activity history system
    ├── simple-history.js       # Simple history fallback
    ├── code-editor.js         # Live code execution
    └── voice-narrator.js      # Audio explanations
```

## 🎮 Feature Deep Dive

### 🧠 Algorithm Visualization Engine
- **Natural Language Processing** - Convert plain English to structured algorithms
- **Step-by-Step Execution** - Interactive animation of algorithm flow
- **Mermaid Diagrams** - Visual representation of algorithm structure
- **Multi-AI Support** - Toggle between Gemini (high accuracy) and Groq (fast)

### 💻 Code Generation System
- **Language Selection** - Python, JavaScript, Java, C++, Pseudocode
- **Syntax Highlighting** - Proper code formatting and display
- **Export Functionality** - Copy or download generated code
- **Complexity Analysis** - Time and space complexity with charts

### 📚 Activity History System
- **Per-User Tracking** - Individual history for each user account
- **Comprehensive Logging** - Input, pseudocode, generated code, language, timestamp
- **Search & Filter** - Find specific algorithms in history
- **Click-to-Reload** - Quick access to previous algorithms
- **Card-Based UI** - Clean, organized display with language badges

### Enhanced Activity History System
- **Per-User Storage** - Individual history using `currentUser` email
- **Comprehensive Tracking** - Input, pseudocode, generated code, language, timestamp, duration
- **Advanced Search & Filtering** - Real-time search across all fields with multiple filters
- **Pagination System** - 10 items per page with navigation controls
- **Modern UI Design** - Card-based layout with gradient backgrounds and animations
- **Interactive Features** - Click-to-reload, export, share, and delete functionality
- **Language Badges** - Color-coded indicators for JavaScript, Python, Java, C++, Pseudocode
- **History Statistics** - Total items count and monthly activity tracking
- **Sample Data Generation** - Built-in test data for system validation
- **Error Handling** - Graceful failure management with comprehensive logging

#### Enhanced History Features
- **Search Functionality**
  - Real-time search across input, pseudocode, generated code, and language
  - Language filtering (JavaScript, Python, Java, C++, Pseudocode)
  - Date range filtering (Today, This Week, This Month, This Year)
  - Content filters (Has Generated Code, Has Pseudocode)
  - Reset filters functionality

- **Pagination & Performance**
  - 10 items per page for optimal performance
  - Previous/Next navigation with page info display
  - Smart pagination resets on search/filter
  - Optimized for up to 200 history items

- **Interactive Cards**
  - Gradient backgrounds with hover effects
  - Language badges with color coding
  - Success/error indicators
  - Click-to-reload functionality
  - Individual delete with confirmation
  - Export as JSON files
  - Share with clipboard fallback

- **Data Management**
  - Per-user localStorage isolation
  - Automatic cleanup of old items
  - Error recovery and data validation
  - Comprehensive logging for debugging

### 🎨 Code Editor Integration
- **Live JavaScript Execution** - Safe browser-based code testing
- **Console Output** - Real-time execution results
- **Multi-Language Support** - JavaScript, Python, HTML
- **Syntax Highlighting** - Professional code display
- **Error Handling** - Graceful failure management

## 🔐 Authentication System
- **User Registration** - Email-based signup with validation
- **Secure Login** - Password authentication with session management
- **Guest Mode** - Limited functionality without account
- **Session Persistence** - Automatic login state management
- **Data Validation** - Input sanitization and error handling

## 🎯 Learning Workflow

### 1. Input Phase
```
User enters: "Sort array using bubble sort"
↓
AI processes natural language
↓
Generates structured algorithm steps
```

### 2. Visualization Phase
```
Interactive step-by-step animation
↓
Mermaid diagram generation
↓
Complexity analysis charts
```

### 3. Code Generation Phase
```
Select target language (Python/JavaScript/Java/C++)
↓
AI generates implementation
↓
Syntax highlighting and formatting
```

### 4. Practice Phase
```
Live code editor for testing
↓
Activity history for review
↓
Export functionality for sharing
```

## 🌟 Educational Benefits

- **Visual Learning** - Better understanding through visualization
- **Interactive Engagement** - Active participation vs passive reading
- **Multi-Modal Learning** - Text, visual, and audio explanations
- **Progress Tracking** - Monitor learning over time
- **Immediate Feedback** - Real-time code execution and results
- **Interview Preparation** - Professional algorithm explanations

## 🚀 Advanced Features

### AI Integration
- **Gemini API** - High-quality, detailed explanations
- **Groq API** - Fast, efficient processing
- **Smart Selection** - Automatic AI provider optimization
- **Context Awareness** - Maintains conversation context

### Data Management
- **LocalStorage Storage** - Client-side persistence
- **User Segregation** - Per-user data isolation
- **Session Management** - Automatic state preservation
- **History Analytics** - Learning progress tracking

### Performance Optimization
- **Lazy Loading** - On-demand resource loading
- **Caching System** - Improved response times
- **Responsive Design** - Mobile-friendly interface
- **Error Boundaries** - Graceful failure handling

## 🔮 Development Guidelines

### Code Organization
- **Modular Architecture** - Separate concerns into focused modules
- **Clean Code Principles** - Maintainable and readable codebase
- **Component Reusability** - Shared UI elements and functions
- **API Abstraction** - Clean interface between frontend and backend

### Testing Strategy
- **Unit Testing** - Individual component validation
- **Integration Testing** - End-to-end workflow verification
- **User Testing** - Real-world usage simulation
- **Performance Testing** - Load and response time optimization

## 🎖️ Future Roadmap

### Phase 1: Foundation (Current)
- ✅ Core algorithm visualization
- ✅ Multi-AI integration
- ✅ User authentication system
- ✅ Activity history tracking
- ✅ Live code execution
- ✅ Responsive design

### Phase 2: Enhancement (Next)
- 🔄 **Collaborative Learning** - Share algorithms and solutions
- 🔄 **Advanced Analytics** - Detailed learning insights
- 🔄 **Custom Algorithms** - User-defined algorithm library
- 🔄 **Export Options** - Multiple format support (PDF, images)
- 🔄 **Mobile App** - Native iOS/Android applications

### Phase 3: Expansion (Future)
- 🚀 **AI Tutoring** - Personalized learning assistance
- 🚀 **Video Explanations** - Integrated multimedia content
- 🚀 **Classroom Integration** - Teacher tools and dashboards
- 🚀 **API Marketplace** - Community-contributed algorithms

## 📊 Technical Specifications

### Supported Browsers
- **Chrome 90+** - Full feature support
- **Firefox 88+** - Complete compatibility
- **Safari 14+** - Mobile optimized
- **Edge 90+** - Windows recommended

### Performance Requirements
- **Minimum RAM:** 4GB for smooth animations
- **Recommended:** 8GB for optimal performance
- **Network:** Stable internet connection for API calls
- **Storage:** 50MB localStorage per browser

### Security Features
- **Input Sanitization** - XSS prevention and validation
- **Secure Authentication** - Password hashing and session management
- **API Key Protection** - Environment variable storage
- **HTTPS Enforcement** - Secure data transmission
- **CORS Configuration** - Proper cross-origin handling

## 🤝 Contributing Guidelines

### Development Setup
```bash
# Fork the repository
git clone https://github.com/your-username/CodeSculptor.git

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python backend/app.py
```

### Code Standards
- **ESLint Configuration** - Consistent JavaScript formatting
- **Prettier Integration** - Automated code styling
- **Component Documentation** - JSDoc comments for functions
- **TypeScript Support** - Optional type safety
- **Testing Coverage** - Minimum 80% code coverage

### Pull Request Process
1. **Fork** - Create your own version
2. **Branch** - Feature-specific development branch
3. **Test** - Verify functionality and performance
4. **Document** - Update README and code comments
5. **Submit** - Create detailed pull request with examples

## 📞 Support & Community

### Getting Help
- **Documentation** - Comprehensive README and code comments
- **Issue Tracking** - GitHub Issues for bug reports
- **Feature Requests** - Community-driven development
- **Discord Community** - Real-time developer discussions
- **Video Tutorials** - YouTube channel for visual guides

### License
- **MIT License** - Permissive open-source licensing
- **Commercial Use** - Available for educational institutions
- **Attribution Required** - Credit to original project
- **Modification Rights** - Freedom to extend and improve

---

## Usage Examples

### Enhanced History System in Action

#### Basic Usage
```javascript
// The enhanced history system automatically tracks all algorithm executions
// No manual setup required - just use the app normally!

// Generate an algorithm visualization
// 1. Type: "Sort array using bubble sort"
// 2. Select language: Python
// 3. Click "Generate Visualization"
// 4. History automatically saves with:
//    - Input text
//    - Generated pseudocode
//    - Python code implementation
//    - Execution duration
//    - Timestamp
```

#### Advanced Search & Filtering
```javascript
// Search functionality examples
// 1. Real-time search: "bubble sort" -> finds all bubble sort entries
// 2. Language filter: Select "Python" -> shows only Python implementations
// 3. Date filter: "This Week" -> shows recent activity
// 4. Content filter: "Has Generated Code" -> shows items with code only
```

#### Interactive Features
```javascript
// Click-to-reload functionality
// Click any history card -> Automatically loads input and language settings

// Export functionality
// Click "Export" button -> Downloads JSON file with full algorithm data

// Share functionality
// Click "Share" button -> Copies algorithm details to clipboard
```

### Sample History Data Structure
```json
{
  "id": "1649123456789_abc123def",
  "input": "Sort array using bubble sort",
  "pseudocode": "function bubbleSort(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j];\n      }\n    }\n  }\n  return arr;\n}",
  "generatedCode": "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
  "language": "python",
  "timestamp": "2024-04-15T10:30:00.000Z",
  "duration": 850,
  "success": true,
  "error": null
}
```

### UI Components Overview

#### History Card Layout
```
[LANGUAGE BADGE] [TIMESTAMP] [STATUS] [DELETE] [RELOAD]
INPUT: "Sort array using bubble sort..."

PSEUDOCODE:
function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j];
      }
    }
  }
  return arr;
}

GENERATED CODE (PYTHON):
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

[EXPORT] [SHARE]                     [DURATION: 850ms]
```

#### Search Controls
```
[Search Input] [Clear Search]
[Language Filter: All Languages] [Date Filter: All Time]
[Has Generated Code] [Has Pseudocode] [Reset Filters]

[Previous] Page 1 of 3 [Next]
```

#### Statistics Display
```
History Stats
Total: 25 items | This Month: 8 items
```

## 🚀 Quick Start Summary

1. **Clone:** `git clone https://github.com/your-username/CodeSculptor.git`
2. **Install:** `pip install -r requirements.txt`
3. **Run:** `python backend/app.py` + `python -m http.server 8000`
4. **Access:** `http://localhost:8000`
5. **Learn:** Start converting natural language to visualizations!

### Enhanced History Quick Start
1. **Login** or continue as guest
2. **Generate** any algorithm visualization
3. **View** history automatically tracked below input
4. **Search** and filter through your activity
5. **Click** any item to reload it instantly
6. **Export** or share your favorite algorithms

**CodeSculptor AI** - Transform how students learn algorithms through interactive AI-powered visualization! 🎓✨

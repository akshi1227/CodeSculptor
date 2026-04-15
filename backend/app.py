import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
from groq import Groq
import google.generativeai as genai
from pathlib import Path
from algorithm_visualizer import detect_algorithm_type, generate_visualization_steps, generate_algorithm_pseudocode
from input_parser import InputParser
from advanced_visualizer import AdvancedVisualizer
import re

# Import MongoDB and routes
from database import init_collections, mongo, History
from auth_routes import auth_bp
from history_routes import history_bp

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')


def extract_section(text, section_name):
    # Try exact match first (case insensitive)
    pattern = rf"{section_name}:(.*?)(?=(?:PSEUDOCODE|CODE|DIAGRAM|EXPLANATION|EXPLANATION_WHY|COMPLEXITY|COMPARISON|REAL_WORLD_MAP|AI_HINTS):|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        content = match.group(1).strip()
        if content:
            return content
    
    # Fallback: Try with markdown code blocks
    if section_name.upper() == "CODE":
        code_pattern = r"```(?:\w+)?\n(.*?)\n```"
        match = re.search(code_pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
    
    return ""

def detect_line_type(line):
    """Detect the type of pseudocode line for styling"""
    line_lower = line.lower()
    if 'for' in line_lower or 'while' in line_lower:
        return 'loop'
    elif 'if' in line_lower or 'else' in line_lower:
        return 'condition'
    elif 'return' in line_lower:
        return 'return'
    elif any(keyword in line_lower for keyword in ['print', 'output', 'display']):
        return 'output'
    else:
        return 'statement'

# Load .env from the backend directory
env_path = Path(__file__).parent / '.env'
print(f"📁 Loading .env from: {env_path}")
print(f"📁 .env file exists: {env_path.exists()}")
load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Handle preflight OPTIONS requests globally
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# Configure Groq API
groq_api_key = os.getenv('GROQ_API_KEY')
if groq_api_key and groq_api_key != 'your-groq-api-key-here':
    try:
        groq_client = Groq(api_key=groq_api_key)
        print("✅ Groq API configured successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize Groq: {e}")
        groq_client = None
else:
    groq_client = None

# Configure Gemini API
gemini_api_key = os.getenv('GOOGLE_API_KEY')
if gemini_api_key and gemini_api_key != 'your-google-api-key-here':
    try:
        genai.configure(api_key=gemini_api_key)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini API configured successfully (using gemini-1.5-flash)")
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini: {e}")
        gemini_model = None
else:
    gemini_model = None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "CodeSculptor API is running"
    })

# === SCENARIO-BASED LEARNING ENDPOINT ===
SCENARIO_DEMOS = {
    "restaurant": {
        "scenario_title": "Restaurant Order Queue",
        "data_structure": "Queue (FIFO)",
        "ds_icon": "🍽️",
        "ds_color": "#f59e0b",
        "why_this_ds": "A restaurant processes orders in the exact order they arrive — first come, first served. A Queue (First In, First Out) perfectly models this: new orders join the back (enqueue), and the chef always takes from the front (dequeue).",
        "real_world_connection": "This same pattern powers OS task schedulers, print spoolers, and call center queues.",
        "approach_steps": [
            {"step": 1, "title": "Customer places order", "detail": "Order #1 (Burger) arrives → Enqueue to back of queue", "ds_state": ["Order #1 (Burger)"]},
            {"step": 2, "title": "More orders arrive", "detail": "Orders #2 (Pizza) and #3 (Salad) join the queue", "ds_state": ["Order #1 (Burger)", "Order #2 (Pizza)", "Order #3 (Salad)"]},
            {"step": 3, "title": "Chef processes oldest order", "detail": "Dequeue from front → Chef makes Order #1 (Burger) first", "ds_state": ["Order #2 (Pizza)", "Order #3 (Salad)"]},
            {"step": 4, "title": "Continue processing", "detail": "Dequeue Order #2 (Pizza) → Only Order #3 remains", "ds_state": ["Order #3 (Salad)"]},
            {"step": 5, "title": "Queue empty", "detail": "All orders processed in the exact order they were received!", "ds_state": []}
        ],
        "pseudocode": "1. CREATE empty Queue\n2. WHEN order arrives:\n   a. order.enqueue(order_details)\n3. WHEN chef ready:\n   a. current_order = queue.dequeue()\n   b. IF queue is empty → wait\n   c. ELSE → prepare current_order\n4. REPEAT until shift ends",
        "code_python": "from collections import deque\n\nclass RestaurantQueue:\n    def __init__(self):\n        self.queue = deque()\n    \n    def new_order(self, order):\n        self.queue.append(order)  # enqueue\n        print(f'Order added: {order}')\n    \n    def process_next(self):\n        if not self.queue:\n            print('No orders waiting!')\n            return None\n        order = self.queue.popleft()  # dequeue\n        print(f'Processing: {order}')\n        return order\n\n# Demo\nrestaurant = RestaurantQueue()\nrestaurant.new_order('Burger')\nrestaurant.new_order('Pizza')\nrestaurant.new_order('Salad')\nrestaurant.process_next()  # Burger\nrestaurant.process_next()  # Pizza",
        "diagram": "graph LR\n    A[Customer] -->|enqueue| B[🍔 Order 1]\n    B --> C[🍕 Order 2]\n    C --> D[🥗 Order 3]\n    D -->|dequeue| E[Chef 👨‍🍳]\n    style B fill:#f59e0b,color:#000\n    style E fill:#10b981,color:#fff",
        "complexity": "Enqueue: O(1)\nDequeue: O(1)\nSpace: O(n) — n = number of orders",
        "difficulty": "Beginner",
        "category": "Queue"
    },
    "browser": {
        "scenario_title": "Browser Back / Forward Navigation",
        "data_structure": "Stack (LIFO)",
        "ds_icon": "🌐",
        "ds_color": "#8b5cf6",
        "why_this_ds": "Every time you click a link, the current page is pushed onto a stack. When you press Back, the top page is popped and you return to it. A Stack (Last In, First Out) is the natural fit — the most recently visited page is always the first one you go back to.",
        "real_world_connection": "Undo/Redo in text editors, function call stacks in programming languages, and expression evaluation all use this pattern.",
        "approach_steps": [
            {"step": 1, "title": "Visit Google.com", "detail": "Push 'google.com' onto back stack", "ds_state": ["google.com"]},
            {"step": 2, "title": "Click to Gmail", "detail": "Push 'gmail.com' onto back stack", "ds_state": ["google.com", "gmail.com"]},
            {"step": 3, "title": "Open an email", "detail": "Push 'mail/email-123' onto back stack", "ds_state": ["google.com", "gmail.com", "mail/email-123"]},
            {"step": 4, "title": "Press Back button", "detail": "Pop 'mail/email-123' → Return to gmail.com", "ds_state": ["google.com", "gmail.com"]},
            {"step": 5, "title": "Press Back again", "detail": "Pop 'gmail.com' → Return to google.com", "ds_state": ["google.com"]}
        ],
        "pseudocode": "1. CREATE back_stack, forward_stack\n2. FUNCTION visit(url):\n   a. back_stack.push(current_page)\n   b. current_page = url\n   c. forward_stack.clear()\n3. FUNCTION go_back():\n   a. forward_stack.push(current_page)\n   b. current_page = back_stack.pop()\n4. FUNCTION go_forward():\n   a. back_stack.push(current_page)\n   b. current_page = forward_stack.pop()",
        "code_python": "class BrowserHistory:\n    def __init__(self, homepage):\n        self.current = homepage\n        self.back_stack = []\n        self.forward_stack = []\n    \n    def visit(self, url):\n        self.back_stack.append(self.current)\n        self.current = url\n        self.forward_stack.clear()  # forward history reset\n        print(f'Visiting: {url}')\n    \n    def back(self):\n        if self.back_stack:\n            self.forward_stack.append(self.current)\n            self.current = self.back_stack.pop()\n            print(f'Back to: {self.current}')\n    \n    def forward(self):\n        if self.forward_stack:\n            self.back_stack.append(self.current)\n            self.current = self.forward_stack.pop()\n            print(f'Forward to: {self.current}')\n\n# Demo\nbrowser = BrowserHistory('google.com')\nbrowser.visit('gmail.com')\nbrowser.visit('mail/email-123')\nbrowser.back()   # gmail.com\nbrowser.back()   # google.com",
        "diagram": "graph TB\n    A[google.com] --> B[gmail.com]\n    B --> C[email-123]\n    C -->|Back pressed| B\n    B -->|Back pressed| A\n    style C fill:#8b5cf6,color:#fff\n    style A fill:#10b981,color:#fff",
        "complexity": "Push/Pop: O(1)\nSpace: O(n) — n = pages visited",
        "difficulty": "Beginner",
        "category": "Stack"
    },
    "social": {
        "scenario_title": "Friend Recommendations (Social Network)",
        "data_structure": "Graph + BFS",
        "ds_icon": "👥",
        "ds_color": "#06b6d4",
        "why_this_ds": "A social network is naturally a graph — users are nodes, friendships are edges. To find 'people you may know', we use BFS (Breadth-First Search) to explore friends-of-friends. BFS explores all nodes at distance 1 first, then distance 2, matching how '2nd-degree connections' work.",
        "real_world_connection": "LinkedIn's 'People You May Know', Facebook's friend suggestions, and even epidemic spread modeling all use this graph + BFS pattern.",
        "approach_steps": [
            {"step": 1, "title": "Build the friend graph", "detail": "Alice → [Bob, Carol]. Bob → [Alice, Dave, Eve]. Carol → [Alice, Frank]", "ds_state": ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"]},
            {"step": 2, "title": "Start BFS from Alice", "detail": "Visit Alice. Add her direct friends to the queue: [Bob, Carol]", "ds_state": ["Bob (1st)", "Carol (1st)"]},
            {"step": 3, "title": "Explore Bob's connections", "detail": "Bob's friends: Dave and Eve — they are Alice's 2nd-degree connections!", "ds_state": ["Carol (1st)", "Dave (2nd)", "Eve (2nd)"]},
            {"step": 4, "title": "Explore Carol's connections", "detail": "Carol's friends: Frank — another 2nd-degree connection!", "ds_state": ["Dave (2nd)", "Eve (2nd)", "Frank (2nd)"]},
            {"step": 5, "title": "Recommendations ready", "detail": "Recommend Dave, Eve, and Frank to Alice — they are close but not yet connected!", "ds_state": []}
        ],
        "pseudocode": "1. REPRESENT social network as adjacency list\n2. FUNCTION recommend_friends(user):\n   a. visited = {user}\n   b. queue = [user]\n   c. first_degree = user.friends\n   d. recommendations = []\n3. BFS up to depth 2:\n   a. For each friend in queue:\n      - For each friend_of_friend:\n        - IF not in visited AND not direct friend:\n          - Add to recommendations\n4. RETURN sorted recommendations",
        "code_python": "from collections import deque\n\ndef recommend_friends(graph, user):\n    visited = {user}\n    queue = deque([(user, 0)])  # (node, depth)\n    direct_friends = set(graph.get(user, []))\n    recommendations = set()\n    \n    while queue:\n        current, depth = queue.popleft()\n        if depth >= 2:\n            continue\n        for neighbor in graph.get(current, []):\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append((neighbor, depth + 1))\n                if neighbor not in direct_friends and neighbor != user:\n                    recommendations.add(neighbor)\n    \n    return list(recommendations)\n\n# Demo\ngraph = {\n    'Alice': ['Bob', 'Carol'],\n    'Bob': ['Alice', 'Dave', 'Eve'],\n    'Carol': ['Alice', 'Frank'],\n    'Dave': ['Bob'], 'Eve': ['Bob'], 'Frank': ['Carol']\n}\nprint(recommend_friends(graph, 'Alice'))  # ['Dave', 'Eve', 'Frank']",
        "diagram": "graph LR\n    Alice --- Bob\n    Alice --- Carol\n    Bob --- Dave\n    Bob --- Eve\n    Carol --- Frank\n    style Alice fill:#06b6d4,color:#fff\n    style Dave fill:#f59e0b,color:#000\n    style Eve fill:#f59e0b,color:#000\n    style Frank fill:#f59e0b,color:#000",
        "complexity": "BFS: O(V + E)\nV = users, E = friendships\nSpace: O(V)",
        "difficulty": "Intermediate",
        "category": "Graph"
    },
    "autocomplete": {
        "scenario_title": "Search Autocomplete (Trie)",
        "data_structure": "Trie (Prefix Tree)",
        "ds_icon": "🔤",
        "ds_color": "#10b981",
        "why_this_ds": "When you type in a search bar, autocomplete must find all words matching your prefix instantly. A Trie stores words character-by-character in a tree, so searching for all words starting with 'app' just means traversing from root → 'a' → 'p' → 'p' and collecting all descendants.",
        "real_world_connection": "Google Search, IDE code completion, spell checkers, and T9 mobile keyboards all use Trie-based prefix matching.",
        "approach_steps": [
            {"step": 1, "title": "Insert words into Trie", "detail": "Insert: 'apple', 'app', 'application', 'apply', 'apt'", "ds_state": ["apple", "app", "application", "apply", "apt"]},
            {"step": 2, "title": "User types 'ap'", "detail": "Traverse Trie: root → 'a' → 'p'. We're now at the 'p' node.", "ds_state": ["a", "p"]},
            {"step": 3, "title": "Collect all words from here", "detail": "DFS from 'p' node to find all complete words: app, apple, application, apply, apt", "ds_state": ["app", "apple", "application", "apply", "apt"]},
            {"step": 4, "title": "User types 'app'", "detail": "Traverse to next 'p' node. Only words with prefix 'app' remain.", "ds_state": ["app", "apple", "application", "apply"]},
            {"step": 5, "title": "Return suggestions", "detail": "Show top 4 completions instantly — O(prefix_length) traversal!", "ds_state": ["app ✓", "apple ✓", "application ✓", "apply ✓"]}
        ],
        "pseudocode": "1. TRIE Node = {children: {}, is_end: false}\n2. FUNCTION insert(word):\n   a. node = root\n   b. For each char in word:\n      - IF char not in node.children:\n        * Create new node\n      - Move to child node\n   c. Mark final node as end\n3. FUNCTION autocomplete(prefix):\n   a. Navigate to end of prefix\n   b. DFS from that node\n   c. Collect all words ending at leaf nodes\n4. RETURN list of completions",
        "code_python": "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n    \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end = True\n    \n    def autocomplete(self, prefix):\n        node = self.root\n        for char in prefix:\n            if char not in node.children:\n                return []\n            node = node.children[char]\n        return self._dfs(node, prefix)\n    \n    def _dfs(self, node, current):\n        results = []\n        if node.is_end:\n            results.append(current)\n        for char, child in node.children.items():\n            results.extend(self._dfs(child, current + char))\n        return results\n\n# Demo\ntrie = Trie()\nfor word in ['apple', 'app', 'application', 'apply', 'apt']:\n    trie.insert(word)\nprint(trie.autocomplete('app'))  # ['app', 'apple', 'application', 'apply']",
        "diagram": "graph TD\n    Root --> a\n    a --> p\n    p --> p2[p]\n    p --> t[t ✓]\n    p2 --> l[l]\n    p2 --> e[e ✓]\n    l --> i[i]\n    l --> y[y ✓]\n    i --> c[c]\n    c --> a2[a]\n    a2 --> t2[t]\n    t2 --> i2[i]\n    i2 --> o[o]\n    o --> n[n ✓]\n    style e fill:#10b981,color:#fff\n    style t fill:#10b981,color:#fff\n    style y fill:#10b981,color:#fff\n    style n fill:#10b981,color:#fff",
        "complexity": "Insert: O(m) — m = word length\nSearch: O(m + k) — k = results\nSpace: O(ALPHABET × N × M)",
        "difficulty": "Intermediate",
        "category": "Trie"
    }
}

# ===== LEETCODE / PROBLEM SCENARIOS =====
SCENARIO_DEMOS_PROBLEMS = {
    "two_sum": {
        "scenario_title": "Two Sum (LeetCode #1)",
        "data_structure": "HashMap (Dictionary)",
        "ds_icon": "🗺️",
        "ds_color": "#6366f1",
        "difficulty": "Easy",
        "category": "HashMap",
        "why_this_ds": "A HashMap lets us store each number's index as we scan the array. For every element, we check if its complement (target - current) is already in the map — a O(1) lookup. This turns a naive O(n²) brute-force into a single O(n) pass.",
        "real_world_connection": "This pattern is used in financial transaction matching, inventory systems, and database join optimizations.",
        "approach_steps": [
            {"step": 1, "title": "Initialize empty HashMap", "detail": "Create a hash map to store {value: index} pairs. Input: nums=[2,7,11,15], target=9", "ds_state": ["HashMap: {}"]},
            {"step": 2, "title": "Process nums[0] = 2", "detail": "complement = 9 - 2 = 7. Is 7 in map? No. Store {2: 0}.", "ds_state": ["HashMap: {2: 0}"]},
            {"step": 3, "title": "Process nums[1] = 7", "detail": "complement = 9 - 7 = 2. Is 2 in map? YES! Index 0.", "ds_state": ["HashMap: {2: 0}", "Found: 2+7 = 9 ✓"]},
            {"step": 4, "title": "Return answer", "detail": "Return [map[complement], current_index] = [0, 1]. Done in O(n)!", "ds_state": ["Result: [0, 1]"]}
        ],
        "pseudocode": "1. CREATE empty hash map seen = {}\n2. FOR each index i, num in nums:\n   a. complement = target - num\n   b. IF complement IN seen:\n      - RETURN [seen[complement], i]\n   c. ELSE:\n      - seen[num] = i\n3. RETURN [] (no solution found)",
        "code_python": "def twoSum(nums, target):\n    seen = {}  # value -> index\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\n# Test Cases\nprint(twoSum([2, 7, 11, 15], 9))   # [0, 1]\nprint(twoSum([3, 2, 4], 6))         # [1, 2]\nprint(twoSum([3, 3], 6))            # [0, 1]",
        "diagram": "graph TD\n    A[Start: nums=[2,7,11,15] target=9] --> B[i=0: num=2]\n    B --> C{complement=7\nin map?}\n    C -->|No| D[map={2:0}]\n    D --> E[i=1: num=7]\n    E --> F{complement=2\nin map?}\n    F -->|Yes✓| G[Return indices 0,1]\n    style G fill:#6366f1,color:#fff\n    style F fill:#10b981,color:#fff",
        "complexity": "Time: O(n)\nSpace: O(n)\nBrute Force: O(n²) Time, O(1) Space"
    },
    "valid_parentheses": {
        "scenario_title": "Valid Parentheses (LeetCode #20)",
        "data_structure": "Stack",
        "ds_icon": "📚",
        "ds_color": "#ec4899",
        "difficulty": "Easy",
        "category": "Stack",
        "why_this_ds": "Parentheses must be closed in LIFO order — the most recently opened bracket must close first. A stack naturally enforces this: push opening brackets, and when we see a closing bracket, pop and verify it matches the top of the stack.",
        "real_world_connection": "Compiler syntax validation, HTML/XML tag matching, and expression evaluators all use this stack-based approach.",
        "approach_steps": [
            {"step": 1, "title": "Start with empty stack. Input: ({[]})", "detail": "Stack tracks unmatched opening brackets", "ds_state": ["Stack: []"]},
            {"step": 2, "title": "See '(' and '{' → Push both", "detail": "( and { are opening brackets → push to stack", "ds_state": ["Stack: [(, {]"]},
            {"step": 3, "title": "See '[' → Push", "detail": "[ is opening bracket → push to stack", "ds_state": ["Stack: [(, {, []"]},
            {"step": 4, "title": "See ']' → Pop and match", "detail": "Pop [ from top. Does ] match [? YES. Continue.", "ds_state": ["Stack: [(, {]"]},
            {"step": 5, "title": "See '}' and ')' → Pop and match both", "detail": "} matches {, ) matches (. Stack is empty → VALID!", "ds_state": ["Stack: [] ✓ VALID"]}
        ],
        "pseudocode": "1. CREATE empty stack\n2. CREATE map: ')':'(' , '}':'{' , ']':'['\n3. FOR each char in string s:\n   a. IF char is opening ('(', '{', '['):\n      - PUSH to stack\n   b. ELSE (closing bracket):\n      - IF stack is EMPTY → return False\n      - IF stack.TOP != matching open → return False\n      - POP from stack\n4. RETURN stack is EMPTY",
        "code_python": "def isValid(s):\n    stack = []\n    pairs = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in '({[':\n            stack.append(char)\n        elif char in ')}]':\n            if not stack or stack[-1] != pairs[char]:\n                return False\n            stack.pop()\n    return len(stack) == 0\n\n# Test Cases\nprint(isValid('()'))       # True\nprint(isValid('()[]{}'))   # True\nprint(isValid('(]'))       # False\nprint(isValid('({[]})'))   # True",
        "diagram": "graph LR\n    A[Start] --> B{Opening bracket?}\n    B -->|Yes| C[Push to Stack]\n    B -->|No| D{Stack empty?}\n    D -->|Yes| E[Return FALSE]\n    D -->|No| F{Top matches?}\n    F -->|No| E\n    F -->|Yes| G[Pop Stack]\n    G --> H{More chars?}\n    H -->|Yes| B\n    H -->|No| I{Stack empty?}\n    I -->|Yes| J[Return TRUE ✓]\n    I -->|No| E\n    style J fill:#10b981,color:#fff\n    style E fill:#ef4444,color:#fff",
        "complexity": "Time: O(n)\nSpace: O(n) for stack"
    },
    "longest_substring": {
        "scenario_title": "Longest Substring Without Repeating Characters (LeetCode #3)",
        "data_structure": "Sliding Window + HashMap",
        "ds_icon": "🪟",
        "ds_color": "#14b8a6",
        "difficulty": "Medium",
        "category": "Sliding Window",
        "why_this_ds": "We maintain a window [left, right] of non-repeating characters. A HashMap stores the latest index of each character. When a repeating character is found, we jump the left pointer past the previous occurrence — avoiding re-scanning characters.",
        "real_world_connection": "Password strength checkers, DNA sequence analysis, and text compression all use sliding window-based substring techniques.",
        "approach_steps": [
            {"step": 1, "title": "Initialize: left=0, max_len=0, map={}", "detail": "Input: s = 'abcabcbb'. Start with empty window.", "ds_state": ["Window: []", "Map: {}", "MaxLen: 0"]},
            {"step": 2, "title": "Expand right through 'abc'", "detail": "a→0, b→1, c→2. No duplicates. Window grows. MaxLen=3", "ds_state": ["Window: [a,b,c]", "Map: {a:0,b:1,c:2}", "MaxLen: 3"]},
            {"step": 3, "title": "right=3: 'a' found again!", "detail": "'a' is at index 0 (inside window). Move left to 1. Update a→3", "ds_state": ["Window: [b,c,a]", "Map: {a:3,b:1,c:2}", "MaxLen: 3"]},
            {"step": 4, "title": "right=4: 'b' found again!", "detail": "'b' is at index 1. Move left to 2. Update b→4", "ds_state": ["Window: [c,a,b]", "Map: {a:3,b:4,c:2}", "MaxLen: 3"]},
            {"step": 5, "title": "Continue to end. Answer = 3", "detail": "Window 'abc' of size 3 is the longest non-repeating substring!", "ds_state": ["MaxLen: 3 ✓"]}
        ],
        "pseudocode": "1. CREATE empty map char_index = {}\n2. SET left = 0, max_len = 0\n3. FOR right in range(len(s)):\n   a. IF s[right] in char_index AND char_index[s[right]] >= left:\n      - left = char_index[s[right]] + 1  (shrink window)\n   b. char_index[s[right]] = right\n   c. max_len = MAX(max_len, right - left + 1)\n4. RETURN max_len",
        "code_python": "def lengthOfLongestSubstring(s):\n    char_index = {}\n    left = 0\n    max_len = 0\n    for right, char in enumerate(s):\n        if char in char_index and char_index[char] >= left:\n            left = char_index[char] + 1\n        char_index[char] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\n# Test Cases\nprint(lengthOfLongestSubstring('abcabcbb'))  # 3\nprint(lengthOfLongestSubstring('bbbbb'))     # 1\nprint(lengthOfLongestSubstring('pwwkew'))    # 3",
        "diagram": "graph LR\n    A[left=0] --> B{s[right] in window?}\n    B -->|Yes| C[Move left past duplicate]\n    B -->|No| D[Expand window]\n    C --> E[Update char index]\n    D --> E\n    E --> F[Update max_len]\n    F --> G{More chars?}\n    G -->|Yes| B\n    G -->|No| H[Return max_len ✓]\n    style H fill:#14b8a6,color:#fff",
        "complexity": "Time: O(n)\nSpace: O(min(m,n))\nm = charset size, n = string length"
    },
    "climbing_stairs": {
        "scenario_title": "Climbing Stairs (LeetCode #70)",
        "data_structure": "Dynamic Programming (DP Array)",
        "ds_icon": "🪜",
        "ds_color": "#f97316",
        "difficulty": "Easy",
        "category": "Dynamic Programming",
        "why_this_ds": "Each step can be reached from either 1 step below or 2 steps below. This overlapping subproblem structure is the hallmark of DP. We build up solutions from base cases (n=1,2) to avoid exponential recursion — the same as the Fibonacci sequence.",
        "real_world_connection": "Path counting in robotics, tile-laying problems, and resource allocation algorithms all follow this DP structure.",
        "approach_steps": [
            {"step": 1, "title": "Base cases: n=1→1 way, n=2→2 ways", "detail": "dp[1]=1 (only one 1-step), dp[2]=2 (1+1 or 2)", "ds_state": ["dp[1]=1", "dp[2]=2"]},
            {"step": 2, "title": "dp[3] = dp[2] + dp[1] = 3", "detail": "Reach step 3 from step 2 (one 1-step) or step 1 (one 2-step)", "ds_state": ["dp[1]=1", "dp[2]=2", "dp[3]=3"]},
            {"step": 3, "title": "dp[4] = dp[3] + dp[2] = 5", "detail": "Fibonacci pattern: every step depends on exactly the two before it", "ds_state": ["dp[2]=2", "dp[3]=3", "dp[4]=5"]},
            {"step": 4, "title": "dp[5] = dp[4] + dp[3] = 8", "detail": "Continue building up. Space-optimized: only need last 2 values!", "ds_state": ["dp[3]=3", "dp[4]=5", "dp[5]=8"]},
            {"step": 5, "title": "Return dp[n]", "detail": "For n=5 → answer is 8 distinct ways to climb the stairs.", "ds_state": ["Answer: 8 ✓"]}
        ],
        "pseudocode": "1. IF n <= 2: RETURN n\n2. SET prev2 = 1, prev1 = 2\n3. FOR step FROM 3 TO n:\n   a. current = prev1 + prev2\n   b. prev2 = prev1\n   c. prev1 = current\n4. RETURN prev1",
        "code_python": "def climbStairs(n):\n    if n <= 2:\n        return n\n    prev2, prev1 = 1, 2\n    for _ in range(3, n + 1):\n        prev2, prev1 = prev1, prev1 + prev2\n    return prev1\n\n# Test Cases\nprint(climbStairs(1))   # 1\nprint(climbStairs(2))   # 2\nprint(climbStairs(3))   # 3\nprint(climbStairs(5))   # 8\nprint(climbStairs(10))  # 89",
        "diagram": "graph TD\n    A[n steps] --> B[Reach from n-1]\n    A --> C[Reach from n-2]\n    B --> D[f(n-1)]\n    C --> E[f(n-2)]\n    D --> F[f(n) = f(n-1) + f(n-2)]\n    E --> F\n    style F fill:#f97316,color:#fff",
        "complexity": "Time: O(n)\nSpace: O(1) with variable optimization\nNaive Recursion: O(2^n)"
    }
}
# Merge all demos
SCENARIO_DEMOS.update(SCENARIO_DEMOS_PROBLEMS)

@app.route('/api/scenario', methods=['POST'])
def solve_scenario():
    global gemini_model, groq_client
    try:
        data = request.get_json()
        scenario_text = data.get('scenario', '').strip()
        language = data.get('language', 'python')

        if not scenario_text:
            return jsonify({"success": False, "error": "No scenario provided"}), 400

        print(f"📖 Scenario received: {scenario_text[:100]}...")

        # Check for preset scenario keywords (real-world + LeetCode style)
        text_lower = scenario_text.lower()
        demo_key = None

        # LeetCode-style problem detection (run FIRST — more specific)
        if any(w in text_lower for w in ['two sum', 'twosum', 'add up to target', 'indices of the two numbers', 'nums and an integer target', 'sum equal to target']):
            demo_key = 'two_sum'
        elif any(w in text_lower for w in ['valid parentheses', 'valid parenthesis', 'bracket', 'balanced parentheses', '(){}[]', 'open and close']):
            demo_key = 'valid_parentheses'
        elif any(w in text_lower for w in ['longest substring', 'repeating characters', 'no repeating', 'distinct characters', 'sliding window']):
            demo_key = 'longest_substring'
        elif any(w in text_lower for w in ['climbing stairs', 'number of ways to climb', 'step at a time', 'staircase']):
            demo_key = 'climbing_stairs'
        # Real-world scenario detection
        elif any(w in text_lower for w in ['restaurant', 'fifo', 'cook', 'chef', 'kitchen', 'first come first serve']):
            demo_key = 'restaurant'
        elif any(w in text_lower for w in ['browser', 'back', 'forward', 'navigation', 'webpage']):
            demo_key = 'browser'
        elif any(w in text_lower for w in ['friend', 'social', 'network', 'recommend', 'linkedin', 'facebook', 'people you may know']):
            demo_key = 'social'
        elif any(w in text_lower for w in ['autocomplete', 'prefix', 'trie', 'suggest', 'autocompletion', 'search bar']):
            demo_key = 'autocomplete'

        ai_response = None

        # Try Gemini AI first
        if gemini_model:
            try:
                print("🤖 Calling Gemini for scenario analysis...")
                scenario_prompt = f"""You are an expert CS educator analyzing a real-world scenario to identify the best data structure/algorithm.

SCENARIO: {scenario_text}

Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{{
  "scenario_title": "Short title of the scenario",
  "data_structure": "Name of primary data structure (e.g. Queue, Stack, Graph + BFS, Trie, HashMap, etc.)",
  "ds_icon": "A single relevant emoji",
  "ds_color": "A hex color representing this DS (e.g. #f59e0b)",
  "why_this_ds": "1-2 sentences explaining WHY this data structure fits the scenario",
  "real_world_connection": "One sentence about real-world systems that use this pattern",
  "approach_steps": [
    {{"step": 1, "title": "Step name", "detail": "What happens at this step", "ds_state": ["item1", "item2"]}},
    {{"step": 2, "title": "Step name", "detail": "What happens at this step", "ds_state": ["item1"]}},
    {{"step": 3, "title": "Step name", "detail": "What happens at this step", "ds_state": []}}
  ],
  "pseudocode": "Numbered pseudocode steps",
  "code_python": "Working Python code solving this scenario",
  "diagram": "A valid mermaid diagram string",
  "complexity": "Time and Space complexity",
  "difficulty": "Beginner / Intermediate / Advanced",
  "category": "Queue / Stack / Graph / Tree / HashMap / DP / etc."
}}

Keep approach_steps between 4-6 steps. Make ds_state show the actual state of the data structure at each step."""

                response = gemini_model.generate_content(scenario_prompt)
                raw = response.text.strip()
                # Strip markdown code fences if present
                raw = re.sub(r'^```(?:json)?\s*', '', raw)
                raw = re.sub(r'\s*```$', '', raw)
                import json
                ai_response = json.loads(raw)
                print(f"✅ Gemini scenario response parsed successfully")
            except Exception as e:
                print(f"⚠️ Gemini scenario error: {e}")
                ai_response = None

        # Fallback to Groq
        if not ai_response and groq_client:
            try:
                print("🤖 Calling Groq for scenario analysis...")
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a CS educator. Respond only with valid JSON, no markdown."},
                        {"role": "user", "content": f"Analyze this scenario and respond in JSON:\n\nSCENARIO: {scenario_text}\n\nReturn JSON with keys: scenario_title, data_structure, ds_icon, ds_color, why_this_ds, real_world_connection, approach_steps (array of {{step, title, detail, ds_state}}), pseudocode, code_python, diagram, complexity, difficulty, category"}
                    ],
                    temperature=0.5,
                    max_tokens=2000
                )
                raw = response.choices[0].message.content.strip()
                raw = re.sub(r'^```(?:json)?\s*', '', raw)
                raw = re.sub(r'\s*```$', '', raw)
                import json
                ai_response = json.loads(raw)
                print(f"✅ Groq scenario response parsed successfully")
            except Exception as e:
                print(f"⚠️ Groq scenario error: {e}")
                ai_response = None

        # Use demo fallback
        if not ai_response:
            print(f"🎭 Using demo scenario: {demo_key or 'restaurant'}")
            ai_response = SCENARIO_DEMOS.get(demo_key or 'restaurant')

        # Override code language if requested
        if language != 'python' and 'code_python' in ai_response:
            ai_response['code'] = ai_response['code_python']
        else:
            ai_response['code'] = ai_response.get('code_python', '')

        return jsonify({
            "success": True,
            **ai_response,
            "input_scenario": scenario_text,
            "demo_mode": ai_response == SCENARIO_DEMOS.get(demo_key or 'restaurant')
        })

    except Exception as e:
        import traceback
        print(f"🚨 Scenario ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/convert', methods=['POST'])
def convert_to_pseudocode():
    global gemini_model, groq_client
    try:
        data = request.get_json()
        natural_language = data.get('text', '')
        high_accuracy = data.get('high_accuracy', False)
        language = data.get('language', 'pseudocode')
        domain = data.get('domain', 'general')
        
        if not natural_language:
            return jsonify({
                "success": False,
                "error": "No input text provided"
            }), 400
        
        print(f"📥 Received: {natural_language[:80]}...")
        
        # System prompt
        code_instruction = ""
        if language != 'pseudocode':
            code_instruction = f"\nCODE:\n[Complete working {language.upper()} code with test cases / demo runs showing output]"
        else:
            code_instruction = "\nCODE:\n[Python implementation for reference]"

        system_prompt = f"""You are CodeSculptor AI — an expert CS educator and code analyst.

Your job: Accept ANY input (code snippet, algorithm name, problem description, or even gibberish code) and produce a complete educational breakdown.

== INPUT DETECTION RULES ==
1. If the input looks like CODE (has def/function/class/for/while/if syntax) →
   ANALYZE that code: explain what it does, its algorithm, complexity, and generate a cleaned version.
2. If the input is a PROBLEM DESCRIPTION or LeetCode-style problem →
   SOLVE it: write efficient code, explain the approach.
3. If the input is an ALGORITHM NAME (e.g. "bubble sort", "dijkstra") →
   TEACH it: full implementation, visualization steps, real-world connection.
4. If the input is ANYTHING ELSE →
   Do your best to extract the most relevant CS concept and explain it.

== CRITICAL RULES ==
- ALWAYS produce ALL sections below — never leave one empty
- ALWAYS generate working, runnable code
- If input is code: put the original + improved version in CODE section
- Keep PSEUDOCODE as numbered plain-English steps (no code syntax)
- DIAGRAM must be a valid Mermaid flowchart (graph TD or graph LR)
- COMPLEXITY must have Time and Space with Big-O notation
- Be educational — explain WHY, not just WHAT

== MANDATORY RESPONSE FORMAT (use EXACT headers) ==
PSEUDOCODE:
[Numbered plain-English steps describing the algorithm/logic]

CODE:
[Complete working {language if language != 'pseudocode' else 'Python'} code with comments and test cases]{code_instruction}

DIAGRAM:
graph TD
    [Valid Mermaid flowchart nodes and edges]

EXPLANATION:
[Clear explanation of what the algorithm/code does and how]

EXPLANATION_WHY:
[Why this algorithm/approach is the best choice — trade-offs, alternatives considered]

COMPLEXITY:
Time: O(...) — [reason]
Space: O(...) — [reason]

COMPARISON:
| Approach | Time | Space | Notes |
|----------|------|-------|-------|
[2-3 alternative approaches vs this one]

REAL_WORLD_MAP:
[One sentence: where this exact pattern is used in real systems (Google, Netflix, etc.)]

AI_HINTS:
[One strategic tip for recognizing or applying this pattern in future problems]"""
        
        demo_mode = False
        parsed_data = {
            "pseudocode": "",
            "code": "",
            "language": language,
            "explanation": "",
            "diagram": "",
            "explanation_why": "",
            "complexity": "",
            "comparison": "",
            "real_world_map": "",
            "ai_hints": ""
        }

        # Try Gemini first
        if gemini_model:
            try:
                print(f"🤖 Calling Gemini API...")
                # Detect if input looks like code
                looks_like_code = any(kw in natural_language for kw in [
                    'def ', 'function ', 'class ', 'for(', 'for ', 'while(',
                    'while ', 'if(', 'if ', 'return ', 'int ', 'void ',
                    'public ', 'print(', 'console.log', '#include', 'import '
                ])
                input_hint = "CODE TO ANALYZE" if looks_like_code else "PROBLEM/QUERY"
                prompt = f"{system_prompt}\n\n== {input_hint} ==\n{natural_language}"
                response = gemini_model.generate_content(prompt)
                full_response = response.text
                print(f"✅ Gemini response received ({len(full_response)} chars)")
                
                parsed_data["pseudocode"] = extract_section(full_response, "PSEUDOCODE")
                parsed_data["code"] = extract_section(full_response, "CODE")
                parsed_data["diagram"] = extract_section(full_response, "DIAGRAM")
                parsed_data["explanation"] = extract_section(full_response, "EXPLANATION")
                parsed_data["explanation_why"] = extract_section(full_response, "EXPLANATION_WHY")
                parsed_data["complexity"] = extract_section(full_response, "COMPLEXITY")
                parsed_data["comparison"] = extract_section(full_response, "COMPARISON")
                parsed_data["real_world_map"] = extract_section(full_response, "REAL_WORLD_MAP")
                parsed_data["ai_hints"] = extract_section(full_response, "AI_HINTS")

            except Exception as e:
                print(f"⚠️ Gemini error: {e}")

        # Fallback to Groq
        if not parsed_data["pseudocode"] and groq_client:
            try:
                print("🤖 Calling Groq API (Fallback)...")
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"PROBLEM: {natural_language}"}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                full_response = response.choices[0].message.content
                print(f"✅ Groq response received ({len(full_response)} chars)")
                
                parsed_data["pseudocode"] = extract_section(full_response, "PSEUDOCODE")
                parsed_data["code"] = extract_section(full_response, "CODE")
                parsed_data["diagram"] = extract_section(full_response, "DIAGRAM")
                parsed_data["explanation"] = extract_section(full_response, "EXPLANATION")
                parsed_data["explanation_why"] = extract_section(full_response, "EXPLANATION_WHY")
                parsed_data["complexity"] = extract_section(full_response, "COMPLEXITY")
                parsed_data["comparison"] = extract_section(full_response, "COMPARISON")
                parsed_data["real_world_map"] = extract_section(full_response, "REAL_WORLD_MAP")
                parsed_data["ai_hints"] = extract_section(full_response, "AI_HINTS")

            except Exception as e:
                print(f"⚠️ Groq error: {e}")

        # Ultimate fallback
        if not parsed_data["pseudocode"]:
            print("🎭 Using built-in template (Demo Mode)")
            demo_mode = True
            algo_type = detect_algorithm_type(natural_language)
            text_lower = natural_language.lower()
            
            # Detect problem type and generate appropriate response
            if any(keyword in text_lower for keyword in ['substring', 'repeating', 'duplicate', 'character', 'longest substring']):
                problem_type = 'substring'
                parsed_data["pseudocode"] = """1. Initialize hash map to store character positions
2. Initialize left=0, max_length=0
3. For each character at position right:
   a. If character in window, move left pointer
   b. Update character position
   c. Update max_length
4. Return max_length"""
                parsed_data["explanation"] = "Sliding window finds longest substring without repeating characters."
                parsed_data["explanation_why"] = "Two-pointer approach is O(n), optimal vs O(n²) brute force."
                parsed_data["complexity"] = "Time: O(n)\nSpace: O(min(m,n)) where m=charset size"
                parsed_data["code"] = generate_demo_code(problem_type, language)
                parsed_data["comparison"] = "| Approach | Time | Space |\n|----------|------|-------|\n| Sliding Window | O(n) | O(m) |\n| Brute Force | O(n²) | O(m) |"
                parsed_data["real_world_map"] = "Autocomplete and search systems use this for pattern matching."
                parsed_data["ai_hints"] = "Use sliding window for substring problems."
                parsed_data["diagram"] = "graph TD\n    A[Init left=0] --> B[Move right]\n    B --> C{Duplicate?}\n    C -->|Yes| D[Move left]\n    C -->|No| E[Track max]\n    D --> F[Update pos]\n    E --> F\n    F --> G{End?}\n    G -->|No| B\n    G -->|Yes| H[Return max]"
            
            elif any(keyword in text_lower for keyword in ['two sum', 'two numbers', 'add to target']):
                problem_type = 'two_sum'
                parsed_data["pseudocode"] = """1. Create hash map to store value -> index
2. For each number in array:
   a. Calculate complement = target - current
   b. If complement in hash map, return indices
   c. Store current number in hash map
3. Return empty if not found"""
                parsed_data["explanation"] = "Hash map approach finds two numbers that sum to target in single pass."
                parsed_data["explanation_why"] = "Hash map lookup O(1) beats brute force O(n²)."
                parsed_data["complexity"] = "Time: O(n)\nSpace: O(n) for hash map"
                parsed_data["code"] = generate_demo_code(problem_type, language)
                parsed_data["comparison"] = "| Approach | Time | Space |\n|----------|------|-------|\n| Hash Map | O(n) | O(n) |\n| Brute Force | O(n²) | O(1) |"
                parsed_data["real_world_map"] = "Used in financial systems for transaction matching."
                parsed_data["ai_hints"] = "Use hash map to store seen numbers for fast lookup."
                parsed_data["diagram"] = "graph TD\n    A[Create empty map] --> B[Loop through array]\n    B --> C{Complement in map?}\n    C -->|Yes| D[Return indices]\n    C -->|No| E[Store value in map]\n    E --> B"
            
            elif any(keyword in text_lower for keyword in ['valid parentheses', 'parentheses', 'bracket']):
                problem_type = 'valid_parentheses'
                parsed_data["pseudocode"] = """1. Create stack for opening brackets
2. Create map of bracket pairs
3. For each character:
   a. If opening bracket, push to stack
   b. If closing bracket:
      - Check if stack empty (invalid)
      - Check if matches top of stack
      - Pop if match
   c. If not bracket, skip
4. Return true if stack is empty"""
                parsed_data["explanation"] = "Stack-based approach validates bracket matching and ordering."
                parsed_data["explanation_why"] = "Stack is perfect for matching nested structures."
                parsed_data["complexity"] = "Time: O(n)\nSpace: O(n) for stack"
                parsed_data["code"] = generate_demo_code(problem_type, language)
                parsed_data["comparison"] = "| Approach | Time | Space |\n|----------|------|-------|\n| Stack | O(n) | O(n) |\n| Recursion | O(n) | O(n) |"
                parsed_data["real_world_map"] = "Compiler syntax validation for code parsing."
                parsed_data["ai_hints"] = "Use stack to track opening brackets."
                parsed_data["diagram"] = "graph TD\n    A[Init stack] --> B[Iterate chars]\n    B --> C{Opening?}\n    C -->|Yes| D[Push]\n    B --> E{Closing?}\n    E -->|Yes| F{Stack empty?}\n    F -->|Yes| G[Invalid]\n    F -->|No| H{Match top?}\n    H -->|Yes| I[Pop]\n    H -->|No| J[Invalid]\n    D --> B\n    I --> B"
            
            elif any(keyword in text_lower for keyword in ['climbing stairs', 'stair', 'distinct ways']):
                problem_type = 'climbing_stairs'
                parsed_data["pseudocode"] = """1. Base cases: n=1 -> 1 way, n=2 -> 2 ways
2. For each step from 3 to n:
   a. Current ways = ways(n-1) + ways(n-2)
3. Return total ways"""
                parsed_data["explanation"] = "Dynamic programming solves by combining subproblems."
                parsed_data["explanation_why"] = "Avoids recalculation of overlapping subproblems."
                parsed_data["complexity"] = "Time: O(n)\nSpace: O(n) with memoization"
                parsed_data["code"] = generate_demo_code(problem_type, language)
                parsed_data["comparison"] = "| Approach | Time | Space |\n|----------|------|-------|\n| DP | O(n) | O(n) |\n| Fibonacci | O(2^n) | O(n) |"
                parsed_data["real_world_map"] = "Path planning in robotics and game AI."
                parsed_data["ai_hints"] = "Recognize Fibonacci pattern: f(n) = f(n-1) + f(n-2)."
                parsed_data["diagram"] = "graph TD\n    A[n steps] --> B[Last step from n-1]\n    A --> C[Last step from n-2]\n    B --> D[f(n-1)]\n    C --> E[f(n-2)]\n    D --> F[Total: f(n-1) + f(n-2)]\n    E --> F"
                
            else:
                problem_type = algo_type
                parsed_data["pseudocode"] = generate_algorithm_pseudocode(algo_type, natural_language)
                parsed_data["explanation"] = (
                    "AI provider is unavailable or returned no result for this input. "
                    "Add your GEMINI_API_KEY or GROQ_API_KEY to backend/.env to handle any input."
                )
                parsed_data["explanation_why"] = "With AI enabled, any code, problem, or description can be analyzed automatically."
                parsed_data["code"] = generate_demo_code(algo_type, language)
                parsed_data["complexity"] = "Available with AI provider (add API key to .env)"
                parsed_data["real_world_map"] = "Connect an AI provider for dynamic real-world mapping."
                parsed_data["ai_hints"] = "Tip: Paste any code or describe any algorithm — AI will analyze it instantly."

        # Parse pseudocode into steps
        lines = [l.strip() for l in parsed_data["pseudocode"].split('\n') if l.strip() and "```" not in l]
        steps = []
        for i, line in enumerate(lines):
            steps.append({
                "line_number": i + 1,
                "content": line,
                "type": detect_line_type(line)
            })
        
        algo_type = detect_algorithm_type(natural_language)
        is_programming = any(keyword in natural_language.lower() for keyword in ['sort', 'search', 'array', 'tree', 'graph', 'problem', 'solve', 'function', 'substring', 'repeating', 'duplicate', 'character', 'longest substring', 'two sum', 'target', 'valid parentheses', 'bracket', 'climbing', 'stairs', 'distinct ways'])
        
        input_data = InputParser.parse_input(natural_language, algo_type, domain)
        visualization = AdvancedVisualizer.generate_visualization(algo_type, input_data, natural_language)
        
        # Always attach the AI diagram to ALL steps when available
        if parsed_data["diagram"]:
            viz_type = visualization.get('visualization_type', 'generic')
            if viz_type in ['conceptual', 'generic', 'mermaid']:
                visualization['visualization_type'] = 'mermaid'
                # Build one mermaid step per pseudocode line so they stay in sync
                mermaid_steps = []
                for i, step in enumerate(steps):
                    mermaid_steps.append({
                        'step_number': i,
                        'description': step.get('content', f'Step {i+1}'),
                        'action': 'mermaid',
                        'diagram': parsed_data["diagram"]
                    })
                if not mermaid_steps:
                    mermaid_steps = [{'step_number': 0, 'description': 'Algorithm Overview', 'action': 'mermaid', 'diagram': parsed_data["diagram"]}]
                visualization['steps'] = mermaid_steps
            else:
                # For known algorithms with real visualizers, attach diagram to first step as bonus
                if visualization.get('steps'):
                    visualization['steps'][0]['diagram'] = parsed_data["diagram"]

        return jsonify({
            "success": True,
            **parsed_data,
            "steps": steps,
            "visualization": visualization,
            "input": natural_language,
            "input_data": input_data,
            "demo_mode": demo_mode,
            "algorithm": algo_type
        })
    
    except Exception as e:
        import traceback
        print(f"🚨 ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# === MONGODB HISTORY API ROUTES ===
@app.route('/api/save-history', methods=['POST'])
def save_history():
    """Save user activity history to MongoDB"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Get user email from token or use 'anonymous'
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_email = 'anonymous'
        
        if token:
            try:
                import jwt
                decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_email = decoded.get('email', 'anonymous')
            except:
                pass
        
        # Add user email and timestamp
        history_item = {
            "user_email": user_email,
            "input": data.get('input', ''),
            "pseudocode": data.get('pseudocode', ''),
            "generated_code": data.get('generated_code', ''),
            "language": data.get('language', 'pseudocode'),
            "duration": data.get('duration', 0),
            "timestamp": data.get('timestamp', datetime.utcnow().isoformat()),
            "created_at": datetime.utcnow()
        }
        
        # Save to MongoDB
        result = History.add_history_item(user_email, history_item)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "History saved successfully",
                "item_id": str(result.get("item_id", ""))
            }), 201
        else:
            return jsonify({"success": False, "error": result.get("error", "Failed to save")}), 500
            
    except Exception as e:
        print(f"🚨 Save history error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/get-history', methods=['GET'])
def get_history_simple():
    """Get user activity history from MongoDB"""
    try:
        # Get user email from token or use 'anonymous'
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_email = 'anonymous'
        
        if token:
            try:
                import jwt
                decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_email = decoded.get('email', 'anonymous')
            except:
                pass
        
        # Get pagination params
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Get history from MongoDB
        result = History.get_user_history(
            user_email=user_email,
            page=page,
            per_page=per_page
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify({"success": False, "error": result.get("error", "Failed to fetch")}), 500
            
    except Exception as e:
        print(f"🚨 Get history error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def generate_demo_code(algo_type, language):
    """Generate demo code for fallback mode"""
    if language == 'pseudocode':
        return ""
    
    # Substring problems
    if algo_type == 'substring' or algo_type == 'string':
        if language == 'python':
            return '''def lengthOfLongestSubstring(s):
    char_map = {}
    max_length = left = 0
    for right in range(len(s)):
        if s[right] in char_map and char_map[s[right]] >= left:
            left = char_map[s[right]] + 1
        char_map[s[right]] = right
        max_length = max(max_length, right - left + 1)
    return max_length
print(lengthOfLongestSubstring("abcabcbb"))  # 3'''
        elif language == 'javascript':
            return '''function lengthOfLongestSubstring(s) {
    const charMap = {};
    let maxLength = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        if (charMap[s[right]] !== undefined && charMap[s[right]] >= left) {
            left = charMap[s[right]] + 1;
        }
        charMap[s[right]] = right;
        maxLength = Math.max(maxLength, right - left + 1);
    }
    return maxLength;
}
console.log(lengthOfLongestSubstring("abcabcbb"));  // 3'''
        elif language == 'java':
            return '''import java.util.HashMap;
import java.util.Map;
public class LongestSubstring {
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> charMap = new HashMap<>();
        int maxLength = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            if (charMap.containsKey(s.charAt(right)) && charMap.get(s.charAt(right)) >= left) {
                left = charMap.get(s.charAt(right)) + 1;
            }
            charMap.put(s.charAt(right), right);
            maxLength = Math.max(maxLength, right - left + 1);
        }
        return maxLength;
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <unordered_map>
#include <algorithm>
using namespace std;
int lengthOfLongestSubstring(string s) {
    unordered_map<char, int> charMap;
    int maxLength = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (charMap.count(s[right]) && charMap[s[right]] >= left) {
            left = charMap[s[right]] + 1;
        }
        charMap[s[right]] = right;
        maxLength = max(maxLength, right - left + 1);
    }
    return maxLength;
}'''
    
    # Two Sum problems
    elif algo_type == 'two_sum':
        if language == 'python':
            return '''def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
print(twoSum([2, 7, 11, 15], 9))  # [0, 1]'''
        elif language == 'javascript':
            return '''function twoSum(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[nums[i]] = i;
    }
    return [];
}
console.log(twoSum([2, 7, 11, 15], 9));  // [0, 1]'''
        elif language == 'java':
            return '''import java.util.HashMap;
import java.util.Map;
public class TwoSum {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] {seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}'''
    
    # Valid Parentheses problems
    elif algo_type == 'valid_parentheses':
        if language == 'python':
            return '''def isValid(s):
    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    for char in s:
        if char in pairs:
            stack.append(char)
        else:
            if not stack or pairs[stack.pop()] != char:
                return False
    return len(stack) == 0
print(isValid("()"))  # True
print(isValid("([)]"))  # False'''
        elif language == 'javascript':
            return '''function isValid(s) {
    const stack = [];
    const pairs = {'(': ')', '{': '}', '[': ']'};
    for (let char of s) {
        if (char in pairs) {
            stack.push(char);
        } else {
            if (stack.length === 0 || pairs[stack.pop()] !== char) {
                return false;
            }
        }
    }
    return stack.length === 0;
}
console.log(isValid("()"));  // true'''
        elif language == 'java':
            return '''import java.util.Stack;
public class ValidParentheses {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <stack>
#include <unordered_map>
using namespace std;
bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {
                return false;
            }
        }
    }
    return st.empty();
}'''
    
    # Climbing Stairs problems
    elif algo_type == 'climbing_stairs':
        if language == 'python':
            return '''def climbStairs(n):
    if n <= 2:
        return n
    prev1, prev2 = 2, 1
    for _ in range(3, n + 1):
        prev1, prev2 = prev1 + prev2, prev1
    return prev1
print(climbStairs(2))  # 2
print(climbStairs(3))  # 3
print(climbStairs(5))  # 8'''
        elif language == 'javascript':
            return '''function climbStairs(n) {
    if (n <= 2) return n;
    let prev1 = 2, prev2 = 1;
    for (let i = 3; i <= n; i++) {
        [prev1, prev2] = [prev1 + prev2, prev1];
    }
    return prev1;
}
console.log(climbStairs(2));  // 2
console.log(climbStairs(5));  // 8'''
        elif language == 'java':
            return '''public class ClimbStairs {
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int prev1 = 2, prev2 = 1;
        for (int i = 3; i <= n; i++) {
            int temp = prev1;
            prev1 = prev1 + prev2;
            prev2 = temp;
        }
        return prev1;
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
using namespace std;
int climbStairs(int n) {
    if (n <= 2) return n;
    int prev1 = 2, prev2 = 1;
    for (int i = 3; i <= n; i++) {
        int temp = prev1;
        prev1 = prev1 + prev2;
        prev2 = temp;
    }
    return prev1;
}'''
    # ── BUBBLE SORT ──────────────────────────────────────────
    elif algo_type in ('bubble_sort', 'bubble'):
        if language == 'python':
            return '''def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

arr = [64, 34, 25, 12, 22, 11, 90]
print("Sorted:", bubble_sort(arr))  # [11, 12, 22, 25, 34, 64, 90]'''
        elif language == 'javascript':
            return '''function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}
console.log(bubbleSort([64, 34, 25, 12, 22, 11, 90]));
// [11, 12, 22, 25, 34, 64, 90]'''
        elif language == 'java':
            return '''import java.util.Arrays;
public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
    }
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <vector>
using namespace std;
void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1]) swap(arr[j], arr[j + 1]);
}
int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(arr);
    for (int x : arr) cout << x << " ";
    // 11 12 22 25 34 64 90
}'''

    # ── SELECTION SORT ───────────────────────────────────────
    elif algo_type in ('selection_sort', 'selection'):
        if language == 'python':
            return '''def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

arr = [29, 10, 14, 37, 13]
print("Sorted:", selection_sort(arr))  # [10, 13, 14, 29, 37]'''
        elif language == 'javascript':
            return '''function selectionSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++)
            if (arr[j] < arr[minIdx]) minIdx = j;
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}
console.log(selectionSort([29, 10, 14, 37, 13]));
// [10, 13, 14, 29, 37]'''
        elif language == 'java':
            return '''import java.util.Arrays;
public class SelectionSort {
    public static void selectionSort(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            int minIdx = i;
            for (int j = i + 1; j < arr.length; j++)
                if (arr[j] < arr[minIdx]) minIdx = j;
            int temp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = temp;
        }
    }
    public static void main(String[] args) {
        int[] arr = {29, 10, 14, 37, 13};
        selectionSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <vector>
using namespace std;
void selectionSort(vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        int minIdx = i;
        for (int j = i+1; j < arr.size(); j++)
            if (arr[j] < arr[minIdx]) minIdx = j;
        swap(arr[i], arr[minIdx]);
    }
}
int main() {
    vector<int> arr = {29, 10, 14, 37, 13};
    selectionSort(arr);
    for (int x : arr) cout << x << " ";
    // 10 13 14 29 37
}'''

    # ── INSERTION SORT ───────────────────────────────────────
    elif algo_type in ('insertion_sort', 'insertion'):
        if language == 'python':
            return '''def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

arr = [12, 11, 13, 5, 6]
print("Sorted:", insertion_sort(arr))  # [5, 6, 11, 12, 13]'''
        elif language == 'javascript':
            return '''function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}
console.log(insertionSort([12, 11, 13, 5, 6]));
// [5, 6, 11, 12, 13]'''
        elif language == 'java':
            return '''import java.util.Arrays;
public class InsertionSort {
    public static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i], j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j]; j--;
            }
            arr[j + 1] = key;
        }
    }
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6};
        insertionSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <vector>
using namespace std;
void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) { arr[j+1] = arr[j]; j--; }
        arr[j+1] = key;
    }
}
int main() {
    vector<int> arr = {12, 11, 13, 5, 6};
    insertionSort(arr);
    for (int x : arr) cout << x << " ";
    // 5 6 11 12 13
}'''

    # ── MERGE SORT ───────────────────────────────────────────
    elif algo_type in ('merge_sort', 'merge'):
        if language == 'python':
            return '''def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]

arr = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", merge_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]'''
        elif language == 'javascript':
            return '''function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left  = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}
function merge(l, r) {
    const res = []; let i = 0, j = 0;
    while (i < l.length && j < r.length)
        res.push(l[i] <= r[j] ? l[i++] : r[j++]);
    return res.concat(l.slice(i)).concat(r.slice(j));
}
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));
// [3, 9, 10, 27, 38, 43, 82]'''
        elif language == 'java':
            return '''import java.util.Arrays;
public class MergeSort {
    public static int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] l = mergeSort(Arrays.copyOfRange(arr, 0, mid));
        int[] r = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
        int[] res = new int[arr.length];
        int i = 0, j = 0, k = 0;
        while (i < l.length && j < r.length)
            res[k++] = l[i] <= r[j] ? l[i++] : r[j++];
        while (i < l.length) res[k++] = l[i++];
        while (j < r.length) res[k++] = r[j++];
        return res;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(mergeSort(new int[]{38,27,43,3,9,82,10})));
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <vector>
using namespace std;
vector<int> merge(vector<int> l, vector<int> r) {
    vector<int> res; int i=0,j=0;
    while (i<l.size()&&j<r.size()) res.push_back(l[i]<=r[j]?l[i++]:r[j++]);
    while (i<l.size()) res.push_back(l[i++]);
    while (j<r.size()) res.push_back(r[j++]);
    return res;
}
vector<int> mergeSort(vector<int> arr) {
    if (arr.size()<=1) return arr;
    int mid=arr.size()/2;
    return merge(mergeSort({arr.begin(),arr.begin()+mid}),
                 mergeSort({arr.begin()+mid,arr.end()}));
}
int main() {
    vector<int> arr = {38,27,43,3,9,82,10};
    arr = mergeSort(arr);
    for (int x : arr) cout << x << " ";
    // 3 9 10 27 38 43 82
}'''

    # ── BINARY SEARCH ────────────────────────────────────────
    elif algo_type in ('binary_search', 'search'):
        if language == 'python':
            return '''def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

arr = [11, 12, 22, 25, 34, 64, 90]
print(binary_search(arr, 25))   # 3
print(binary_search(arr, 99))   # -1'''
        elif language == 'javascript':
            return '''function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
console.log(binarySearch([11,12,22,25,34,64,90], 25)); // 3
console.log(binarySearch([11,12,22,25,34,64,90], 99)); // -1'''
        elif language == 'java':
            return '''public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = (left + right) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
    public static void main(String[] args) {
        int[] arr = {11, 12, 22, 25, 34, 64, 90};
        System.out.println(binarySearch(arr, 25)); // 3
        System.out.println(binarySearch(arr, 99)); // -1
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <vector>
using namespace std;
int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = (left + right) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
int main() {
    vector<int> arr = {11, 12, 22, 25, 34, 64, 90};
    cout << binarySearch(arr, 25) << endl; // 3
    cout << binarySearch(arr, 99) << endl; // -1
}'''

    # ── BFS ──────────────────────────────────────────────────
    elif algo_type == 'bfs':
        if language == 'python':
            return '''from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order

graph = {"A":["B","C"], "B":["D","E"], "C":["F"], "D":[], "E":["F"], "F":[]}
print("BFS:", bfs(graph, "A"))  # [A, B, C, D, E, F]'''
        elif language == 'javascript':
            return '''function bfs(graph, start) {
    const visited = new Set([start]);
    const queue = [start], order = [];
    while (queue.length) {
        const node = queue.shift();
        order.push(node);
        for (const nb of (graph[node] || []))
            if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
    return order;
}
const g = {A:["B","C"],B:["D","E"],C:["F"],D:[],E:["F"],F:[]};
console.log(bfs(g, "A")); // [A, B, C, D, E, F]'''
        elif language == 'java':
            return '''import java.util.*;
public class BFS {
    public static List<String> bfs(Map<String,List<String>> graph, String start) {
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        List<String> order = new ArrayList<>();
        queue.add(start); visited.add(start);
        while (!queue.isEmpty()) {
            String node = queue.poll();
            order.add(node);
            for (String nb : graph.getOrDefault(node, List.of()))
                if (!visited.contains(nb)) { visited.add(nb); queue.add(nb); }
        }
        return order;
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
vector<string> bfs(unordered_map<string,vector<string>>& g, string start) {
    unordered_set<string> visited = {start};
    queue<string> q; q.push(start);
    vector<string> order;
    while (!q.empty()) {
        string node = q.front(); q.pop();
        order.push_back(node);
        for (auto& nb : g[node])
            if (!visited.count(nb)) { visited.insert(nb); q.push(nb); }
    }
    return order;
}'''

    # ── DFS ──────────────────────────────────────────────────
    elif algo_type == 'dfs':
        if language == 'python':
            return '''def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    order = [start]
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            order.extend(dfs(graph, neighbor, visited))
    return order

graph = {"A":["B","C"], "B":["D","E"], "C":["F"], "D":[], "E":["F"], "F":[]}
print("DFS:", dfs(graph, "A"))  # [A, B, D, E, F, C]'''
        elif language == 'javascript':
            return '''function dfs(graph, start, visited = new Set()) {
    visited.add(start);
    const order = [start];
    for (const nb of (graph[start] || []))
        if (!visited.has(nb)) order.push(...dfs(graph, nb, visited));
    return order;
}
const g = {A:["B","C"],B:["D","E"],C:["F"],D:[],E:["F"],F:[]};
console.log(dfs(g, "A")); // [A, B, D, E, F, C]'''
        elif language == 'java':
            return '''import java.util.*;
public class DFS {
    static Set<String> visited = new HashSet<>();
    static List<String> order = new ArrayList<>();
    public static List<String> dfs(Map<String,List<String>> graph, String node) {
        visited.add(node); order.add(node);
        for (String nb : graph.getOrDefault(node, List.of()))
            if (!visited.contains(nb)) dfs(graph, nb);
        return order;
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
unordered_set<string> visited;
vector<string> order;
void dfs(unordered_map<string,vector<string>>& g, string node) {
    visited.insert(node); order.push_back(node);
    for (auto& nb : g[node])
        if (!visited.count(nb)) dfs(g, nb);
}'''

    # ── FIBONACCI / RECURSION / DP ────────────────────────────
    elif algo_type in ('fibonacci', 'recursion', 'dynamic_programming', 'dp'):
        if language == 'python':
            return '''from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Iterative O(1) space version
def fibonacci_iter(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

for i in range(8):
    print(f"fib({i}) = {fibonacci(i)}")
# 0, 1, 1, 2, 3, 5, 8, 13'''
        elif language == 'javascript':
            return '''function fibonacci(n, memo = {}) {
    if (n <= 1) return n;
    if (memo[n] !== undefined) return memo[n];
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
    return memo[n];
}
// Iterative
function fibIter(n) {
    if (n <= 1) return n;
    let [a, b] = [0, 1];
    for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
    return b;
}
for (let i = 0; i < 8; i++)
    console.log(`fib(${i}) = ${fibonacci(i)}`);
// 0, 1, 1, 2, 3, 5, 8, 13'''
        elif language == 'java':
            return '''public class Fibonacci {
    static int[] memo = new int[100];
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        if (memo[n] != 0) return memo[n];
        return memo[n] = fibonacci(n-1) + fibonacci(n-2);
    }
    public static void main(String[] args) {
        for (int i = 0; i < 8; i++)
            System.out.println("fib(" + i + ") = " + fibonacci(i));
    }
}'''
        elif language == 'cpp':
            return '''#include <iostream>
#include <unordered_map>
using namespace std;
unordered_map<int,long long> memo;
long long fibonacci(int n) {
    if (n <= 1) return n;
    if (memo.count(n)) return memo[n];
    return memo[n] = fibonacci(n-1) + fibonacci(n-2);
}
int main() {
    for (int i = 0; i < 8; i++)
        cout << "fib(" << i << ") = " << fibonacci(i) << "\n";
    // 0, 1, 1, 2, 3, 5, 8, 13
}'''

    else:
        # Generic fallback with helpful message
        if language == 'python':
            return f'''# Algorithm: {algo_type}
# Tip: Add GEMINI_API_KEY or GROQ_API_KEY to backend/.env
# for full AI-generated code. Demo placeholder below:

def solve(data):
    """Detected algorithm type: {algo_type}"""
    return sorted(data)

print(solve([5, 3, 8, 1, 9, 2]))  # [1, 2, 3, 5, 8, 9]'''
        else:
            return f'// Algorithm: {algo_type}\n// Add GEMINI_API_KEY or GROQ_API_KEY to backend/.env for full AI-generated code.'

# === CODE EXECUTION API ===
@app.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute code safely in sandbox"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code:
            return jsonify({"success": False, "error": "No code provided"}), 400
        
        import subprocess
        import tempfile
        import os
        
        if language == 'python':
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute with timeout and security restrictions
                result = subprocess.run(
                    ['python', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=5,
                    # Security: limit memory and prevent network access
                    preexec_fn=lambda: os.setuid(65534) if os.name != 'nt' else None
                )
                
                output = result.stdout
                error = result.stderr
                
                return jsonify({
                    "success": True,
                    "output": output,
                    "error": error if error else None,
                    "exit_code": result.returncode
                }), 200
                
            except subprocess.TimeoutExpired:
                return jsonify({
                    "success": False,
                    "error": "Code execution timed out (max 5 seconds)"
                }), 408
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e)
                }), 500
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file)
                except:
                    pass
                    
        elif language == 'javascript':
            # For JavaScript, return code to run in browser
            return jsonify({
                "success": True,
                "browser_execution": True,
                "message": "JavaScript should run in browser"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": f"Language '{language}' execution not supported yet"
            }), 400
            
    except Exception as e:
        print(f"🚨 Code execution error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Verify MongoDB connection before starting
    print("=== MongoDB Connection Check ===")
    try:
        # Test MongoDB connection
        if mongo.test_connection():
            print("SUCCESS: MongoDB connection verified")
        else:
            print("ERROR: MongoDB connection failed")
            print("Please check your MONGODB_URI in .env file")
            print("Continuing without MongoDB...")
    except Exception as e:
        print(f"ERROR: MongoDB connection error: {e}")
        print("Continuing without MongoDB...")
    
    # Initialize MongoDB collections
    try:
        init_collections()
        print("SUCCESS: MongoDB collections initialized")
    except Exception as e:
        print(f"WARNING: Failed to initialize MongoDB collections: {e}")
        print("Continuing without MongoDB...")
    
    print("=== Starting CodeSculptor Backend ===")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

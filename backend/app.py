import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from groq import Groq
import google.generativeai as genai
from pathlib import Path
from algorithm_visualizer import detect_algorithm_type, generate_visualization_steps, generate_algorithm_pseudocode
from input_parser import InputParser
from advanced_visualizer import AdvancedVisualizer
import re

def extract_section(text, section_name):
    pattern = rf"{section_name}:(.*?)(?=(?:PSEUDOCODE|DIAGRAM|EXPLANATION|EXPLANATION_WHY|COMPLEXITY|COMPARISON|REAL_WORLD_MAP|AI_HINTS):|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

# Load .env from the backend directory - FORCE OVERRIDE
env_path = Path(__file__).parent / '.env'
print(f"📁 Loading .env from: {env_path}")
print(f"📁 .env file exists: {env_path.exists()}")
load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)
CORS(app)

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
        "message": "CodeSculptor API is running with Gemini-1.5-Flash & Groq"
    })

@app.route('/api/convert', methods=['POST'])
def convert_to_pseudocode():
    global gemini_model, groq_client
    try:
        data = request.get_json()
        natural_language = data.get('text', '')
        high_accuracy = data.get('high_accuracy', False)
        
        if not natural_language:
            return jsonify({
                "success": False,
                "error": "No input text provided"
            }), 400
        
        print(f"📥 Received request: {natural_language[:100]}...")
        
        # System prompt for Universal Knowledge and Multi-language support
        system_prompt = """You are a Universal Expert Educator and Technical Consultant. 
        Your task is to provide accurate, high-quality information on ANY subject in the SAME LANGUAGE as the user's query.

        CORE RULES:
        1. LANGUAGE: Always respond in the language used by the user.
        2. PROGRAMMING: If the query is about an algorithm, provide optimized PSEUDOCODE.
        3. GENERAL SUBJECTS: If not programming, provide a step-by-step LOGICAL FLOW in the PSEUDOCODE section.
        4. DIAGRAM: ALWAYS provide a Mermaid.js diagram that visualizes the concept.
        5. EXPLANATION: Provide a detailed, clear EXPLANATION of steps.
        6. EXPLANATION_WHY: Explain the decision-making process (Why this algorithm/approach?).
        7. COMPLEXITY: Time and Space complexity (e.g. O(n), O(1)).
        8. COMPARISON: A Markdown table comparing this algorithm against common alternatives.
        9. REAL_WORLD_MAP: A single sentence on a real-world application (e.g. "Amazon delivery route optimization").
        10. AI_HINTS: Short strategic hint (e.g. "Try using dynamic programming").

        RESPONSE FORMAT (MANDATORY EXACT HEADERS):
        PSEUDOCODE:
        [Numbered steps or logical flow]

        DIAGRAM:
        [Mermaid code here]

        EXPLANATION:
        [Detailed explanation here]

        EXPLANATION_WHY:
        [Decision making context]

        COMPLEXITY:
        [Time and Space Complexity, e.g. "Time: O(n), Space: O(1) - Linear"]

        COMPARISON:
        [Markdown table]

        REAL_WORLD_MAP:
        [Real world scenario]

        AI_HINTS:
        [Hint]
        """
        
        parsed_data = {
            "pseudocode": "",
            "explanation": "",
            "diagram": "",
            "explanation_why": "",
            "complexity": "",
            "comparison": "",
            "real_world_map": "",
            "ai_hints": ""
        }
        demo_mode = False

        # Try Gemini first
        if gemini_model:
            try:
                print(f"🤖 Calling Gemini API (Flash Mode)...")
                prompt = f"{system_prompt}\n\nUser Query: {natural_language}\n\nRespond strictly following the mandatory headers."
                response = gemini_model.generate_content(prompt)
                full_response = response.text
                print(f"✅ Gemini response received ({len(full_response)} chars)")
                
                parsed_data["pseudocode"] = extract_section(full_response, "PSEUDOCODE")
                parsed_data["diagram"] = extract_section(full_response, "DIAGRAM").replace("```mermaid", "").replace("```", "").strip()
                parsed_data["explanation"] = extract_section(full_response, "EXPLANATION")
                parsed_data["explanation_why"] = extract_section(full_response, "EXPLANATION_WHY")
                parsed_data["complexity"] = extract_section(full_response, "COMPLEXITY")
                parsed_data["comparison"] = extract_section(full_response, "COMPARISON")
                parsed_data["real_world_map"] = extract_section(full_response, "REAL_WORLD_MAP")
                parsed_data["ai_hints"] = extract_section(full_response, "AI_HINTS")

            except Exception as e:
                print(f"⚠️ Gemini error during generation: {e}")

        # Fallback to Groq if Gemini failed or is missing
        if not parsed_data["pseudocode"] and groq_client:
            try:
                print("🤖 Calling Groq API (Fallback)...")
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"User Query: {natural_language}"}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                full_response = response.choices[0].message.content
                print(f"✅ Groq response received ({len(full_response)} chars)")
                
                parsed_data["pseudocode"] = extract_section(full_response, "PSEUDOCODE")
                parsed_data["diagram"] = extract_section(full_response, "DIAGRAM").replace("```mermaid", "").replace("```", "").strip()
                parsed_data["explanation"] = extract_section(full_response, "EXPLANATION")
                parsed_data["explanation_why"] = extract_section(full_response, "EXPLANATION_WHY")
                parsed_data["complexity"] = extract_section(full_response, "COMPLEXITY")
                parsed_data["comparison"] = extract_section(full_response, "COMPARISON")
                parsed_data["real_world_map"] = extract_section(full_response, "REAL_WORLD_MAP")
                parsed_data["ai_hints"] = extract_section(full_response, "AI_HINTS")

            except Exception as e:
                print(f"⚠️ Groq error during generation: {e}")

        # Ultimate fallback
        if not parsed_data["pseudocode"]:
            print("🎭 AI failed. Using built-in templates (Demo Mode)")
            demo_mode = True
            algo_type = detect_algorithm_type(natural_language)
            parsed_data["pseudocode"] = generate_algorithm_pseudocode(algo_type, natural_language)
            parsed_data["explanation"] = "Unable to connect to AI providers. Showing a conceptual template instead."
            parsed_data["explanation_why"] = "Why: Fallback mode does not generate dynamic reasoning."
            parsed_data["complexity"] = f"Complexity Data Unavailable."
            parsed_data["comparison"] = "Algorithm comparison unavailable in offline mode."
            parsed_data["real_world_map"] = "Offline Mode: Real world scenario not generated."
            parsed_data["ai_hints"] = "Hint: Please configure an API key for dynamic content."
            if "DC motor" in natural_language.lower():
                parsed_data["diagram"] = "graph TD\n    A[DC Power] --> B[Commutator]\n    B --> C[Armature/Rotor]\n    C --> D[Magnetic Field interaction]\n    D --> E[Rotational Force/Torque]"

        # Parse pseudocode into steps for animation
        # Ensure we don't have empty lists or markdown markers
        lines = [l.strip() for l in parsed_data["pseudocode"].split('\n') if l.strip() and "```" not in l]
        steps = []
        for i, line in enumerate(lines):
            steps.append({
                "line_number": i + 1,
                "content": line,
                "type": detect_line_type(line)
            })
        
        # Smart Algorithm Detection
        algo_type = detect_algorithm_type(natural_language)
        
        # If the input doesn't look like code/algorithm, override algo_type to 'generic'
        is_programming = any(keyword in natural_language.lower() for keyword in ['sort', 'search', 'array', 'tree', 'graph', 'problem', 'solve', 'function', 'class', 'complexity', 'islands', 'two sum', 'sum to', 'path', 'dijkstra', 'algorithm', 'bfs', 'dfs', 'recursion', 'factorial', 'fibonacci'])
        if not is_programming and algo_type != 'generic':
             print(f"🛡️ Overriding detected type '{algo_type}' to 'generic' for non-programming query")
             algo_type = 'generic'
             
        print(f"🔍 Detected Algorithm Type: {algo_type}")
        print(f"🔍 Is Programming: {is_programming}")
        
        input_data = InputParser.parse_input(natural_language, algo_type)
        print(f"🔍 Parsed Input Data: {input_data}")
        
        # Validation Check (Test Case 8)
        if input_data.get('valid') == False:
            return jsonify({
                "success": False,
                "error": input_data.get('error', "Invalid input for the selected algorithm."),
                "pseudocode": "Validation Error\n1. Check your input\n2. Ensure it contains numeric data\n3. Try again",
                "explanation": "The system was unable to extract valid numeric data from your query."
            })

        visualization = AdvancedVisualizer.generate_visualization(algo_type, input_data, natural_language)
        print(f"🔍 Generated Visualization Type: {visualization.get('visualization_type')}")
        
        # If we have a mermaid diagram and it's a generic/conceptual query, use mermaid viz
        if parsed_data["diagram"] and visualization.get('visualization_type') in ['conceptual', 'generic']:
            print("🎨 Injecting Mermaid diagram as primary visualization")
            visualization['visualization_type'] = 'mermaid'
            for step in visualization.get('steps', []):
                step['diagram'] = parsed_data["diagram"]
        elif parsed_data["diagram"]:
            # For specific visualizers, just attach the diagram to the first step as extra info
            print("🎨 Attaching Mermaid diagram as extra info to first step")
            if visualization.get('steps'):
                visualization['steps'][0]['diagram'] = parsed_data["diagram"]

        # Ensure we provide a clean response dictionary
        return jsonify({
            "success": True,
            **parsed_data,
            "steps": steps,
            "visualization": visualization,
            "input": natural_language,
            "input_data": input_data,
            "demo_mode": demo_mode
        })
    
    except Exception as e:
        import traceback
        print(f"🚨 CRITICAL ERROR in /api/convert: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "details": traceback.format_exc()
        }), 500

def detect_line_type(line):
    line_lower = line.lower().strip()
    if 'start' in line_lower or 'begin' in line_lower: return 'start'
    if 'end' in line_lower: return 'end'
    if 'if' in line_lower or 'else' in line_lower: return 'condition'
    if 'for' in line_lower or 'while' in line_lower: return 'loop'
    if 'input' in line_lower or 'read' in line_lower: return 'input'
    if 'output' in line_lower or 'print' in line_lower or 'display' in line_lower: return 'output'
    if '=' in line or '<-' in line: return 'assignment'
    return 'statement'

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
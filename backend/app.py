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
        4. DIAGRAM: ALWAYS provide a Mermaid.js diagram (graph TD, sequenceDiagram, etc.) that visualizes the concept.
        5. EXPLANATION: Provide a detailed, clear EXPLANATION.

        RESPONSE FORMAT (MANDATORY):
        PSEUDOCODE:
        [Numbered steps or logical flow]

        DIAGRAM:
        [Mermaid code here]

        EXPLANATION:
        [Detailed explanation here]
        """
        
        pseudocode = ""
        explanation = ""
        diagram = ""
        demo_mode = False

        # Try Gemini first
        if gemini_model:
            try:
                print(f"🤖 Calling Gemini API (Flash Mode)...")
                prompt = f"{system_prompt}\n\nUser Query: {natural_language}\n\nRespond in the EXACT format:\nPSEUDOCODE:\n[steps]\n\nDIAGRAM:\n[mermaid code]\n\nEXPLANATION:\n[details]"
                response = gemini_model.generate_content(prompt)
                full_response = response.text
                print(f"✅ Gemini response received ({len(full_response)} chars)")
                
                # Robust parsing for Mermaid and other fields
                if "DIAGRAM:" in full_response:
                    parts = full_response.split("DIAGRAM:")
                    # Parse Pseudocode (everything before DIAGRAM:)
                    pseudocode_part = parts[0].replace("PSEUDOCODE:", "").strip()
                    pseudocode = pseudocode_part
                    
                    # Parse Diagram and Explanation
                    after_diagram = parts[1]
                    if "EXPLANATION:" in after_diagram:
                        diag_parts = after_diagram.split("EXPLANATION:")
                        diagram = diag_parts[0].strip()
                        explanation = diag_parts[1].strip()
                    else:
                        diagram = after_diagram.strip()
                        explanation = "No detailed explanation provided."
                
                # Cleanup Mermaid markers
                diagram = diagram.replace("```mermaid", "").replace("```", "").strip()
                
                # Secondary check if above failed
                if not pseudocode and "PSEUDOCODE:" in full_response:
                    pseudocode = full_response.split("PSEUDOCODE:")[1].split("DIAGRAM:")[0].split("EXPLANATION:")[0].strip()
                if not explanation and "EXPLANATION:" in full_response:
                    explanation = full_response.split("EXPLANATION:")[1].strip()

            except Exception as e:
                print(f"⚠️ Gemini error during generation: {e}")

        # Fallback to Groq if Gemini failed or is missing
        if not pseudocode and groq_client:
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
                
                # Robust parsing for Mermaid and other fields (same as Gemini)
                if "DIAGRAM:" in full_response:
                    parts = full_response.split("DIAGRAM:")
                    # Parse Pseudocode (everything before DIAGRAM:)
                    pseudocode_part = parts[0].replace("PSEUDOCODE:", "").strip()
                    pseudocode = pseudocode_part
                    
                    # Parse Diagram and Explanation
                    after_diagram = parts[1]
                    if "EXPLANATION:" in after_diagram:
                        diag_parts = after_diagram.split("EXPLANATION:")
                        diagram = diag_parts[0].strip()
                        explanation = diag_parts[1].strip()
                    else:
                        diagram = after_diagram.strip()
                        explanation = "No detailed explanation provided."
                
                # Cleanup Mermaid markers
                diagram = diagram.replace("```mermaid", "").replace("```", "").strip()

                # Secondary check if above failed
                if not pseudocode and "PSEUDOCODE:" in full_response:
                    # Attempt to parse pseudocode if it wasn't found via DIAGRAM split
                    # This handles cases where DIAGRAM might be missing or malformed, but PSEUDOCODE is present
                    pseudocode_start = full_response.find("PSEUDOCODE:")
                    diagram_start = full_response.find("DIAGRAM:")
                    explanation_start = full_response.find("EXPLANATION:")

                    if pseudocode_start != -1:
                        end_index = len(full_response)
                        if diagram_start != -1 and diagram_start > pseudocode_start:
                            end_index = min(end_index, diagram_start)
                        if explanation_start != -1 and explanation_start > pseudocode_start:
                            end_index = min(end_index, explanation_start)
                        pseudocode = full_response[pseudocode_start + len("PSEUDOCODE:"):end_index].strip()

                if not explanation and "EXPLANATION:" in full_response:
                    # Attempt to parse explanation if it wasn't found via DIAGRAM split
                    explanation_start = full_response.find("EXPLANATION:")
                    if explanation_start != -1:
                        explanation = full_response[explanation_start + len("EXPLANATION:"):].strip()

            except Exception as e:
                print(f"⚠️ Groq error during generation: {e}")

        # Ultimate fallback
        if not pseudocode:
            print("🎭 AI failed. Using built-in templates (Demo Mode)")
            demo_mode = True
            algo_type = detect_algorithm_type(natural_language)
            pseudocode = generate_algorithm_pseudocode(algo_type, natural_language)
            explanation = "Unable to connect to AI providers. Showing a conceptual template instead."
            if "DC motor" in natural_language.lower():
                diagram = "graph TD\n    A[DC Power] --> B[Commutator]\n    B --> C[Armature/Rotor]\n    C --> D[Magnetic Field interaction]\n    D --> E[Rotational Force/Torque]"

        # Parse pseudocode into steps for animation
        # Ensure we don't have empty lists or markdown markers
        lines = [l.strip() for l in pseudocode.split('\n') if l.strip() and "```" not in l]
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
        if diagram and visualization.get('visualization_type') in ['conceptual', 'generic']:
            print("🎨 Injecting Mermaid diagram as primary visualization")
            visualization['visualization_type'] = 'mermaid'
            for step in visualization.get('steps', []):
                step['diagram'] = diagram
        elif diagram:
            # For specific visualizers, just attach the diagram to the first step as extra info
            print("🎨 Attaching Mermaid diagram as extra info to first step")
            if visualization.get('steps'):
                visualization['steps'][0]['diagram'] = diagram

        return jsonify({
            "success": True,
            "pseudocode": pseudocode,
            "explanation": explanation,
            "diagram": diagram,
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
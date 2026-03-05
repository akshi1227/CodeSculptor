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
        gemini_model = genai.GenerativeModel('gemini-1.5-pro')
        print("✅ Gemini API configured successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini: {e}")
        gemini_model = None
else:
    gemini_model = None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "CodeSculptor API is running with Gemini & Groq"
    })

@app.route('/api/convert', methods=['POST'])
def convert_to_pseudocode():
    try:
        data = request.get_json()
        natural_language = data.get('text', '')
        high_accuracy = data.get('high_accuracy', False)
        
        if not natural_language:
            return jsonify({
                "success": False,
                "error": "No input text provided"
            }), 400
        
        # System prompt for CSE and Scenario-based algorithm design
        system_prompt = """You are an expert Senior Software Engineer and Algorithm Educator. 
        Your task is to convert natural language descriptions or scenario-based questions (like LeetCode/Codeforces) into optimized, structured pseudocode and provide a clear explanation.

        CRITICAL RULES FOR PSEUDOCODE:
        1. Use clear, structured pseudocode (START, END, IF-THEN-ELSE, FOR, WHILE, RETURN).
        2. DO NOT use comments inside the pseudocode.
        3. Number each step (1., 2., etc.).
        4. Focus on the MOST EFFICIENT algorithm (Optimal Time/Space Complexity).
        
        CRITICAL RULES FOR EXPLANATION:
        1. Provide a step-by-step breakdown of how the algorithm works.
        2. Mention Time and Space complexity.
        3. Explain why this approach was chosen for the given scenario.
        """
        
        pseudocode = ""
        explanation = ""
        demo_mode = False

        # Try Gemini first for high accuracy or if enabled
        if gemini_model:
            try:
                print(f"🤖 Generating with Gemini (High Accuracy: {high_accuracy})...")
                prompt = f"{system_prompt}\n\nInput Scenario: {natural_language}\n\nRespond in this EXACT format:\nPSEUDOCODE:\n[Your numbered pseudocode here]\n\nEXPLANATION:\n[Your explanation here]"
                response = gemini_model.generate_content(prompt)
                full_response = response.text
                
                if "PSEUDOCODE:" in full_response and "EXPLANATION:" in full_response:
                    parts = full_response.split("EXPLANATION:")
                    pseudocode = parts[0].replace("PSEUDOCODE:", "").strip()
                    explanation = parts[1].strip()
                else:
                    pseudocode = full_response
                    explanation = "Explanation could not be parsed but algorithm was generated."
                    
            except Exception as e:
                print(f"⚠️ Gemini error: {e}")
                gemini_model = None # Fallback to Groq

        # Fallback to Groq if Gemini fails or is not configured
        if not pseudocode and groq_client:
            try:
                print("🤖 Using Groq as fallback...")
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Convert to pseudocode and explain: {natural_language}"}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                full_response = response.choices[0].message.content
                # Simple parsing for Groq
                if "PSEUDOCODE:" in full_response and "EXPLANATION:" in full_response:
                    parts = full_response.split("EXPLANATION:")
                    pseudocode = parts[0].replace("PSEUDOCODE:", "").strip()
                    explanation = parts[1].strip()
                else:
                    pseudocode = full_response
                    explanation = "Explanation provided within the response."
            except Exception as e:
                print(f"⚠️ Groq error: {e}")
                groq_client = None

        # Ultimate fallback to built-in logic
        if not pseudocode:
            print("🎭 Using built-in algorithm templates (Demo Mode)")
            demo_mode = True
            algo_type = detect_algorithm_type(natural_language)
            pseudocode = generate_algorithm_pseudocode(algo_type, natural_language)
            explanation = "This is a pre-defined template for the detected algorithm type."

        # Parse pseudocode into steps for animation
        lines = pseudocode.strip().split('\n')
        steps = []
        for i, line in enumerate(lines):
            if line.strip():
                # Remove markdown formatting if present
                clean_line = line.replace('```', '').strip()
                if clean_line:
                    steps.append({
                        "line_number": i + 1,
                        "content": clean_line,
                        "type": detect_line_type(clean_line)
                    })
        
        # Detect algorithm type for visualization
        algo_type = detect_algorithm_type(natural_language)
        input_data = InputParser.parse_input(natural_language, algo_type)
        visualization = AdvancedVisualizer.generate_visualization(algo_type, input_data, natural_language)
        
        return jsonify({
            "success": True,
            "pseudocode": pseudocode,
            "explanation": explanation,
            "steps": steps,
            "visualization": visualization,
            "input": natural_language,
            "input_data": input_data,
            "demo_mode": demo_mode
        })
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in /api/convert: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "details": error_details
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
#!/usr/bin/env python
import urllib.request
import json

# Test with Longest Substring problem
problem = """Find the length of the longest substring without repeating characters.
Given: s = "abcabcbb"
Expected Output: 3 (the substring "abc")

Given: s = "bbbbb" 
Expected Output: 1 (the substring "b")

Given: s = "pwwkew"
Expected Output: 3 (the substring "wke")"""

data = json.dumps({
    'text': problem,
    'high_accuracy': True,
    'language': 'python',
    'domain': 'general'
}).encode()

try:
    req = urllib.request.Request('http://127.0.0.1:5000/api/convert', 
                                 data=data, 
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        
        print("="*80)
        print("PSEUDOCODE:")
        print("="*80)
        print(result.get('pseudocode', 'N/A'))
        
        print("\n" + "="*80)
        print("CODE (Working Solution):")
        print("="*80)
        print(result.get('code', 'N/A'))
        
        print("\n" + "="*80)
        print("EXPLANATION:")
        print("="*80)
        print(result.get('explanation', 'N/A')[:600])
        
        print("\n" + "="*80)
        print("COMPLEXITY:")
        print("="*80)
        print(result.get('complexity', 'N/A'))
        
except Exception as e:
    print(f"Error: {e}")

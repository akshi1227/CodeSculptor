"""
Input Parser - Extracts and validates user input data for algorithm visualization
Supports: Arrays, Graphs, Trees, Matrices, etc.
"""

import re
import json
from typing import Dict, List, Any, Tuple, Optional

class InputParser:
    """Parse various data structure inputs from natural language"""
    
    @staticmethod
    def parse_input(text: str, algorithm_type: str) -> Dict[str, Any]:
        """
        Main parser that routes to specific parsers based on algorithm type
        """
        text = text.strip()
        
        # Try to extract data based on algorithm type
        if algorithm_type in ['bubble_sort', 'merge_sort', 'quick_sort', 'insertion_sort', 'selection_sort']:
            return InputParser.parse_array(text)
        elif algorithm_type in ['binary_search', 'linear_search']:
            return InputParser.parse_search_input(text)
        elif algorithm_type in ['bfs', 'dfs']:
            return InputParser.parse_graph(text)
        elif algorithm_type in ['dijkstra', 'a_star', 'bellman_ford']:
            return InputParser.parse_weighted_graph(text)
        elif algorithm_type in ['bst', 'avl', 'heap']:
            return InputParser.parse_tree_input(text)
        elif algorithm_type == 'two_sum':
            return InputParser.parse_two_sum(text)
        elif algorithm_type == 'max_profit':
            return InputParser.parse_array(text)
        elif algorithm_type == 'islands':
            return InputParser.parse_matrix(text)
        elif algorithm_type == 'fibonacci':
            return InputParser.parse_number_input(text, 'fibonacci')
        elif algorithm_type == 'factorial':
            return InputParser.parse_number_input(text, 'factorial')
        else:
            return InputParser.parse_array(text)  # Default to array
    
    @staticmethod
    def parse_array(text: str) -> Dict[str, Any]:
        """
        Parse array from various formats:
        - [1, 2, 3, 4]
        - array = [5, 3, 8, 1]
        - numbers: 5 3 8 1
        - sort these numbers: 64, 34, 25, 12
        """
        # Try JSON-like array format
        array_match = re.search(r'\[([^\]]+)\]', text)
        if array_match:
            array_str = array_match.group(1)
            try:
                array = [int(x.strip()) for x in array_str.split(',')]
                return {'type': 'array', 'data': array, 'size': len(array)}
            except ValueError:
                pass
        
        # Try comma-separated numbers
        numbers = re.findall(r'-?\d+', text)
        if numbers:
            array = [int(n) for n in numbers[:15]]
            return {'type': 'array', 'data': array, 'size': len(array), 'valid': True}
        
        # Check if text is completely non-numeric and not empty
        if text.strip() and not any(char.isdigit() for char in text):
             return {
                'type': 'array',
                'data': [],
                'size': 0,
                'valid': False,
                'error': "Invalid Input: No numeric data found. Please provide numbers to sort or search."
            }

        # Default array if no input found
        return {
            'type': 'array',
            'data': [64, 34, 25, 12, 22, 11, 90],
            'size': 7,
            'is_default': True
        }
    
    @staticmethod
    def parse_search_input(text: str) -> Dict[str, Any]:
        """
        Parse search input:
        - array = [1, 2, 3], target = 2
        - search for 5 in [1, 3, 5, 7, 9]
        """
        result = InputParser.parse_array(text)
        
        # Try to find target value
        target_match = re.search(r'(?:target|find|search)\s*(?:=|for|:)?\s*(-?\d+)', text, re.IGNORECASE)
        if target_match:
            result['target'] = int(target_match.group(1))
        else:
            # Use middle element as default target
            if result['data']:
                result['target'] = result['data'][len(result['data']) // 2]
            else:
                result['target'] = 0
        
        return result
    
    @staticmethod
    def parse_graph(text: str) -> Dict[str, Any]:
        """
        Parse graph from various formats:
        - Adjacency list: {A: [B, C], B: [D]}
        - Edge list: A-B, B-C, C-D
        - Matrix format
        """
        # Try JSON-like adjacency list
        try:
            # Look for dictionary-like structure
            graph_match = re.search(r'\{[^}]+\}', text)
            if graph_match:
                graph_str = graph_match.group(0)
                # Convert to proper JSON format
                graph_str = graph_str.replace("'", '"')
                graph_data = json.loads(graph_str)
                return {
                    'type': 'graph',
                    'format': 'adjacency_list',
                    'data': graph_data,
                    'nodes': list(graph_data.keys())
                }
        except:
            pass
        
        # Try edge list format (A-B, B-C)
        edge_pattern = r'([A-Z0-9]+)\s*[-–>]+\s*([A-Z0-9]+)'
        edges = re.findall(edge_pattern, text, re.IGNORECASE)
        if edges:
            # Build adjacency list from edges
            adj_list = {}
            nodes = set()
            for src, dst in edges:
                src, dst = src.upper(), dst.upper()
                nodes.add(src)
                nodes.add(dst)
                if src not in adj_list:
                    adj_list[src] = []
                adj_list[src].append(dst)
            
            # Add isolated nodes
            for node in nodes:
                if node not in adj_list:
                    adj_list[node] = []
            
            return {
                'type': 'graph',
                'format': 'adjacency_list',
                'data': adj_list,
                'nodes': sorted(list(nodes))
            }
        
        # Default graph
        return {
            'type': 'graph',
            'format': 'adjacency_list',
            'data': {
                'A': ['B', 'C'],
                'B': ['D', 'E'],
                'C': ['F'],
                'D': [],
                'E': ['F'],
                'F': []
            },
            'nodes': ['A', 'B', 'C', 'D', 'E', 'F'],
            'is_default': True
        }
    
    @staticmethod
    def parse_tree_input(text: str) -> Dict[str, Any]:
        """
        Parse tree input:
        - Insert sequence: [5, 3, 7, 2, 4]
        - Tree: insert 5, 3, 7, 2
        """
        # Try to find insertion sequence
        array_data = InputParser.parse_array(text)
        
        return {
            'type': 'tree',
            'operation': 'insert',
            'sequence': array_data['data'],
            'size': len(array_data['data'])
        }
    
    @staticmethod
    def parse_weighted_graph(text: str) -> Dict[str, Any]:
        """
        Parse weighted graph:
        - A-B:5, B-C:3, A-C:7
        """
        edge_pattern = r'([A-Z0-9]+)\s*[-–>]+\s*([A-Z0-9]+)\s*:?\s*(\d+)'
        edges = re.findall(edge_pattern, text, re.IGNORECASE)
        
        if edges:
            adj_list = {}
            nodes = set()
            
            for src, dst, weight in edges:
                src, dst = src.upper(), dst.upper()
                nodes.add(src)
                nodes.add(dst)
                
                if src not in adj_list:
                    adj_list[src] = []
                adj_list[src].append({'node': dst, 'weight': int(weight)})
            
            return {
                'type': 'weighted_graph',
                'format': 'adjacency_list',
                'data': adj_list,
                'nodes': sorted(list(nodes)),
                'weighted': True
            }
        
        # Default weighted graph
        return {
            'type': 'weighted_graph',
            'format': 'adjacency_list',
            'data': {
                'A': [{'node': 'B', 'weight': 4}, {'node': 'C', 'weight': 2}],
                'B': [{'node': 'D', 'weight': 5}],
                'C': [{'node': 'D', 'weight': 3}],
                'D': []
            },
            'nodes': ['A', 'B', 'C', 'D'],
            'weighted': True,
            'is_default': True
        }
    
    @staticmethod
    def extract_numbers(text: str, limit: int = 15) -> List[int]:
        """Extract all numbers from text"""
        numbers = re.findall(r'-?\d+', text)
        return [int(n) for n in numbers[:limit]]
    
    @staticmethod
    def parse_number_input(text: str, operation: str) -> Dict[str, Any]:
        """
        Parse single number input for operations like factorial, fibonacci
        - factorial of 5
        - fibonacci(7)
        - calculate factorial 10
        """
        # Try to find a number in the text
        numbers = re.findall(r'\d+', text)
        
        if numbers:
            n = int(numbers[0])
            # Limit to reasonable values
            if operation == 'factorial':
                n = min(n, 10)  # Factorial gets large quickly
            elif operation == 'fibonacci':
                n = min(n, 10)  # Fibonacci recursion tree gets complex
        else:
            # Default values
            n = 5 if operation == 'factorial' else 5
        
        return {
            'type': 'number',
            'operation': operation,
            'n': n,
            'value': n
        }
    
    @staticmethod
    def parse_two_sum(text: str) -> Dict[str, Any]:
        """Parse two sum input: array and target"""
        array_data = InputParser.parse_array(text)
        target_match = re.search(r'sum\s*(?:to|=)?\s*(-?\d+)', text, re.IGNORECASE)
        target = int(target_match.group(1)) if target_match else 9
        return {
            'type': 'array_target',
            'data': array_data['data'],
            'target': target
        }

    @staticmethod
    def parse_matrix(text: str) -> Dict[str, Any]:
        """Parse 2D grid/matrix input for problems like Islands"""
        # Look for [[1,1,0],[0,1,0]]
        matrix_match = re.search(r'\[\s*\[(.*?)\]\s*\]', text, re.DOTALL)
        if matrix_match:
            try:
                # Basic attempt to parse nested lists
                rows = re.findall(r'\[(.*?)\]', matrix_match.group(1))
                grid = [[int(x.strip()) for x in row.split(',')] for row in rows]
                return {'type': 'matrix', 'data': grid}
            except:
                pass
        
        # Default 3x3 grid
        return {
            'type': 'matrix',
            'data': [[1,1,0], [0,1,0], [0,0,0]],
            'is_default': True
        }

    @staticmethod
    def validate_array(arr: List[int], max_size: int = 15) -> Tuple[bool, str]:
        """Validate array input"""
        if not arr:
            return False, "Input is empty or contains no valid numbers."
        if len(arr) > max_size:
            return False, f"Input is too large (max {max_size} elements for visualization)."
        return True, "Valid"

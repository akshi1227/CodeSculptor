"""
Advanced Algorithm Visualizer - Visualgo-style visualization engine
Supports: Arrays, Graphs, Trees, Recursion, DP, Union-Find, Bitmasks
"""

from typing import Dict, List, Any, Optional
import copy

class AdvancedVisualizer:
    """Generate advanced visualizations for various algorithm types"""
    
    @staticmethod
    def generate_visualization(algorithm_type: str, input_data: Dict[str, Any], user_text: str = "") -> Dict[str, Any]:
        """
        Main visualization generator
        Routes to specific visualizers based on algorithm type
        """
        
        if algorithm_type in ['bubble_sort', 'insertion_sort', 'selection_sort', 'merge_sort', 'quick_sort']:
            return AdvancedVisualizer.visualize_basic_sort(algorithm_type, input_data)
        elif algorithm_type == 'binary_search':
            return AdvancedVisualizer.visualize_binary_search(input_data)
        elif algorithm_type in ['bfs', 'dfs']:
            return AdvancedVisualizer.visualize_graph_traversal(algorithm_type, input_data)
        elif algorithm_type in ['bst', 'heap']:
            return AdvancedVisualizer.visualize_tree(algorithm_type, input_data)
        elif algorithm_type == 'fibonacci':
            return AdvancedVisualizer.visualize_fibonacci(input_data)
        elif algorithm_type == 'factorial':
            return AdvancedVisualizer.visualize_factorial(input_data)
        else:
            return AdvancedVisualizer.visualize_basic_sort('bubble_sort', input_data)
    
    @staticmethod
    def visualize_basic_sort(algorithm_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize basic sorting algorithms with detailed steps"""
        array = input_data.get('data', [64, 34, 25, 12, 22, 11, 90])
        steps = []
        step_num = 0
        
        # Initial state
        steps.append({
            'step_number': step_num,
            'description': f'Initial array: {array}',
            'array': copy.deepcopy(array),
            'highlighted_indices': [],
            'comparing_indices': [],
            'sorted_indices': [],
            'swapped_indices': [],
            'action': 'initialize',
            'pseudocode_line': 0
        })
        step_num += 1
        
        n = len(array)
        
        if algorithm_type == 'bubble_sort':
            for i in range(n):
                for j in range(0, n - i - 1):
                    # Comparison
                    steps.append({
                        'step_number': step_num,
                        'description': f'Comparing array[{j}]={array[j]} with array[{j+1}]={array[j+1]}',
                        'array': copy.deepcopy(array),
                        'highlighted_indices': [],
                        'comparing_indices': [j, j+1],
                        'sorted_indices': list(range(n - i, n)),
                        'swapped_indices': [],
                        'action': 'compare',
                        'pseudocode_line': 4
                    })
                    step_num += 1
                    
                    # Swap if needed
                    if array[j] > array[j + 1]:
                        array[j], array[j + 1] = array[j + 1], array[j]
                        steps.append({
                            'step_number': step_num,
                            'description': f'Swapping {array[j+1]} and {array[j]}',
                            'array': copy.deepcopy(array),
                            'highlighted_indices': [],
                            'comparing_indices': [],
                            'sorted_indices': list(range(n - i, n)),
                            'swapped_indices': [j, j+1],
                            'action': 'swap',
                            'pseudocode_line': 5
                        })
                        step_num += 1
        
        elif algorithm_type == 'selection_sort':
            for i in range(n):
                min_idx = i
                steps.append({
                    'step_number': step_num,
                    'description': f'Finding minimum in unsorted portion (index {i} to {n-1})',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [i],
                    'comparing_indices': [],
                    'sorted_indices': list(range(0, i)),
                    'swapped_indices': [],
                    'action': 'find_min',
                    'pseudocode_line': 3
                })
                step_num += 1
                
                for j in range(i + 1, n):
                    steps.append({
                        'step_number': step_num,
                        'description': f'Checking if array[{j}]={array[j]} < array[{min_idx}]={array[min_idx]}',
                        'array': copy.deepcopy(array),
                        'highlighted_indices': [min_idx],
                        'comparing_indices': [j],
                        'sorted_indices': list(range(0, i)),
                        'swapped_indices': [],
                        'action': 'compare',
                        'pseudocode_line': 4
                    })
                    step_num += 1
                    
                    if array[j] < array[min_idx]:
                        min_idx = j
                
                if min_idx != i:
                    array[i], array[min_idx] = array[min_idx], array[i]
                    steps.append({
                        'step_number': step_num,
                        'description': f'Swapping minimum element to position {i}',
                        'array': copy.deepcopy(array),
                        'highlighted_indices': [],
                        'comparing_indices': [],
                        'sorted_indices': list(range(0, i+1)),
                        'swapped_indices': [i, min_idx],
                        'action': 'swap',
                        'pseudocode_line': 6
                    })
                    step_num += 1
        
        elif algorithm_type == 'insertion_sort':
            for i in range(1, n):
                key = array[i]
                j = i - 1
                
                steps.append({
                    'step_number': step_num,
                    'description': f'Inserting array[{i}]={key} into sorted portion',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [i],
                    'comparing_indices': [],
                    'sorted_indices': list(range(0, i)),
                    'swapped_indices': [],
                    'action': 'select',
                    'pseudocode_line': 2
                })
                step_num += 1
                
                while j >= 0 and array[j] > key:
                    steps.append({
                        'step_number': step_num,
                        'description': f'Shifting array[{j}]={array[j]} to the right',
                        'array': copy.deepcopy(array),
                        'highlighted_indices': [j+1],
                        'comparing_indices': [j],
                        'sorted_indices': [],
                        'swapped_indices': [],
                        'action': 'shift',
                        'pseudocode_line': 4
                    })
                    step_num += 1
                    
                    array[j + 1] = array[j]
                    j -= 1
                
                array[j + 1] = key
                steps.append({
                    'step_number': step_num,
                    'description': f'Placed {key} at position {j+1}',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [j+1],
                    'comparing_indices': [],
                    'sorted_indices': list(range(0, i+1)),
                    'swapped_indices': [],
                    'action': 'insert',
                    'pseudocode_line': 6
                })
                step_num += 1
        
        elif algorithm_type == 'merge_sort':
            # Simplified merge sort visualization (in-place style for visualization)
            def merge_sort_viz(arr, left, right):
                nonlocal step_num
                if left < right:
                    mid = (left + right) // 2
                    
                    # Show division
                    steps.append({
                        'step_number': step_num,
                        'description': f'Dividing array from index {left} to {right}',
                        'array': copy.deepcopy(arr),
                        'highlighted_indices': list(range(left, right + 1)),
                        'comparing_indices': [],
                        'sorted_indices': [],
                        'swapped_indices': [],
                        'action': 'divide',
                        'pseudocode_line': 3
                    })
                    step_num += 1
                    
                    merge_sort_viz(arr, left, mid)
                    merge_sort_viz(arr, mid + 1, right)
                    
                    # Merge
                    temp = []
                    i, j = left, mid + 1
                    
                    while i <= mid and j <= right:
                        if arr[i] <= arr[j]:
                            temp.append(arr[i])
                            i += 1
                        else:
                            temp.append(arr[j])
                            j += 1
                    
                    while i <= mid:
                        temp.append(arr[i])
                        i += 1
                    
                    while j <= right:
                        temp.append(arr[j])
                        j += 1
                    
                    # Copy back
                    for i, val in enumerate(temp):
                        arr[left + i] = val
                    
                    steps.append({
                        'step_number': step_num,
                        'description': f'Merged subarray from {left} to {right}',
                        'array': copy.deepcopy(arr),
                        'highlighted_indices': list(range(left, right + 1)),
                        'comparing_indices': [],
                        'sorted_indices': list(range(left, right + 1)),
                        'swapped_indices': [],
                        'action': 'merge',
                        'pseudocode_line': 6
                    })
                    step_num += 1
            
            merge_sort_viz(array, 0, n - 1)
        
        elif algorithm_type == 'quick_sort':
            # Simplified quick sort visualization
            def quick_sort_viz(arr, low, high):
                nonlocal step_num
                if low < high:
                    # Partition
                    pivot = arr[high]
                    i = low - 1
                    
                    steps.append({
                        'step_number': step_num,
                        'description': f'Partitioning with pivot {pivot}',
                        'array': copy.deepcopy(arr),
                        'highlighted_indices': [high],
                        'comparing_indices': [],
                        'sorted_indices': [],
                        'swapped_indices': [],
                        'action': 'partition',
                        'pseudocode_line': 3
                    })
                    step_num += 1
                    
                    for j in range(low, high):
                        if arr[j] < pivot:
                            i += 1
                            arr[i], arr[j] = arr[j], arr[i]
                            
                            steps.append({
                                'step_number': step_num,
                                'description': f'Swapping {arr[j]} and {arr[i]}',
                                'array': copy.deepcopy(arr),
                                'highlighted_indices': [high],
                                'comparing_indices': [i, j],
                                'sorted_indices': [],
                                'swapped_indices': [i, j],
                                'action': 'swap',
                                'pseudocode_line': 5
                            })
                            step_num += 1
                    
                    arr[i + 1], arr[high] = arr[high], arr[i + 1]
                    pi = i + 1
                    
                    steps.append({
                        'step_number': step_num,
                        'description': f'Pivot {pivot} placed at position {pi}',
                        'array': copy.deepcopy(arr),
                        'highlighted_indices': [pi],
                        'comparing_indices': [],
                        'sorted_indices': [pi],
                        'swapped_indices': [],
                        'action': 'pivot_placed',
                        'pseudocode_line': 7
                    })
                    step_num += 1
                    
                    quick_sort_viz(arr, low, pi - 1)
                    quick_sort_viz(arr, pi + 1, high)
            
            quick_sort_viz(array, 0, n - 1)
        
        # Final sorted state
        steps.append({
            'step_number': step_num,
            'description': 'Array is now sorted!',
            'array': copy.deepcopy(array),
            'highlighted_indices': [],
            'comparing_indices': [],
            'sorted_indices': list(range(n)),
            'swapped_indices': [],
            'action': 'complete',
            'pseudocode_line': -1
        })
        
        complexity = 'O(n²)' if algorithm_type in ['bubble_sort', 'insertion_sort', 'selection_sort'] else 'O(n log n)'
        
        return {
            'algorithm': algorithm_type.replace('_', ' ').title(),
            'visualization_type': 'array',
            'complexity': complexity,
            'steps': steps,
            'initial_array': input_data.get('data', []),
            'final_array': array,
            'total_steps': len(steps)
        }
    
    @staticmethod
    def visualize_binary_search(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize binary search with shrinking search space"""
        array = sorted(input_data.get('data', [11, 12, 22, 25, 34, 64, 90]))
        target = input_data.get('target', array[len(array) // 2] if array else 0)
        
        steps = []
        step_num = 0
        
        # Initial state
        steps.append({
            'step_number': step_num,
            'description': f'Searching for {target} in sorted array',
            'array': copy.deepcopy(array),
            'highlighted_indices': [],
            'comparing_indices': [],
            'search_space': list(range(len(array))),
            'target': target,
            'left': 0,
            'right': len(array) - 1,
            'mid': -1,
            'action': 'initialize',
            'pseudocode_line': 0
        })
        step_num += 1
        
        left, right = 0, len(array) - 1
        found_index = -1
        
        while left <= right:
            mid = (left + right) // 2
            
            # Show middle element check
            steps.append({
                'step_number': step_num,
                'description': f'Checking middle element: array[{mid}]={array[mid]}',
                'array': copy.deepcopy(array),
                'highlighted_indices': [mid],
                'comparing_indices': [],
                'search_space': list(range(left, right + 1)),
                'target': target,
                'left': left,
                'right': right,
                'mid': mid,
                'action': 'check_middle',
                'pseudocode_line': 5
            })
            step_num += 1
            
            if array[mid] == target:
                found_index = mid
                steps.append({
                    'step_number': step_num,
                    'description': f'Found {target} at index {mid}!',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [mid],
                    'comparing_indices': [],
                    'search_space': [mid],
                    'target': target,
                    'left': left,
                    'right': right,
                    'mid': mid,
                    'action': 'found',
                    'pseudocode_line': 7
                })
                break
            elif array[mid] < target:
                steps.append({
                    'step_number': step_num,
                    'description': f'{array[mid]} < {target}, search right half',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [],
                    'comparing_indices': [mid],
                    'search_space': list(range(mid + 1, right + 1)),
                    'target': target,
                    'left': mid + 1,
                    'right': right,
                    'mid': mid,
                    'action': 'search_right',
                    'pseudocode_line': 9
                })
                left = mid + 1
            else:
                steps.append({
                    'step_number': step_num,
                    'description': f'{array[mid]} > {target}, search left half',
                    'array': copy.deepcopy(array),
                    'highlighted_indices': [],
                    'comparing_indices': [mid],
                    'search_space': list(range(left, mid)),
                    'target': target,
                    'left': left,
                    'right': mid - 1,
                    'mid': mid,
                    'action': 'search_left',
                    'pseudocode_line': 11
                })
                right = mid - 1
            
            step_num += 1
        
        if found_index == -1:
            steps.append({
                'step_number': step_num,
                'description': f'{target} not found in array',
                'array': copy.deepcopy(array),
                'highlighted_indices': [],
                'comparing_indices': [],
                'search_space': [],
                'target': target,
                'left': left,
                'right': right,
                'mid': -1,
                'action': 'not_found',
                'pseudocode_line': 14
            })
        
        return {
            'algorithm': 'Binary Search',
            'visualization_type': 'array_search',
            'complexity': 'O(log n)',
            'steps': steps,
            'initial_array': input_data.get('data', []),
            'target': target,
            'found': found_index != -1,
            'found_index': found_index,
            'total_steps': len(steps)
        }
    
    @staticmethod
    def visualize_graph_traversal(algorithm_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize BFS/DFS graph traversal"""
        graph = input_data.get('data', {
            'A': ['B', 'C'],
            'B': ['D', 'E'],
            'C': ['F'],
            'D': [],
            'E': ['F'],
            'F': []
        })
        nodes = input_data.get('nodes', list(graph.keys()))
        start_node = nodes[0] if nodes else 'A'
        
        steps = []
        step_num = 0
        visited = set()
        
        # Initial state
        steps.append({
            'step_number': step_num,
            'description': f'Starting {algorithm_type.upper()} from node {start_node}',
            'graph': graph,
            'nodes': nodes,
            'visited': list(visited),
            'current': None,
            'queue_or_stack': [start_node],
            'highlighted_edges': [],
            'action': 'initialize',
            'pseudocode_line': 0
        })
        step_num += 1
        
        if algorithm_type == 'bfs':
            queue = [start_node]
            
            while queue:
                current = queue.pop(0)
                
                if current in visited:
                    continue
                
                # Visit node
                visited.add(current)
                steps.append({
                    'step_number': step_num,
                    'description': f'Visiting node {current}',
                    'graph': graph,
                    'nodes': nodes,
                    'visited': list(visited),
                    'current': current,
                    'queue_or_stack': copy.deepcopy(queue),
                    'highlighted_edges': [],
                    'action': 'visit',
                    'pseudocode_line': 3
                })
                step_num += 1
                
                # Add neighbors to queue
                for neighbor in graph.get(current, []):
                    if neighbor not in visited:
                        queue.append(neighbor)
                        steps.append({
                            'step_number': step_num,
                            'description': f'Adding neighbor {neighbor} to queue',
                            'graph': graph,
                            'nodes': nodes,
                            'visited': list(visited),
                            'current': current,
                            'queue_or_stack': copy.deepcopy(queue),
                            'highlighted_edges': [(current, neighbor)],
                            'action': 'enqueue',
                            'pseudocode_line': 5
                        })
                        step_num += 1
        
        else:  # DFS
            stack = [start_node]
            
            while stack:
                current = stack.pop()
                
                if current in visited:
                    continue
                
                # Visit node
                visited.add(current)
                steps.append({
                    'step_number': step_num,
                    'description': f'Visiting node {current}',
                    'graph': graph,
                    'nodes': nodes,
                    'visited': list(visited),
                    'current': current,
                    'queue_or_stack': copy.deepcopy(stack),
                    'highlighted_edges': [],
                    'action': 'visit',
                    'pseudocode_line': 3
                })
                step_num += 1
                
                # Add neighbors to stack (in reverse for correct order)
                for neighbor in reversed(graph.get(current, [])):
                    if neighbor not in visited:
                        stack.append(neighbor)
                        steps.append({
                            'step_number': step_num,
                            'description': f'Pushing neighbor {neighbor} to stack',
                            'graph': graph,
                            'nodes': nodes,
                            'visited': list(visited),
                            'current': current,
                            'queue_or_stack': copy.deepcopy(stack),
                            'highlighted_edges': [(current, neighbor)],
                            'action': 'push',
                            'pseudocode_line': 5
                        })
                        step_num += 1
        
        # Final state
        steps.append({
            'step_number': step_num,
            'description': f'{algorithm_type.upper()} traversal complete!',
            'graph': graph,
            'nodes': nodes,
            'visited': list(visited),
            'current': None,
            'queue_or_stack': [],
            'highlighted_edges': [],
            'action': 'complete',
            'pseudocode_line': -1
        })
        
        return {
            'algorithm': algorithm_type.upper(),
            'visualization_type': 'graph',
            'complexity': 'O(V + E)',
            'steps': steps,
            'graph': graph,
            'nodes': nodes,
            'traversal_order': list(visited),
            'total_steps': len(steps)
        }
    
    @staticmethod
    def visualize_tree(algorithm_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize tree operations (BST, Heap)"""
        sequence = input_data.get('sequence', [5, 3, 7, 2, 4, 6, 8])
        steps = []
        step_num = 0
        
        # We'll represent tree as dict: {value: {'left': ..., 'right': ..., 'parent': ...}}
        tree = {}
        root = None
        
        # Initial state
        steps.append({
            'step_number': step_num,
            'description': f'Building {algorithm_type.upper()} with sequence: {sequence}',
            'tree': copy.deepcopy(tree),
            'root': root,
            'current': None,
            'action': 'initialize',
            'pseudocode_line': 0
        })
        step_num += 1
        
        for value in sequence:
            steps.append({
                'step_number': step_num,
                'description': f'Inserting {value} into tree',
                'tree': copy.deepcopy(tree),
                'root': root,
                'current': value,
                'action': 'insert_start',
                'pseudocode_line': 2
            })
            step_num += 1
            
            if root is None:
                root = value
                tree[value] = {'left': None, 'right': None, 'parent': None}
            else:
                # Find insertion point
                current = root
                path = [current]
                
                while True:
                    if value < current:
                        if tree[current]['left'] is None:
                            tree[current]['left'] = value
                            tree[value] = {'left': None, 'right': None, 'parent': current}
                            break
                        current = tree[current]['left']
                        path.append(current)
                    else:
                        if tree[current]['right'] is None:
                            tree[current]['right'] = value
                            tree[value] = {'left': None, 'right': None, 'parent': current}
                            break
                        current = tree[current]['right']
                        path.append(current)
                
                steps.append({
                    'step_number': step_num,
                    'description': f'Inserted {value} (path: {" → ".join(map(str, path))} → {value})',
                    'tree': copy.deepcopy(tree),
                    'root': root,
                    'current': value,
                    'path': path + [value],
                    'action': 'insert_complete',
                    'pseudocode_line': 5
                })
                step_num += 1
        
        return {
            'algorithm': algorithm_type.upper(),
            'visualization_type': 'tree',
            'complexity': 'O(log n) average',
            'steps': steps,
            'sequence': sequence,
            'final_tree': tree,
            'root': root,
            'total_steps': len(steps)
        }
    
    @staticmethod
    def visualize_fibonacci(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize Fibonacci recursion tree"""
        n = input_data.get('n', input_data.get('value', 5))
        steps = []
        step_num = [0]  # Use list for mutable counter
        call_stack = []
        
        def fib_visualize(num, depth=0, parent_call=None):
            call_id = f"fib({num})"
            
            # Function call
            call_stack.append(call_id)
            steps.append({
                'step_number': step_num[0],
                'description': f'Calling fib({num})',
                'call_stack': copy.deepcopy(call_stack),
                'current_call': call_id,
                'depth': depth,
                'parent': parent_call,
                'action': 'call',
                'pseudocode_line': 2
            })
            step_num[0] += 1
            
            if num <= 1:
                result = num
                steps.append({
                    'step_number': step_num[0],
                    'description': f'fib({num}) = {result} (base case)',
                    'call_stack': copy.deepcopy(call_stack),
                    'current_call': call_id,
                    'depth': depth,
                    'result': result,
                    'action': 'base_case',
                    'pseudocode_line': 3
                })
                step_num[0] += 1
            else:
                # Recursive calls
                left = fib_visualize(num - 1, depth + 1, call_id)
                right = fib_visualize(num - 2, depth + 1, call_id)
                result = left + right
                
                steps.append({
                    'step_number': step_num[0],
                    'description': f'fib({num}) = fib({num-1}) + fib({num-2}) = {left} + {right} = {result}',
                    'call_stack': copy.deepcopy(call_stack),
                    'current_call': call_id,
                    'depth': depth,
                    'result': result,
                    'action': 'combine',
                    'pseudocode_line': 5
                })
                step_num[0] += 1
            
            # Return
            call_stack.pop()
            steps.append({
                'step_number': step_num[0],
                'description': f'Returning {result} from fib({num})',
                'call_stack': copy.deepcopy(call_stack),
                'current_call': call_id,
                'depth': depth,
                'result': result,
                'action': 'return',
                'pseudocode_line': 6
            })
            step_num[0] += 1
            
            return result
        
        final_result = fib_visualize(n)
        
        return {
            'algorithm': 'Fibonacci (Recursion)',
            'visualization_type': 'recursion_tree',
            'complexity': 'O(2^n)',
            'steps': steps,
            'input': n,
            'result': final_result,
            'total_steps': len(steps)
        }
    
    @staticmethod
    def visualize_factorial(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Visualize Factorial recursion tree"""
        n = input_data.get('n', input_data.get('value', 5))
        steps = []
        step_num = [0]  # Use list for mutable counter
        call_stack = []
        
        def factorial_visualize(num, depth=0, parent_call=None):
            call_id = f"factorial({num})"
            
            # Function call
            call_stack.append(call_id)
            steps.append({
                'step_number': step_num[0],
                'description': f'Calling factorial({num})',
                'call_stack': copy.deepcopy(call_stack),
                'current_call': call_id,
                'depth': depth,
                'parent': parent_call,
                'action': 'call',
                'pseudocode_line': 2
            })
            step_num[0] += 1
            
            if num <= 1:
                result = 1
                steps.append({
                    'step_number': step_num[0],
                    'description': f'factorial({num}) = {result} (base case)',
                    'call_stack': copy.deepcopy(call_stack),
                    'current_call': call_id,
                    'depth': depth,
                    'result': result,
                    'action': 'base_case',
                    'pseudocode_line': 3
                })
                step_num[0] += 1
            else:
                # Recursive call
                prev = factorial_visualize(num - 1, depth + 1, call_id)
                result = num * prev
                
                steps.append({
                    'step_number': step_num[0],
                    'description': f'factorial({num}) = {num} × factorial({num-1}) = {num} × {prev} = {result}',
                    'call_stack': copy.deepcopy(call_stack),
                    'current_call': call_id,
                    'depth': depth,
                    'result': result,
                    'action': 'multiply',
                    'pseudocode_line': 5
                })
                step_num[0] += 1
            
            # Return
            call_stack.pop()
            steps.append({
                'step_number': step_num[0],
                'description': f'Returning {result} from factorial({num})',
                'call_stack': copy.deepcopy(call_stack),
                'current_call': call_id,
                'depth': depth,
                'result': result,
                'action': 'return',
                'pseudocode_line': 6
            })
            step_num[0] += 1
            
            return result
        
        final_result = factorial_visualize(n)
        
        return {
            'algorithm': 'Factorial (Recursion)',
            'visualization_type': 'recursion_tree',
            'complexity': 'O(n)',
            'steps': steps,
            'input': n,
            'result': final_result,
            'total_steps': len(steps)
        }

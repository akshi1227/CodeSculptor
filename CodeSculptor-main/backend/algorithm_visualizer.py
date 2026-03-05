"""
Algorithm Visualizer - Generates step-by-step execution data for various algorithms
"""

def detect_algorithm_type(user_input):
    """Detect what type of algorithm the user wants to visualize"""
    input_lower = user_input.lower()
    
    # Recursion & Mathematical (check these first before generic keywords)
    if 'factorial' in input_lower or 'fact(' in input_lower:
        return 'factorial'
    elif 'fibonacci' in input_lower or 'fib(' in input_lower:
        return 'fibonacci'
    
    # Sorting algorithms
    elif 'bubble sort' in input_lower:
        return 'bubble_sort'
    elif 'merge sort' in input_lower:
        return 'merge_sort'
    elif 'quick sort' in input_lower:
        return 'quick_sort'
    elif 'insertion sort' in input_lower:
        return 'insertion_sort'
    elif 'selection sort' in input_lower:
        return 'selection_sort'
    
    # Searching algorithms
    elif 'binary search' in input_lower:
        return 'binary_search'
    elif 'linear search' in input_lower:
        return 'linear_search'
    
    # Graph algorithms
    elif 'bfs' in input_lower or 'breadth first' in input_lower or 'breadth-first' in input_lower:
        return 'bfs'
    elif 'dfs' in input_lower or 'depth first' in input_lower or 'depth-first' in input_lower:
        return 'dfs'
    elif 'dijkstra' in input_lower:
        return 'dijkstra'
    
    # Tree algorithms
    elif 'bst' in input_lower or 'binary search tree' in input_lower:
        return 'bst'
    elif 'heap' in input_lower:
        return 'heap'
    
    # Check for generic keywords
    elif 'sort' in input_lower:
        return 'bubble_sort'  # Default sorting
    elif 'search' in input_lower:
        return 'binary_search'  # Default searching
    elif 'graph' in input_lower or 'traverse' in input_lower:
        return 'bfs'  # Default graph traversal
    elif 'tree' in input_lower:
        return 'bst'  # Default tree
    elif 'even' in input_lower and 'odd' in input_lower:
        return 'even_odd_check'
    
    return 'generic'


def generate_visualization_steps(algorithm_type, user_input):
    """Generate step-by-step visualization data for the algorithm"""
    
    if algorithm_type == 'bubble_sort':
        return generate_bubble_sort_steps()
    elif algorithm_type == 'merge_sort':
        return generate_merge_sort_steps()
    elif algorithm_type == 'quick_sort':
        return generate_quick_sort_steps()
    elif algorithm_type == 'binary_search':
        return generate_binary_search_steps()
    elif algorithm_type == 'even_odd_check':
        return generate_even_odd_steps()
    else:
        return generate_generic_steps(user_input)


def generate_bubble_sort_steps():
    """Generate visualization steps for Bubble Sort"""
    array = [64, 34, 25, 12, 22, 11, 90]
    steps = []
    
    # Initial state
    steps.append({
        "step_number": 0,
        "description": "Initial unsorted array",
        "array": array.copy(),
        "highlighted_indices": [],
        "comparing_indices": [],
        "sorted_indices": [],
        "action": "initialize"
    })
    
    n = len(array)
    step_num = 1
    
    for i in range(n):
        for j in range(0, n - i - 1):
            # Comparison step
            steps.append({
                "step_number": step_num,
                "description": f"Comparing {array[j]} and {array[j+1]}",
                "array": array.copy(),
                "highlighted_indices": [],
                "comparing_indices": [j, j+1],
                "sorted_indices": list(range(n - i, n)),
                "action": "compare"
            })
            step_num += 1
            
            # Swap if needed
            if array[j] > array[j + 1]:
                array[j], array[j + 1] = array[j + 1], array[j]
                steps.append({
                    "step_number": step_num,
                    "description": f"Swapping {array[j+1]} and {array[j]}",
                    "array": array.copy(),
                    "highlighted_indices": [j, j+1],
                    "comparing_indices": [],
                    "sorted_indices": list(range(n - i, n)),
                    "action": "swap"
                })
                step_num += 1
    
    # Final sorted state
    steps.append({
        "step_number": step_num,
        "description": "Array is now sorted!",
        "array": array.copy(),
        "highlighted_indices": [],
        "comparing_indices": [],
        "sorted_indices": list(range(n)),
        "action": "complete"
    })
    
    return {
        "algorithm": "Bubble Sort",
        "complexity": "O(n²)",
        "steps": steps,
        "initial_array": [64, 34, 25, 12, 22, 11, 90],
        "final_array": array
    }


def generate_merge_sort_steps():
    """Generate visualization steps for Merge Sort"""
    array = [38, 27, 43, 3, 9, 82, 10]
    steps = []
    step_counter = [0]  # Use list to allow modification in nested function
    
    def merge_sort_recursive(arr, left, right, depth=0):
        if left < right:
            mid = (left + right) // 2
            
            # Show division
            steps.append({
                "step_number": step_counter[0],
                "description": f"Dividing array at index {mid}",
                "array": array.copy(),
                "highlighted_indices": list(range(left, right + 1)),
                "comparing_indices": [mid],
                "sorted_indices": [],
                "action": "divide",
                "depth": depth
            })
            step_counter[0] += 1
            
            merge_sort_recursive(arr, left, mid, depth + 1)
            merge_sort_recursive(arr, mid + 1, right, depth + 1)
            
            # Merge
            merge(arr, left, mid, right, depth)
    
    def merge(arr, left, mid, right, depth):
        # Merging visualization
        steps.append({
            "step_number": step_counter[0],
            "description": f"Merging subarrays",
            "array": array.copy(),
            "highlighted_indices": list(range(left, right + 1)),
            "comparing_indices": [],
            "sorted_indices": [],
            "action": "merge",
            "depth": depth
        })
        step_counter[0] += 1
        
        # Actual merge logic
        left_part = arr[left:mid + 1]
        right_part = arr[mid + 1:right + 1]
        
        i = j = 0
        k = left
        
        while i < len(left_part) and j < len(right_part):
            if left_part[i] <= right_part[j]:
                arr[k] = left_part[i]
                i += 1
            else:
                arr[k] = right_part[j]
                j += 1
            k += 1
        
        while i < len(left_part):
            arr[k] = left_part[i]
            i += 1
            k += 1
        
        while j < len(right_part):
            arr[k] = right_part[j]
            j += 1
            k += 1
        
        # Show merged result
        steps.append({
            "step_number": step_counter[0],
            "description": f"Merged result",
            "array": array.copy(),
            "highlighted_indices": list(range(left, right + 1)),
            "comparing_indices": [],
            "sorted_indices": list(range(left, right + 1)),
            "action": "merged",
            "depth": depth
        })
        step_counter[0] += 1
    
    # Initial state
    steps.append({
        "step_number": 0,
        "description": "Initial unsorted array",
        "array": array.copy(),
        "highlighted_indices": [],
        "comparing_indices": [],
        "sorted_indices": [],
        "action": "initialize",
        "depth": 0
    })
    step_counter[0] = 1
    
    merge_sort_recursive(array, 0, len(array) - 1)
    
    return {
        "algorithm": "Merge Sort",
        "complexity": "O(n log n)",
        "steps": steps,
        "initial_array": [38, 27, 43, 3, 9, 82, 10],
        "final_array": array
    }


def generate_binary_search_steps():
    """Generate visualization steps for Binary Search"""
    array = [11, 12, 22, 25, 34, 64, 90]  # Sorted array
    target = 25
    steps = []
    
    left, right = 0, len(array) - 1
    step_num = 0
    
    # Initial state
    steps.append({
        "step_number": step_num,
        "description": f"Searching for {target} in sorted array",
        "array": array.copy(),
        "highlighted_indices": [],
        "comparing_indices": [],
        "search_space": list(range(left, right + 1)),
        "target": target,
        "action": "initialize"
    })
    step_num += 1
    
    while left <= right:
        mid = (left + right) // 2
        
        # Show middle element check
        steps.append({
            "step_number": step_num,
            "description": f"Checking middle element: {array[mid]}",
            "array": array.copy(),
            "highlighted_indices": [mid],
            "comparing_indices": [],
            "search_space": list(range(left, right + 1)),
            "target": target,
            "action": "check_middle"
        })
        step_num += 1
        
        if array[mid] == target:
            steps.append({
                "step_number": step_num,
                "description": f"Found {target} at index {mid}!",
                "array": array.copy(),
                "highlighted_indices": [mid],
                "comparing_indices": [],
                "search_space": [mid],
                "target": target,
                "action": "found"
            })
            break
        elif array[mid] < target:
            steps.append({
                "step_number": step_num,
                "description": f"{array[mid]} < {target}, search right half",
                "array": array.copy(),
                "highlighted_indices": [],
                "comparing_indices": [mid],
                "search_space": list(range(mid + 1, right + 1)),
                "target": target,
                "action": "search_right"
            })
            left = mid + 1
        else:
            steps.append({
                "step_number": step_num,
                "description": f"{array[mid]} > {target}, search left half",
                "array": array.copy(),
                "highlighted_indices": [],
                "comparing_indices": [mid],
                "search_space": list(range(left, mid)),
                "target": target,
                "action": "search_left"
            })
            right = mid - 1
        
        step_num += 1
    
    return {
        "algorithm": "Binary Search",
        "complexity": "O(log n)",
        "steps": steps,
        "initial_array": array,
        "target": target
    }


def generate_even_odd_steps():
    """Generate visualization for even/odd check"""
    number = 42
    steps = []
    
    steps.append({
        "step_number": 0,
        "description": f"Check if {number} is even or odd",
        "number": number,
        "action": "initialize"
    })
    
    steps.append({
        "step_number": 1,
        "description": f"Calculate {number} % 2",
        "number": number,
        "remainder": number % 2,
        "action": "calculate"
    })
    
    result = "even" if number % 2 == 0 else "odd"
    steps.append({
        "step_number": 2,
        "description": f"{number} is {result}!",
        "number": number,
        "remainder": number % 2,
        "result": result,
        "action": "result"
    })
    
    return {
        "algorithm": "Even/Odd Check",
        "complexity": "O(1)",
        "steps": steps,
        "number": number,
        "result": result
    }


def generate_generic_steps(user_input):
    """Generate generic pseudocode steps"""
    return {
        "algorithm": "Generic Algorithm",
        "complexity": "N/A",
        "steps": [
            {
                "step_number": 0,
                "description": "Algorithm steps will be shown here",
                "action": "generic"
            }
        ]
    }


def generate_algorithm_pseudocode(algorithm_type, user_input):
    """Generate algorithm-specific pseudocode"""
    
    if algorithm_type == 'bubble_sort':
        return """START Bubble Sort
// Bubble Sort Algorithm - O(n²) complexity
// Repeatedly compares adjacent elements and swaps them if they are in wrong order

1. INPUT: array[] of n elements
2. FOR i = 0 TO n-1 DO
3.     FOR j = 0 TO n-i-2 DO
4.         IF array[j] > array[j+1] THEN
5.             SWAP array[j] and array[j+1]
6.         END IF
7.     END FOR
8. END FOR
9. OUTPUT: Sorted array
END"""
    
    elif algorithm_type == 'merge_sort':
        return """START Merge Sort
// Merge Sort Algorithm - O(n log n) complexity
// Divide and conquer algorithm that divides array into halves, sorts them and merges

1. FUNCTION mergeSort(array[], left, right)
2.     IF left < right THEN
3.         mid = (left + right) / 2
4.         mergeSort(array, left, mid)      // Sort first half
5.         mergeSort(array, mid+1, right)   // Sort second half
6.         merge(array, left, mid, right)   // Merge sorted halves
7.     END IF
8. END FUNCTION

9. FUNCTION merge(array[], left, mid, right)
10.     CREATE leftArray[] and rightArray[]
11.     COPY data to leftArray[] and rightArray[]
12.     MERGE leftArray[] and rightArray[] back into array[]
13. END FUNCTION

14. OUTPUT: Sorted array
END"""
    
    elif algorithm_type == 'binary_search':
        return """START Binary Search
// Binary Search Algorithm - O(log n) complexity
// Searches for a target value in a sorted array by repeatedly dividing search interval in half

1. INPUT: sorted array[], target value
2. left = 0
3. right = length(array) - 1
4. WHILE left <= right DO
5.     mid = (left + right) / 2
6.     IF array[mid] == target THEN
7.         RETURN mid  // Found at index mid
8.     ELSE IF array[mid] < target THEN
9.         left = mid + 1  // Search right half
10.    ELSE
11.        right = mid - 1  // Search left half
12.    END IF
13. END WHILE
14. RETURN -1  // Not found
END"""
    
    elif algorithm_type == 'even_odd_check':
        return """START Even/Odd Check
// Check if a number is even or odd using modulo operator

1. INPUT: number
2. remainder = number MOD 2
3. IF remainder == 0 THEN
4.     OUTPUT: number is EVEN
5. ELSE
6.     OUTPUT: number is ODD
7. END IF
END"""
    
    else:
        # Generic fallback
        return f"""START Algorithm
// Processing: {user_input}

1. DECLARE variables needed for the algorithm
2. INPUT: Get required data from user
3. PROCESS: 
   IF condition is met THEN
       Perform main operation
       Calculate result
   ELSE
       Handle alternative case
   END IF
4. FOR each item in collection DO
       Process item
       Update counters
   END FOR
5. OUTPUT: Display results to user
6. RETURN final value
END"""


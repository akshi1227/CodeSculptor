let isSignup = true;

function toggleMode() {
  isSignup = !isSignup;
  
  // Clear previous error messages
  showError("");
  
  // Toggle visibility of name and confirm password fields
  const nameField = document.getElementById("name");
  const confirmField = document.getElementById("confirm");
  
  if (isSignup) {
    nameField.style.display = "block";
    confirmField.style.display = "block";
    document.getElementById("title").innerText = "Sign Up";
    document.querySelector(".main-btn").innerText = "Sign Up";
    document.getElementById("switchText").innerHTML = 
      `Already have an account? <span onclick="toggleMode()">Log in</span>`;
  } else {
    nameField.style.display = "none";
    confirmField.style.display = "none";
    document.getElementById("title").innerText = "Sign In";
    document.querySelector(".main-btn").innerText = "Login";
    document.getElementById("switchText").innerHTML = 
      `Don't have an account? <span onclick="toggleMode()">Sign Up</span>`;
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  errorElement.textContent = message;
  errorElement.style.display = message ? "block" : "none";
}

function validateInputs() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  // Clear previous errors
  showError("");

  // Common validations for both signup and login
  if (!email) {
    showError("Email is required");
    return false;
  }

  if (!validateEmail(email)) {
    showError("Please enter a valid email address");
    return false;
  }

  if (!password) {
    showError("Password is required");
    return false;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return false;
  }

  // Signup specific validations
  if (isSignup) {
    if (!name) {
      showError("Full name is required");
      return false;
    }

    if (!confirm) {
      showError("Please confirm your password");
      return false;
    }

    if (password !== confirm) {
      showError("Passwords do not match");
      return false;
    }
  }

  return true;
}

function handleAuth() {
  // Validate inputs first
  if (!validateInputs()) {
    return;
  }

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (isSignup) {
    // Check for duplicate email
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      showError("An account with this email already exists");
      return;
    }

    // Create new user
    const newUser = {
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    
    // Auto-login after successful signup
    localStorage.setItem("currentUser", JSON.stringify({
      email: email,
      name: name
    }));
    
    window.location.href = "index.html";
  } else {
    // Login logic
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify({
        email: user.email,
        name: user.name
      }));
      window.location.href = "index.html";
    } else {
      showError("Invalid email or password");
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Hide confirm password and name fields initially (in login mode)
  if (!isSignup) {
    document.getElementById("name").style.display = "none";
    document.getElementById("confirm").style.display = "none";
  }
});
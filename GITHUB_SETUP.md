# 📤 Upload to GitHub Guide

## Step 1: Initialize Git Repository

Open terminal in your project folder and run:

```bash
cd "c:\Users\DELL\OneDrive\Desktop\CodeSculptor-main"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CodeSculptor Algorithm Visualizer"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `CodeSculptor`
3. Description: `AI-powered algorithm visualizer with pseudocode generation`
4. Choose: **Public** or **Private**
5. Click **Create repository**

## Step 3: Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/CodeSculptor.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 4: Deploy Frontend (GitHub Pages)

### Option A: Automatic Deployment (Recommended)
I've already created `.github/workflows/deploy.yml` - it will auto-deploy when you push!

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** / **root**
5. Click **Save**
6. Your site will be at: `https://yourusername.github.io/CodeSculptor`

### Option B: Manual Deployment
```bash
# Install gh-pages
cd frontend
npm install -g gh-pages

# Deploy
gh-pages -d . -b gh-pages
```

## Step 5: Environment Variables (Important!)

⚠️ **Never commit your `.env` file with API keys!**

For GitHub deployment:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:
   - `GROQ_API_KEY` - Your Groq API key
   - `GOOGLE_API_KEY` - Your Google/Gemini API key
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens

## Step 6: Backend Deployment (Optional)

For full functionality, you need to deploy the Flask backend:

### Free Options:
1. **Render.com** (Recommended - free)
   - Go to https://render.com
   - Connect your GitHub repo
   - Create Web Service
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`

2. **Railway.app**
3. **PythonAnywhere**
4. **Heroku**

### Update Frontend API URL
After deploying backend, update:
```javascript
// frontend/js/mongodb-history.js
this.apiBaseUrl = 'https://your-backend-url.onrender.com/api';
```

## 🌐 Final URLs

| Component | URL |
|-----------|-----|
| Frontend | `https://yourusername.github.io/CodeSculptor` |
| Backend API | `https://your-backend.onrender.com` |

## 🔄 Future Updates

Just push changes and everything auto-deploys:
```bash
git add .
git commit -m "Updated features"
git push origin main
```

## 📋 Quick Checklist

- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] Environment secrets added
- [ ] Backend deployed (optional)
- [ ] Frontend API URL updated

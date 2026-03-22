# 🚀 SnipLink: Zero-Knowledge Deployment Guide

This guide will take you from local code to a globally working URL shortener. No prior deployment experience is required.

---

## Phase 1: Prepare Your Code (GitHub)

1. **Commit Your Changes**: Save all your work in your local folder.
2. **Create a GitHub Repo**: Go to [GitHub](https://github.com), create a new "Public" repository named `sniplink`.
3. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sniplink.git
   git push -u origin main
   ```

---

## Phase 2: Deploy the Backend & Database (Railway)

We use **Railway** because it provides PostgreSQL and Node.js hosting in one click.

1. **Sign Up**: Go to [Railway.app](https://railway.app) and sign up with GitHub.
2. **New Project**: Click "New Project" -> "Provision PostgreSQL". This creates your database.
3. **Deploy Backend**:
   - Click "New" -> "GitHub Repo" -> Select `sniplink`.
   - Railway will ask for the **Root Directory**. Set this to `server`.
4. **Configure Variables**:
   - Click on your `sniplink` service -> **Variables** tab.
   - Click "New Variable" and add these:
     - `PORT`: `5001`
     - `JWT_SECRET`: (Type any random string like `super-secret-key-123`)
     - `CLIENT_URL`: (Hold on, we'll get this from Vercel in the next phase).
     - `DATABASE_URL`: Click "Add Reference" and select `${{PostgreSQL.DATABASE_URL}}`.
5. **Get Your Backend URL**: After it deploys, go to the **Settings** tab and click "Generate Domain". It will look like `sniplink-production.up.railway.app`. **Copy this URL.**

---

## Phase 3: Deploy the Frontend (Vercel)

1. **Sign Up**: Go to [Vercel.com](https://vercel.com) and sign up with GitHub.
2. **Import Project**: Click "Add New" -> "Project" -> Select `sniplink`.
3. **Settings**:
   - **Framework Preset**: Vite.
   - **Root Directory**: Set this to `client`.
4. **Environment Variables**:
   - Click "Environment Variables".
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app/api` (Paste your backend URL from Phase 2 and add `/api` at the end).
5. **Deploy**: Click "Deploy". Once finished, Vercel will give you a production URL (e.g., `sniplink.vercel.app`).

---

## Phase 4: The Final Integration (Crucial Step)

For the backend to talk to the frontend, you must update the `CLIENT_URL` in Railway.

1. Go back to your [Railway Dashboard](https://railway.app).
2. Go to your `server` service -> **Variables**.
3. Update `CLIENT_URL` with your **Vercel URL** (e.g., `https://sniplink.vercel.app`).
4. Railway will automatically redeploy. 

**Congratulations! Your app is now live globally.** 🚀

---

## 🛠️ Modifications Summary (Already handled for you)

- **CORS**: The server is configured to accept connections from your Railway and Vercel domains.
- **Ports**: The application dynamically detects the port assigned by Railway.
- **Environment Variables**: The `import.meta.env` (frontend) and `process.env` (backend) systems are set up to use your production values.

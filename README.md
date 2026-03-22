# 🔗 SnipLink | Smart URL Shortener

App live on https://snip-link-online.vercel.app

### Project Overview
SnipLink is a high-performance, full-stack URL shortening platform built for the modern web. It enables users to create personalized short links, track global traffic in real-time, and manage their digital identity with a premium, high-contrast interface. Designed with a "User-First" philosophy, it balances powerful analytics with a sleek, intuitive dashboard.

---

## ✨ Complete Feature List

### 🔑 Authentication & Security
- **Secure Signup/Login**: JWT-based authentication with encrypted password storage (bcrypt).
- **Protected Dashboard**: Only authenticated users can access and manage their own links.
- **Account Management**: Ability to delete accounts with a full database cascade cleanup (safe purging of all user data).

### ✂️ URL Shortening & Management
- **Smart Shortening**: Generates unique, collision-resistant 7-character short codes using `nanoid`.
- **Custom Aliases**: Users can define their own branded short URLs (e.g., `sniplink.com/my-link`).
- **Live Reachability Check**: Real-time validation ensures a destination URL is live before shortening.
- **Expiry Dates**: Set optional expiration dates (DD-MM-YYYY) to auto-disable links.
- **Edit & Update**: Modify titles, original URLs, and expiry dates without changing the short link.

### 📊 Advanced Analytics (Real-Time)
- **WebSocket Click Tracking**: Live updates to the dashboard and analytics page via Socket.IO—watch your clicks grow without refreshing.
- **Global Traffic Pulse**: An interactive map showing the physical geolocation (Country/City) of every click.
- **Comprehensive Insights**:
    - **Total Clicks**: Aggregate performance over time.
    - **Device Breakdown**: OS (Windows, macOS, Android, iOS) and Device Type (Desktop, Mobile, Tablet).
    - **Browser Stats**: Identification of Chrome, Safari, Firefox, etc.
    - **Referrer Tracking**: Origins of the traffic (e.g., Twitter, Direct).

### 📁 Bulk Operations
- **CSV Bulk Upload**: Shorten hundreds of URLs simultaneously using a simple `.csv` template.
- **Automatic Processing**: Handles bulk creation with individual title and alias support.

### 🎨 Premium User Experience
- **Dark/Light Theme Toggle**: High-performance theme engine with global state persistence.
- **Dynamic Themes**: QR codes and UI separators adjust automatically for maximum contrast.
- **Premium Custom Badges**: Animated emerald "CUSTOM" badges for branded links.
- **Mobile Responsive**: Fully optimized for phones, tablets, and wide-screen desktops.

---

## 🏗️ System Architecture

### Technical Stack
- **Frontend**: React.js (Vite), Framer Motion (Animations), Recharts (Data Viz).
- **Backend**: Node.js, Express, Socket.IO (Real-time events).
- **Database**: PostgreSQL with Prisma ORM for type-safe data management.
- **Geolocation**: `geoip-lite` for high-speed IP resolution.

### System Diagram
```mermaid
graph TD
    User((User)) -->|Browser| Frontend[React Single Page App]
    Frontend -->|REST API| Backend[Express Server]
    Backend -->|ORM| Prisma[Prisma Client]
    Prisma -->|Query| DB[(PostgreSQL)]
    Backend <-->|WebSockets| Socket[Socket.IO Engine]
    Socket <-->|Live Events| Frontend
    Redirect[Short Link Redirector] -->|Visit Log| Backend
```

---

## 🧠 AI Planning & Workflow Documentation

This project was developed using a state-of-the-art **Agentic AI Workflow**:

1. **Initial Requirement Mapping**: Distilled the Hackathon problem statement into core functional requirements (Auth, CRUD, Analytics).
2. **Design Tokenization**: Established a central CSS variable system (`index.css`) to allow for seamless Light/Dark theme switching from the ground up.
3. **Iterative Feature Sprinting**:
    - **Sprint A**: Core Link CRUD + Redirection engine.
    - **Sprint B**: Analytics engine with IP resolution and User-Agent parsing.
    - **Sprint C**: Real-time layer via Socket.IO rooms for per-user isolation.
4. **Professionalism Pass**: Automated audits to remove debug logs, standardize date formats (DD-MM-YYYY), and verify cross-device compatibility.
5. **High-Contrast Polish**: Targetted UI refinements to ensure structural symmetry and "OLED" pure-black backgrounds in Dark Mode.

---

## 📦 Local Setup Instructions

### 1. Prerequisites
- **Node.js**: v18 or higher.
- **PostgreSQL**: A running instance (local or remote).

### 2. Environment Configuration
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sniplink?schema=public"
JWT_SECRET="your_secret_key"
CLIENT_URL="http://localhost:5173"
PORT=5001
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL="http://localhost:5001/api"
```

### 3. Installation & Launch
```bash
# In the project root
npm install

# Start Backend
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Start Frontend (Separate Terminal)
cd client
npm install
npm run dev
```

---

## 📝 Assumptions Made

1. **Geolocation Persistence**: IP tracking uses the visitor's public IP. For local development, geolocation relies on the server's external IP or fallback to India (Generalized) for testing purposes.
2. **URL Validity**: The system assumes the user wants live URLs. We perform a `HEAD` request to verify reachability; redirected or protected URLs might show "Offline" if they block HEAD requests.
3. **Unique Aliases**: Custom aliases are globally unique across all users to prevent redirection collisions.
4. **Real-time Performance**: Socket.IO is configured with WebSocket preference to minimize latency on modern browsers.

---

## 📽️ Project Demonstration
[**Watch the Explanation & Demo Video Here**](https://youtube.com/your-demo-link)

---
<p align="center">
This project is a part of a hackathon run by https://katomaran.com
</p>

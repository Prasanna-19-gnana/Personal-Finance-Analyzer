# Personal Finance Analyzer - Frontend

This is the React frontend for the Personal Finance Analyzer, built using Vite for incredibly fast builds and hot-reloading.

## 🛠 Tech Stack
- **React (Vite):** Core UI framework utilized for building a lightning-fast Single Page Application (SPA).
- **Axios:** Extensible HTTP Client acting as our gateway to handle all backend requests (with Auth interceptors checking JWTs).
- **Recharts:** Used on the Dashboard to render highly responsive, data-driven visual graphics (Pie Charts, Bar Charts).
- **Lucide-React:** Provides sleek, consistent SVG icons throughout the interface.
- **React Router:** Allows client-side routing to seamlessly swap pages instantly without reloading the browser.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16.x or strictly higher)
- `npm` or `yarn` package manager

### 2. Installation
Navigate to the `frontend` directory and install the necessary npm packages:
```bash
cd frontend
npm install
```

### 3. API Configuration
If you deploy your backend to an actual remote URL, adjust the configuration path found in `src/api/api.js`:
```javascript
const api = axios.create({
  baseURL: 'http://127.0.0.1:5001/api', // Make sure this matches your Flask port!
});
```

### 4. Running the Dev Server
Start the frontend development server:
```bash
npm run dev
```
By default, the Vite application will boot up at `http://localhost:5173`. Open this URL in your web browser.

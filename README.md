# Personal Finance Analyzer 💰

An intelligent, full-stack personal finance application that tracks your income and expenses, enforces monthly budgets per category, and provides AI-driven financial insights based strictly on your unique spending habits.

## 🏗 Complete Architecture & Tech Stack

This project is decoupled into two primary architectures: a RESTful AI-powered Backend, and a lightning-fast React Frontend.

### Frontend (`/frontend`)
- **React (Vite):** Blazing fast UI development and hot-reloading.
- **Axios:** Handles API calls with intelligent interceptors for JWT token lifecycle management.
- **Recharts:** Renders dynamic pie charts and bar charts for budgets vs. actuals natively in the UI.
- **Lucide-React:** Lightweight, modern, consistent icon set.

### Backend (`/backend`)
- **Python (Flask):** Serves lightweight and fast REST APIs handling complex business logic.
- **SQLAlchemy (SQLite):** Object-Relational Mapping (ORM) for secure database queries. Completely modular and instantly upgradable to MySQL or PostgreSQL.
- **Flask-JWT-Extended:** Secure stateless session management over the network.
- **Flask-Mail:** Connects via SMTP to send fast OTP (One Time Password) validation emails for Registration and Password recovery workflows.
- **OpenAI API (GPT-4o/3.5):** Reads summarized monthly data payloads (without exposing raw logic) to generate heavily customized and highly actionable financial reports.

---

## 📖 Complete Setup & Usage Guide

### 1. Initial Setup Checklist
Make sure you have **Node.js** and **Python 3.8+** installed before beginning.

### 2. Backend Configuration
1. Open a terminal and strictly navigate to `./backend`.
2. Create your isolated python virtual environment: 
   ```bash
   python3 -m venv venv
   ```
3. Activate the environment: 
   - **Mac/Linux:** `source venv/bin/activate`
   - **Windows:** `venv\Scripts\activate`
4. Install all Python libraries: 
   ```bash
   pip install -r requirements.txt
   ```
5. Set up the Environment Variables by creating a `./backend/.env` file containing everything needed to connect API keys and your Email service:
   ```env
   SECRET_KEY=your-finance-app-secret
   JWT_SECRET_KEY=your-jwt-auth-secret
   DATABASE_URL=sqlite:///finance.db
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=true
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_gmail_app_password
   OPENAI_API_KEY=sk-your-openai-api-key
   ```
6. Initialize the SQL Database natively: 
   ```bash
   flask --app run init-db
   ```
7. Start the backend Server: 
   ```bash
   python run.py
   ```
   *(The server will boot up locally parsing requests on port 5001).*

### 3. Frontend Configuration
1. Open a separate, brand new terminal tab and navigate into `./frontend`.
2. Install Javascript Node dependencies natively: 
   ```bash
   npm install
   ```
3. Boot up the Vite web application interface: 
   ```bash
   npm run dev
   ```
   *(The web-app will normally launch automatically at http://localhost:5173).*

---

## 💡 How to Use the Application

- **Sign Up / Registration:** Upon first visiting the site, register an account with a valid email. You will receive an OTP code to your inbox right away. You must input the OTP code back into the app to actively unlock and secure your account.
- **Navigating Transactions:** Head over to the Transactions tab to add both incoming paychecks and outgoing expenses. A comprehensive monthly filter allows you to pivot back and forth in historic data directly on-client.
- **Governing Budgets:** Navigate to the Budgets page to map out limits based entirely on different categories (like Rent, Groceries, Dining) individually mapped out for each unique month.
- **The AI Dashboard:** Here, your data visualizes itself. 
   - Observe a complete **Net Balance** tracker relative to your monthly timeline.
   - Any broken budget limits trigger proactive **Overspending Alerts**.
   - Press the **AI Financial Insights** refresh tag to utilize the backend OpenAI module, writing and returning bespoke advisory summaries to your account.
- **Recovering Passwords:** Utilizing the same SMTP module on login, click the secure **Forgot Password** path to issue a verification token via email to swap lost application hashes out safely.
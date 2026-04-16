# Personal Finance Analyzer - Backend

This is the Flask-based Python backend for the Personal Finance Analyzer. It provides the REST API, handles database connections, generates AI insights, and manages secure user authentication.

## Feature Coverage
- JWT authentication with hashed passwords
- Role-based authorization (`user`, `admin`)
- Versioned APIs under `/api/v1/*` (legacy `/api/*` remains available)
- CRUD for transactions and budgets
- OTP-based email verification and password reset

## 🛠 Tech Stack
- **Flask:** Core Python Web Framework.
- **Flask-SQLAlchemy:** ORM (Object-Relational Mapper) for a SQL database such as PostgreSQL.
- **Flask-JWT-Extended:** Manages secure, stateless user sessions using auth tokens.
- **Flask-Mail:** Handles sending reliable OTP (One Time Password) emails via SMTP.
- **OpenAI API:** Automates analyzing aggregated user transaction data to reply with generative financial insights.

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.8+
- Virtual Environment (`venv`)

### 2. Installation
Navigate to the `backend` directory, create a virtual environment, and install requirements:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the `backend` folder with the following variables:
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=postgresql+psycopg2://your_user:your_password@127.0.0.1:5432/finance_db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
OPENAI_API_KEY=sk-your_openai_api_key_here
```

If you want to keep local development simple, you can also point `DATABASE_URL` at a local SQLite file. PostgreSQL is the recommended option for a real SQL server setup.

### 4. Database Initialization
To create the database tables in your configured SQL database:
```bash
flask --app run init-db
```

### 5. Running the Server
Make sure the virtual environment is active, then run:
```bash
python run.py
```
The API will spin up locally on `http://127.0.0.1:5001`.

## API Documentation
- Postman collection: `backend/docs/postman_collection.json`
- Set `baseUrl` to `http://127.0.0.1:5001/api/v1`
- Set `token` from login response `access_token`.

## API Versioning
- Current versioned routes: `/api/v1/auth`, `/api/v1/transactions`, `/api/v1/budgets`, `/api/v1/dashboard`, `/api/v1/admin`
- Backward-compatible aliases are available under `/api/*`.

## Role-Based Access
- `user`: default role for normal accounts
- `admin`: can access admin endpoints such as `/api/v1/admin/users` and `/api/v1/admin/transactions`
- Assign admin role by adding email(s) to `ADMIN_EMAILS` in `.env` (comma-separated).

## Scalability Notes
- API is modularized by domain (`auth`, `transactions`, `budgets`, `dashboard`, `admin`) for easier horizontal growth.
- JWT keeps auth stateless, making load-balanced multi-instance deployment straightforward.
- SQLAlchemy enables database portability between PostgreSQL/MySQL and supports connection pooling.
- Recommended next production steps: Redis cache for hot dashboard queries, centralized structured logging, background workers for email/AI jobs, and containerized deployment behind a reverse proxy.
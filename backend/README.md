# Personal Finance Analyzer - Backend

This is the Flask-based Python backend for the Personal Finance Analyzer. It provides the REST API, handles database connections, generates AI insights, and manages secure user authentication.

## 🛠 Tech Stack
- **Flask:** Core Python Web Framework.
- **Flask-SQLAlchemy:** ORM (Object-Relational Mapper) for our SQLite database (easily scalable to MySQL).
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
DATABASE_URL=sqlite:///finance.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### 4. Database Initialization
To create the SQLite database (`instance/finance.db`) and necessary tables:
```bash
flask --app run init-db
```

### 5. Running the Server
Make sure the virtual environment is active, then run:
```bash
python run.py
```
The API will spin up locally on `http://127.0.0.1:5001`.
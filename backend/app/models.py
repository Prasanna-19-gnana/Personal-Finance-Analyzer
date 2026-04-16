from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    """Represents an application user authenticated via email OTP."""
    __tablename__ = 'user'

    id         = db.Column(db.Integer,     primary_key=True)
    username   = db.Column(db.String(64),  index=True, unique=True, nullable=False)
    email      = db.Column(db.String(120), index=True, unique=True, nullable=True)
    name       = db.Column(db.String(120), nullable=True)
    gender     = db.Column(db.String(20),  nullable=True)
    work       = db.Column(db.String(120), nullable=True)
    role       = db.Column(db.String(20),  nullable=False, default='user', index=True)
    # password_hash kept for legacy compatibility; OTP-auth users won't have one
    password_hash = db.Column(db.String(256), nullable=True)
    is_verified   = db.Column(db.Boolean,  default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    transactions = db.relationship('Transaction', backref='owner', lazy='dynamic')
    budgets      = db.relationship('Budget',      backref='owner', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id':         self.id,
            'username':   self.username,
            'email':      self.email,
            'name':       self.name,
            'gender':     self.gender,
            'work':       self.work,
            'role':       self.role,
            'created_at': self.created_at.isoformat(),
        }


class OTPRecord(db.Model):
    """
    Stores hashed OTPs with expiry and replay-prevention.
    Each new OTP request for an email replaces the previous record.
    """
    __tablename__ = 'otp_record'

    id           = db.Column(db.Integer,     primary_key=True)
    email        = db.Column(db.String(120), index=True, nullable=False)
    otp_hash     = db.Column(db.String(256), nullable=False)   # bcrypt hash of the 6-digit OTP
    expires_at   = db.Column(db.DateTime,   nullable=False)
    is_used      = db.Column(db.Boolean,    default=False)
    attempts     = db.Column(db.Integer,    default=0)         # wrong-guess counter
    created_at   = db.Column(db.DateTime,  default=datetime.utcnow)

    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def is_exhausted(self, max_attempts: int) -> bool:
        return self.attempts >= max_attempts


class Category(db.Model):
    id   = db.Column(db.Integer,     primary_key=True)
    name = db.Column(db.String(64),  unique=True, index=True)
    type = db.Column(db.String(20),  default='EXPENSE')


class Transaction(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    amount      = db.Column(db.Float,   nullable=False)
    type        = db.Column(db.String(20), nullable=False)   # 'INCOME' | 'EXPENSE'
    date        = db.Column(db.Date,    nullable=False, default=datetime.utcnow)
    description = db.Column(db.String(255))

    category = db.relationship('Category')


class Budget(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    amount      = db.Column(db.Float,   nullable=False)
    month_year  = db.Column(db.String(7), nullable=False)   # YYYY-MM

    category = db.relationship('Category')

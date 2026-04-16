from flask              import Flask, jsonify
from flask_sqlalchemy   import SQLAlchemy
from flask_cors         import CORS
from flask_jwt_extended import JWTManager
from flask_limiter      import Limiter
from flask_limiter.util import get_remote_address
from flask_bcrypt       import Bcrypt

from .config import Config

db      = SQLAlchemy()
jwt     = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
bcrypt  = Bcrypt()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Extensions ─────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    limiter.init_app(app)

    # ── JWT error handlers ─────────────────────────────────────
    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_data):
        return jsonify({"msg": "Session expired. Please log in again."}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({"msg": "Invalid token."}), 401

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({"msg": "Authentication required."}), 401

    # ── Rate-limit error handler ───────────────────────────────
    @app.errorhandler(429)
    def rate_limit_hit(e):
        return jsonify({"msg": "Too many requests. Please slow down."}), 429

    # ── Blueprints ─────────────────────────────────────────────
    from app.routes.auth         import auth_bp
    from app.routes.transactions import bp as transactions_bp
    from app.routes.budgets      import bp as budgets_bp
    from app.routes.dashboard    import bp as dashboard_bp
    from app.routes.admin        import bp as admin_bp

    # Per-route rate limits for OTP endpoints
    from app.routes.auth import send_otp, verify_otp
    limiter.limit("5 per minute")(send_otp)
    limiter.limit("10 per minute")(verify_otp)

    # Register both legacy and versioned routes. Duplicate blueprint registrations
    # must provide unique names in Flask.
    app.register_blueprint(auth_bp,         url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp,      url_prefix='/api/budgets')
    app.register_blueprint(dashboard_bp,    url_prefix='/api/dashboard')
    app.register_blueprint(admin_bp,        url_prefix='/api/admin')

    app.register_blueprint(auth_bp,         url_prefix='/api/v1/auth',         name='auth_v1')
    app.register_blueprint(transactions_bp, url_prefix='/api/v1/transactions', name='transactions_v1')
    app.register_blueprint(budgets_bp,      url_prefix='/api/v1/budgets',      name='budgets_v1')
    app.register_blueprint(dashboard_bp,    url_prefix='/api/v1/dashboard',    name='dashboard_v1')
    app.register_blueprint(admin_bp,        url_prefix='/api/v1/admin',        name='admin_v1')

    return app

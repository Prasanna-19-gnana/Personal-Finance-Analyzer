from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import User, Transaction

bp = Blueprint('admin', __name__)


def _require_admin(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, (jsonify({"msg": "User not found."}), 404)
    if user.role != 'admin':
        return None, (jsonify({"msg": "Admin access required."}), 403)
    return user, None


@bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = int(get_jwt_identity())
    _, err = _require_admin(user_id)
    if err:
        return err

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@bp.route('/transactions', methods=['GET'])
@jwt_required()
def list_all_transactions():
    user_id = int(get_jwt_identity())
    _, err = _require_admin(user_id)
    if err:
        return err

    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "user_id": t.user_id,
            "amount": t.amount,
            "type": t.type,
            "date": t.date.isoformat(),
            "description": t.description,
            "category": t.category.name if t.category else 'Uncategorized',
            "category_id": t.category_id,
        })

    return jsonify(result), 200

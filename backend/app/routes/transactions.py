from flask import Blueprint, request, jsonify
from app.models import Transaction, Category
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

bp = Blueprint('transactions', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).all()
    
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "date": t.date.isoformat(),
            "description": t.description,
            "category": t.category.name if t.category else 'Uncategorized',
            "category_id": t.category_id
        })
    return jsonify(result), 200

@bp.route('', methods=['POST'])
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    category_id = data.get('category_id')
    amount = data.get('amount')
    type = data.get('type')
    date_str = data.get('date')
    description = data.get('description', '')
    
    if not amount or not type or not category_id:
        return jsonify({"msg": "Missing required fields"}), 400
        
    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
    
    t = Transaction(
        user_id=user_id,
        category_id=category_id,
        amount=amount,
        type=type,
        date=date_obj,
        description=description
    )
    db.session.add(t)
    db.session.commit()
    
    return jsonify({"msg": "Transaction added", "id": t.id}), 201

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    t = Transaction.query.filter_by(id=id, user_id=user_id).first()
    if not t:
        return jsonify({"msg": "Transaction not found"}), 404
        
    db.session.delete(t)
    db.session.commit()
    return jsonify({"msg": "Transaction deleted"}), 200


@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = get_jwt_identity()
    t = Transaction.query.filter_by(id=id, user_id=user_id).first()
    if not t:
        return jsonify({"msg": "Transaction not found"}), 404

    data = request.get_json(silent=True) or {}

    if 'category_id' in data:
        t.category_id = data.get('category_id')
    if 'amount' in data:
        t.amount = data.get('amount')
    if 'type' in data:
        t.type = data.get('type')
    if 'description' in data:
        t.description = data.get('description', '')

    if 'date' in data and data.get('date'):
        try:
            t.date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"msg": "Invalid date format. Use YYYY-MM-DD."}), 400

    if not t.amount or not t.type or not t.category_id:
        return jsonify({"msg": "Missing required fields"}), 400

    db.session.commit()
    return jsonify({"msg": "Transaction updated"}), 200

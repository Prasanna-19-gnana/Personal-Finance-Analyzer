from flask import Blueprint, request, jsonify
from app.models import Budget, Category, Transaction
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime

bp = Blueprint('budgets', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    month_year = request.args.get('month_year') # Expected YYYY-MM
    
    if not month_year:
        return jsonify({"msg": "month_year is required"}), 400
        
    year, month = map(int, month_year.split('-'))
    start_date = datetime.date(year, month, 1)
    end_date = datetime.date(year + 1, 1, 1) if month == 12 else datetime.date(year, month + 1, 1)
        
    budgets = Budget.query.filter_by(user_id=user_id, month_year=month_year).all()
    # Calculate spending for each budget category
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.type == 'EXPENSE'
    ).all()
    
    spend_map = {}
    for t in transactions:
        spend_map[t.category_id] = spend_map.get(t.category_id, 0) + t.amount
        
    result = []
    
    # Also fetch all categories so frontend knows what can be budgeted
    categories = Category.query.all()
    
    for b in budgets:
        spent = spend_map.get(b.category_id, 0)
        result.append({
            "id": b.id,
            "category_id": b.category_id,
            "category_name": b.category.name,
            "amount": b.amount,
            "spent": spent,
            "month_year": b.month_year
        })
        
    cats_result = [{"id": c.id, "name": c.name, "type": c.type} for c in categories]
        
    return jsonify({"budgets": result, "categories": cats_result}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def set_budget():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    category_id = data.get('category_id')
    amount = data.get('amount')
    month_year = data.get('month_year') # YYYY-MM
    
    if not category_id or amount is None or not month_year:
        return jsonify({"msg": "Missing required fields"}), 400
        
    budget = Budget.query.filter_by(user_id=user_id, category_id=category_id, month_year=month_year).first()
    
    if budget:
        budget.amount = amount
    else:
        budget = Budget(user_id=user_id, category_id=category_id, amount=amount, month_year=month_year)
        db.session.add(budget)
        
    db.session.commit()
    return jsonify({"msg": "Budget saved effectively", "budget_id": budget.id}), 200

@bp.route('/category', methods=['POST'])
@jwt_required()
def add_custom_category():
    data = request.get_json()
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({"msg": "Category name is required"}), 400
        
    # Check if exists (case-insensitive approach or exact match)
    existing = Category.query.filter(Category.name.ilike(name)).first()
    if existing:
        return jsonify({"msg": "Category already exists", "category": {"id": existing.id, "name": existing.name, "type": existing.type}}), 200
        
    new_cat = Category(name=name, type='EXPENSE')
    db.session.add(new_cat)
    db.session.commit()
    
    return jsonify({"msg": "Category added", "category": {"id": new_cat.id, "name": new_cat.name, "type": new_cat.type}}), 201

@bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(category_id):
    user_id = get_jwt_identity()
    month_year = request.args.get('month_year')
    delete_type = request.args.get('type') # 'budget' or 'category'
    
    if not month_year:
        return jsonify({"msg": "month_year is required"}), 400
        
    budget = Budget.query.filter_by(user_id=user_id, category_id=category_id, month_year=month_year).first()
    
    if delete_type == 'category':
        # Delete budgets for this category and user across all months
        Budget.query.filter_by(user_id=user_id, category_id=category_id).delete()
        # Optionally delete from Transactions here if cascading delete isn't set
        from app.models import Transaction
        Transaction.query.filter_by(user_id=user_id, category_id=category_id).delete()
        # Then delete the category itself
        cat = Category.query.get(category_id)
        if cat:
            db.session.delete(cat)
        db.session.commit()
        return jsonify({"msg": "Category and associated data removed"}), 200

    else:
        # Just delete the budget limit for this specific month
        if budget:
            db.session.delete(budget)
            db.session.commit()
            return jsonify({"msg": "Budget deleted"}), 200
            
    return jsonify({"msg": "Entity not found"}), 404

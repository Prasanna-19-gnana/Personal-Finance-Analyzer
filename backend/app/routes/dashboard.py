from flask import Blueprint, jsonify, request
from app.models import Transaction, Budget, Category
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
import datetime
from app.services.ai_service import generate_financial_insights

bp = Blueprint('dashboard', __name__)

@bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    month_year = request.args.get('month_year') # Expected YYYY-MM
    
    if not month_year:
        now = datetime.datetime.now()
        month_year = f"{now.year}-{now.month:02d}"
        
    year, month = map(int, month_year.split('-'))
    
    # Calculate limits for the month
    start_date = datetime.date(year, month, 1)
    if month == 12:
        end_date = datetime.date(year + 1, 1, 1)
    else:
        end_date = datetime.date(year, month + 1, 1)
        
    # Get all transactions for the month
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'INCOME')
    total_expense = sum(t.amount for t in transactions if t.type == 'EXPENSE')
    
    category_totals = {}
    for t in transactions:
        if t.type == 'EXPENSE':
            cat_name = t.category.name if t.category else 'Uncategorized'
            category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount
            
    budgets = Budget.query.filter_by(user_id=user_id, month_year=month_year).all()
    budget_map = {b.category.name: b.amount for b in budgets}
            
    # Format category break down
    category_breakdown = [{"name": k, "value": v} for k, v in category_totals.items()]
    
    # Calculate overarching budget comparisons
    total_budgeted = sum(b.amount for b in budgets)
    
    # Compute budget overspending alerts
    alerts = []
    for cat_name, spent in category_totals.items():
        limit = budget_map.get(cat_name, 0)
        if limit > 0 and spent > limit:
            alerts.append({
                "category": cat_name,
                "limit": limit,
                "spent": spent,
                "over": spent - limit
            })
            
    # Compile a budget vs actual chart
    budget_vs_actual = []
    # get all unique categories between both
    all_cats = set(list(category_totals.keys()) + list(budget_map.keys()))
    for cat in sorted(list(all_cats)):
        budget_vs_actual.append({
            "category": cat,
            "budget": budget_map.get(cat, 0),
            "actual": category_totals.get(cat, 0)
        })
    
    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "total_budgeted": total_budgeted,
        "category_breakdown": category_breakdown,
        "budget_vs_actual": budget_vs_actual,
        "alerts": alerts,
        "month_year": month_year
    }), 200

@bp.route('/insights', methods=['POST'])
@jwt_required()
def get_insights():
    user_id = get_jwt_identity()
    data = request.get_json()
    month_year = data.get('month_year')
    if not month_year:
         now = datetime.datetime.now()
         month_year = f"{now.year}-{now.month:02d}"

    # Re-fetch or verify data for AI
    year, month = map(int, month_year.split('-'))
    start_date = datetime.date(year, month, 1)
    end_date = datetime.date(year + 1, 1, 1) if month == 12 else datetime.date(year, month + 1, 1)
    
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).all()

    budgets = Budget.query.filter_by(user_id=user_id, month_year=month_year).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'INCOME')
    total_expense = sum(t.amount for t in transactions if t.type == 'EXPENSE')
    
    category_spend = {}
    for t in transactions:
        if t.type == 'EXPENSE':
            name = t.category.name
            category_spend[name] = category_spend.get(name, 0) + t.amount

    budget_map = {b.category.name: b.amount for b in budgets}

    summary_data = {
        "income": total_income,
        "expense": total_expense,
        "category_spend": category_spend,
        "budgets": budget_map
    }

    try:
        insights = generate_financial_insights(summary_data)
        return jsonify({"insights": insights}), 200
    except Exception as e:
        return jsonify({"msg": "Failed to generate insights", "error": str(e)}), 500

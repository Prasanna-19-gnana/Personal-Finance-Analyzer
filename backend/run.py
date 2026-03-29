from app import create_app, db
from app.models import User, OTPRecord, Category, Transaction, Budget

app = create_app()

@app.cli.command("init-db")
def init_db():
    with app.app_context():
        db.create_all()
        default_categories = [
            {'name': 'Food & Dining', 'type': 'EXPENSE'},
            {'name': 'Housing/Rent', 'type': 'EXPENSE'},
            {'name': 'Transportation', 'type': 'EXPENSE'},
            {'name': 'Entertainment', 'type': 'EXPENSE'},
            {'name': 'Utilities', 'type': 'EXPENSE'},
            {'name': 'Salary', 'type': 'INCOME'},
            {'name': 'Investments', 'type': 'INCOME'},
            {'name': 'Other Income', 'type': 'INCOME'}
        ]
        for cat in default_categories:
            if not Category.query.filter_by(name=cat['name']).first():
                db.session.add(Category(name=cat['name'], type=cat['type']))
        db.session.commit()
        print("Database initialized and categories seeded!")

if __name__ == '__main__':
    app.run(debug=True, port=5001)

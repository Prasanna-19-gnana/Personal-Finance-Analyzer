import os
from openai import OpenAI

def generate_financial_insights(summary_data):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "AI insights are unavailable (API key not configured)."

    client = OpenAI(api_key=api_key)

    prompt = (
        f"You are a helpful, brief financial advisor. Analyze this month's data:\n"
        f"Total Income: ${summary_data.get('income', 0)}\n"
        f"Total Expenses: ${summary_data.get('expense', 0)}\n"
        f"Category Spending: {summary_data.get('category_spend', {})}\n"
        f"Category Budgets: {summary_data.get('budgets', {})}\n\n"
        f"Provide 2-3 short, actionable insights. Note any overspending compared to budgets. Keep it under 3 sentences."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a concise financial advisor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI error: {e}")
        return "Unable to generate insights at this time."

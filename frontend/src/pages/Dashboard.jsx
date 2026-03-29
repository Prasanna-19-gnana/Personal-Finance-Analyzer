import { useState, useEffect } from 'react';
import api from '../api/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, BrainCircuit, AlertTriangle, Target } from 'lucide-react';

const COLORS = ['#58a6ff', '#3fb950', '#bc8cff', '#f85149', '#e3b341', '#d29922', '#1f6feb'];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);

  useEffect(() => {
    fetchSummary();
  }, [selectedMonthYear]);

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/dashboard/summary?month_year=${selectedMonthYear}`);
      setSummary(res.data);
      fetchInsights(res.data.month_year);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  const fetchInsights = async (monthYear) => {
    setLoadingInsights(true);
    try {
      const res = await api.post('/dashboard/insights', { month_year: monthYear });
      setInsights(res.data.insights);
    } catch (e) {
      setInsights('AI Insights currently unavailable. Check your OpenAI configuration.');
    }
    setLoadingInsights(false);
  };

  if (!summary) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Financial Overview</h1>
        <input 
          type="month" 
          value={selectedMonthYear}
          onChange={(e) => setSelectedMonthYear(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
      </div>
      
      <div className="metric-grid">
        <div className="metric-card balance">
          <div className="metric-title">Net Balance</div>
          <div className="metric-value">
            ₹{(summary.total_income - summary.total_expense).toFixed(2)}
          </div>
          <IndianRupee size={24} style={{ position: 'absolute', top: 20, right: 20, color: 'var(--primary)', opacity: 0.5 }} />
        </div>
        <div className="metric-card income">
          <div className="metric-title">Total Income</div>
          <div className="metric-value">₹{summary.total_income.toFixed(2)}</div>
          <TrendingUp size={24} style={{ position: 'absolute', top: 20, right: 20, color: 'var(--success)', opacity: 0.5 }} />
        </div>
        <div className="metric-card expense">
          <div className="metric-title">Total Expenses</div>
          <div className="metric-value">₹{summary.total_expense.toFixed(2)}</div>
          <TrendingDown size={24} style={{ position: 'absolute', top: 20, right: 20, color: 'var(--danger)', opacity: 0.5 }} />
        </div>
        <div className="metric-card" style={{ borderTop: '4px solid var(--accent)' }}>
          <div className="metric-title">Total Budgeted</div>
          <div className="metric-value">₹{(summary.total_budgeted || 0).toFixed(2)}</div>
          <Target size={24} style={{ position: 'absolute', top: 20, right: 20, color: 'var(--accent)', opacity: 0.5 }} />
        </div>
      </div>

      {summary.alerts && summary.alerts.length > 0 && (
        <div style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
            <AlertTriangle size={20} /> Overspending Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {summary.alerts.map((alert, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <span><strong>{alert.category}</strong> limit exceeded!</span>
                <span style={{ color: 'var(--danger)', fontWeight: '600' }}>Over by ₹{alert.over.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ai-card">
        <h3><BrainCircuit /> AI Financial Insights</h3>
        {loadingInsights ? (
          <div className="ai-insight-text" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Analyzing your spending patterns...
          </div>
        ) : (
          <div className="ai-insight-text">
            {insights}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
          Expense Breakdown
        </h3>
        <div style={{ height: 300, width: '100%' }}>
          {summary.category_breakdown.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>No expenses recorded this month.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {summary.category_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RTip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {summary.budget_vs_actual && summary.budget_vs_actual.length > 0 && (
        <div className="metrics-section" style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <Target className="icon" size={24} style={{ color: 'var(--accent)' }} />
            <h3>Budget Utilization vs Actuals</h3>
          </div>
          <div style={{ height: '350px', width: '100%', background: 'var(--surface)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.budget_vs_actual}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="category" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} tickFormatter={(value) => `₹${value}`} axisLine={false} tickLine={false} />
                <RTip 
                  contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text)' }}
                  formatter={(value) => `₹${value.toFixed(2)}`}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="budget" name="Budget Limit" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="actual" name="Actual Spent" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import api from '../api/api';
import { Target, Plus } from 'lucide-react';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Modal state
  const [selectedCat, setSelectedCat] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    setCurrentMonth(monthStr);
    fetchBudgets(monthStr);
  }, []);

  const [deleteMode, setDeleteMode] = useState(''); // '' | 'budget' | 'category'

  const fetchBudgets = async (month) => {
    const res = await api.get(`/budgets?month_year=${month}`);
    setBudgets(res.data.budgets);
    const expenses = res.data.categories.filter(c => c.type === 'EXPENSE');
    setCategories(expenses);
  };

  const handleOpenCat = (cat) => {
    setSelectedCat(cat);
    const budget = budgets.find(b => b.category_id === cat.id);
    setEditAmount(budget ? budget.amount : '');
    setIsEditing(false);
    setDeleteMode('');
  };

  const closeModal = () => {
    setSelectedCat(null);
    setIsEditing(false);
    setEditAmount('');
    setDeleteMode('');
  };

  const handleSaveBudget = async () => {
    if (!selectedCat) return;
    setLoadingAction(true);
    try {
      await api.post('/budgets', {
        category_id: selectedCat.id,
        amount: parseFloat(editAmount) || 0,
        month_year: currentMonth
      });
      await fetchBudgets(currentMonth);
      closeModal();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteBudget = async (delType) => {
    if (!selectedCat) return;
    setLoadingAction(true);
    try {
      if (delType === 'budget') {
        // Just deleting the budget (sets to 0)
        await api.delete(`/budgets/${selectedCat.id}?month_year=${currentMonth}&type=budget`);
        // Instead of technically soft setting it to 0 on frontend, we deleted the record. Let's just re-fetch
      } else if (delType === 'category') {
        // Deleting the entire category
        await api.delete(`/budgets/${selectedCat.id}?month_year=${currentMonth}&type=category`);
      }
      await fetchBudgets(currentMonth);
      closeModal();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const resp = await api.post('/budgets/category', { name: newCatName });
      const newCatId = resp.data.category.id;

      if (newCatAmount) {
        await api.post('/budgets', {
          category_id: newCatId,
          amount: parseFloat(newCatAmount) || 0,
          month_year: currentMonth
        });
      }

      setNewCatName('');
      setNewCatAmount('');
      await fetchBudgets(currentMonth);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCat(false);
    }
  };

  return (
    <div>
      <h1 className="page-title"><Target className="inline-block mr-2" /> Monthly Budgets</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Set your budget limits for {currentMonth} to get accurate AI insights on your overspending.</p>
      
      <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Custom Expense Category
        </h3>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Category Name (e.g. Gifts)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            style={{ flex: 2, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
          <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Budget Limit"
              value={newCatAmount}
              onChange={(e) => setNewCatAmount(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', paddingLeft: '30px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={addingCat || !newCatName.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {addingCat ? 'Saving...' : 'Add & Set Budget'}
          </button>
        </form>
      </div>

      <div className="metric-grid">
        {categories.map(cat => {
          const budget = budgets.find(b => b.category_id === cat.id);
          const limit = budget ? budget.amount : 0;
          const spent = budget ? budget.spent : 0;
          
          return (
            <div 
              key={cat.id} 
              className={`metric-card ${spent > limit && limit > 0 ? 'expense' : ''}`}
              style={{ 
                display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem',
                border: spent > limit && limit > 0 ? '1px solid var(--danger)' : undefined
              }}
              onClick={() => handleOpenCat(cat)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{cat.name}</strong>
                <span className="badge" style={{ 
                  fontSize: '1rem', 
                  background: spent > limit && limit > 0 ? 'rgba(248, 81, 73, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: spent > limit && limit > 0 ? 'var(--danger)' : '#fff'
                }}>
                  Limit: ₹{limit.toFixed(2)}
                </span>
              </div>

              {budget ? (
                <>
                  <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min(100, Math.max(0, (spent / limit) * 100))}%`,
                      background: spent > limit ? 'var(--danger)' : 'var(--primary)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Spent: ₹{spent.toFixed(2)}</span>
                    {spent > limit ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Over by ₹{(spent - limit).toFixed(2)}!</span>
                    ) : (
                      <span>Remaining: ₹{(limit - spent).toFixed(2)}</span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No budget limit set.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for viewing/editing/deleting a category budget */}
      {selectedCat && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{selectedCat.name} Budget</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              {!isEditing ? (
                <>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem' }}>Current Limit:</span>
                      <span className="badge" style={{ fontSize: '1.1rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                        ₹{budgets.find(b => b.category_id === selectedCat.id)?.amount.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    {budgets.find(b => b.category_id === selectedCat.id) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem' }}>Total Spent:</span>
                        <span style={{ 
                          fontSize: '1.1rem', fontWeight: 600,
                          color: (budgets.find(b => b.category_id === selectedCat.id)?.spent || 0) > budgets.find(b => b.category_id === selectedCat.id)?.amount ? 'var(--danger)' : 'var(--text-main)'
                        }}>
                          ₹{(budgets.find(b => b.category_id === selectedCat.id)?.spent || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {deleteMode === '' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>Edit Limit</button>
                      <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setDeleteMode('select')} disabled={loadingAction}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>What would you like to delete?</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button 
                          className="btn" 
                          style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} 
                          onClick={() => handleDeleteBudget('budget')}
                          disabled={loadingAction}
                        >
                          Clear Budget to ₹0
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeleteBudget('category')}
                          disabled={loadingAction}
                        >
                          Delete Entire Category
                        </button>
                        <button 
                          className="btn" 
                          style={{ background: 'transparent', color: 'var(--text-muted)', marginTop: '0.5rem' }} 
                          onClick={() => setDeleteMode('')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Set New Budget Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>₹</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0.00"
                      style={{ flex: 1, color: '#ffffff', background: 'transparent', border: 'none', outline: 'none', fontSize: '1.1rem' }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveBudget} disabled={loadingAction}>
                      {loadingAction ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)} disabled={loadingAction}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;

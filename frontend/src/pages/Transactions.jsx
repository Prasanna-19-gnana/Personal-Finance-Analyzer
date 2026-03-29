import { useState, useEffect } from 'react';
import api from '../api/api';
import { Plus, Trash2 } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'EXPENSE', amount: '', category_id: '', date: '', description: '' });

  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('');

  const filteredTransactions = transactions.filter(t => {
    let matchMonth = true;
    let matchType = true;
    if (filterMonth) matchMonth = t.date.startsWith(filterMonth);
    if (filterType) matchType = t.type === filterType;
    return matchMonth && matchType;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resT = await api.get('/transactions');
    setTransactions(resT.data);
    
    // We can also fetch budgets with a dummy month_year to get all categories for the MVP
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const resB = await api.get(`/budgets?month_year=${currentMonth}`);
    setCategories(resB.data.categories);
    
    if (resB.data.categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: resB.data.categories.find(c => c.type === 'EXPENSE')?.id || resB.data.categories[0].id }));
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    fetchData();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/transactions', formData);
    setShowModal(false);
    setFormData({ ...formData, amount: '', description: '', date: '' });
    fetchData();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Transactions</h1>
        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Month:</label>
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
          >
            <option value="">All</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>
        {(filterMonth || filterType) && (
          <button 
            className="btn btn-sm" 
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={() => { setFilterMonth(''); setFilterType(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
            ) : null}
            {filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.description || '-'}</td>
                <td>{t.category}</td>
                <td>
                  <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
                </td>
                <td style={{ fontWeight: 600 }}>₹{t.amount.toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>New Transaction</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => {
                    const type = e.target.value;
                    const defaultCat = categories.find(c => c.type === type)?.id || '';
                    setFormData({...formData, type, category_id: defaultCat});
                  }}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={formData.category_id} 
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  required
                >
                  {categories.filter(c => c.type === formData.type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Date (Optional)</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

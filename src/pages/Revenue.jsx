import React, { useState, useEffect, useMemo } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const Revenue = () => {
  const { users } = useAuth();
  const [deals, setDeals] = useState([]);
  
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [agentId, setAgentId] = useState('');
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await api.get('/deals');
      setDeals(res.data.filter(d => !d.isDeleted));
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (users.length > 0 && !agentId) {
      setAgentId(users[0].id);
    }
  }, [users, agentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    const newDeal = {
      title: `HĐ: ${customerName}`,
      company: customerName,
      value: Number(amount),
      agentId,
      stageId: 'stage-6', // Tự động ghi nhận là chốt hợp đồng
      tags: [],
      isManual: true,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await api.post('/deals', newDeal);
      setDeals(prev => [...prev, res.data]);
      
      const empName = users.find(u => u.id === agentId)?.name || 'Nhân viên';
      await api.post('/notifications', {
        type: 'REVENUE',
        message: `🎉 Chúc mừng! ${empName} vừa chốt thành công hợp đồng ${new Intl.NumberFormat('vi-VN').format(Number(amount))} VND từ ${customerName}!`,
        timestamp: new Date().toISOString(),
        isRead: false
      });
      window.dispatchEvent(new Event('new_notification'));

      alert("Đã lưu giao dịch và cộng KPI cho nhân viên!");
      setCustomerName('');
      setAmount('');
    } catch(err) { 
      console.error(err);
      alert("Lỗi khi lưu doanh thu.");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc muốn xóa doanh thu này? (Thao tác này sẽ trừ KPI của nhân viên tương ứng)")) return;
    try {
      await api.delete(`/deals/${id}`);
      setDeals(prev => prev.filter(d => d.id !== id));
    } catch(err) {
      console.error(err);
      alert("Không thể xóa doanh thu");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  
  const formatInputCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(Number(num));
  };

  const manualDeals = useMemo(() => {
    return deals.filter(d => d.stageId === 'stage-6' && d.isManual).filter(d => {
      const date = new Date(d.createdAt || Date.now());
      if (date.getFullYear() !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && date.getMonth() !== Number(selectedMonth)) return false;
      if (selectedQuarter !== 'ALL' && Math.floor(date.getMonth() / 3) !== Number(selectedQuarter)) return false;
      return true;
    }).reverse();
  }, [deals, selectedYear, selectedMonth, selectedQuarter]);

  return (
    <div className="revenue-page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#172b4d', margin: 0 }}>Ghi Nhận Doanh Số & Hợp Đồng</h1>
        <p className="subtitle" style={{ color: '#6b778c', margin: '4px 0 0', fontSize: '14px' }}>Thêm giao dịch mua hàng, doanh thu sẽ tự động cộng dồn vào tiến độ KPI của nhân viên.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid #36b37e', boxShadow: '0 8px 30px rgba(54, 179, 126, 0.15)', background: 'var(--bg-card, #fff)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-primary, #172b4d)' }}>Thêm Giao Dịch Mới</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary, #172b4d)', display: 'block', marginBottom: 8 }}>Tên Khách Hàng / Công Ty</label>
              <input 
                type="text" 
                className="form-control" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required 
                style={{ padding: '12px', fontSize: '15px', width: '100%', borderRadius: 8, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #172b4d)' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary, #172b4d)', display: 'block', marginBottom: 8 }}>Giá trị hợp đồng (VNĐ)</label>
              <input 
                type="text" 
                className="form-control" 
                value={formatInputCurrency(amount)}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw ? Number(raw) : '');
                }}
                required 
                style={{ padding: '12px', fontSize: '18px', color: '#0052cc', fontWeight: 'bold', width: '100%', borderRadius: 8, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)' }} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary, #172b4d)', display: 'block', marginBottom: 8 }}>Nhân viên chốt đơn</label>
              <select className="form-control" value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '12px', fontSize: '15px', width: '100%', borderRadius: 8, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #172b4d)' }}>
                {users.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', background: 'linear-gradient(135deg, #36b37e 0%, #00875a 100%)', color: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Check size={20} /> XÁC NHẬN LƯU DOANH THU
            </button>
          </form>
        </div>

        {/* Lịch sử */}
        <div className="glass-card" style={{ padding: '2rem', background: 'var(--bg-card, #fff)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary, #172b4d)' }}>Lịch Sử Ghi Nhận Gần Đây</h3>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-control" style={{ width: 110, padding: '6px 10px', borderRadius: 6, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #172b4d)' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {Array.from({length: 11}, (_, i) => 2020 + i).map(y => <option key={y} value={y}>Năm {y}</option>)}
              </select>
              
              <select className="form-control" style={{ width: 110, padding: '6px 10px', borderRadius: 6, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #172b4d)' }} value={selectedQuarter} onChange={e => { setSelectedQuarter(e.target.value); setSelectedMonth('ALL'); }}>
                <option value="ALL">Tất cả Quý</option>
                {[0,1,2,3].map(q => <option key={q} value={q}>Quý {q+1}</option>)}
              </select>
              
              <select className="form-control" style={{ width: 110, padding: '6px 10px', borderRadius: 6, border: '1px solid #dfe1e6', background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #172b4d)' }} value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedQuarter('ALL'); }}>
                <option value="ALL">Tất cả Tháng</option>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover, #f4f5f7)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary, #6b778c)' }}>Thời gian</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary, #6b778c)' }}>Khách hàng</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary, #6b778c)' }}>Nhân viên thực hiện</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #6b778c)' }}>Doanh thu</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #6b778c)', width: 60 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {manualDeals.map(deal => {
                  const emp = users.find(e => e.id === deal.agentId);
                  const dateStr = new Date(deal.createdAt || Date.now()).toLocaleDateString('vi-VN');
                  return (
                    <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-color, #dfe1e6)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-secondary, #6b778c)' }}>{dateStr}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary, #172b4d)' }}>{deal.company}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#e6fcff', color: '#00b8d9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{emp ? emp.name : 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#36b37e', fontWeight: 700, fontSize: '16px', textAlign: 'right' }}>{formatCurrency(deal.value)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => handleDelete(deal.id)} style={{ background: 'transparent', border: 'none', color: '#ff5630', cursor: 'pointer', padding: 6, borderRadius: 4 }} title="Xóa doanh thu này">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {manualDeals.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary, #8c98a9)' }}>Không có giao dịch thủ công nào trong kỳ này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;

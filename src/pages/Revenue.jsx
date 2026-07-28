import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { api } from '../api';

const Revenue = () => {
  const { users } = useAuth();
  
  const [deals, setDeals] = useState(() => {
    const saved = localStorage.getItem('dealsData');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    if (users.length > 0 && !agentId) {
      setAgentId(users[0].id);
    }
  }, [users, agentId]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    const newDeal = {
      id: `DEAL_MANUAL_${Date.now()}`,
      title: `HĐ: ${customerName}`,
      company: customerName,
      value: Number(amount),
      agentId,
      stageId: 'stage-6', // Tự động ghi nhận là chốt hợp đồng
      tags: []
    };

    const updated = [...deals, newDeal];
    setDeals(updated);
    localStorage.setItem('dealsData', JSON.stringify(updated));
    window.dispatchEvent(new Event('deals_updated')); // Kích hoạt Dashboard

    // Tạo Notification
    try {
      const empName = users.find(u => u.id === agentId)?.name || 'Nhân viên';
      await api.post('/notifications', {
        id: `NOTIF_${Date.now()}`,
        type: 'REVENUE',
        message: `🎉 Chúc mừng! ${empName} vừa chốt thành công hợp đồng ${new Intl.NumberFormat('vi-VN').format(Number(amount))} VND từ ${customerName}!`,
        timestamp: new Date().toISOString(),
        isRead: false
      });
      window.dispatchEvent(new Event('new_notification'));
    } catch(err) { console.error(err) }

    alert("Đã lưu giao dịch và cộng KPI cho nhân viên!");
    setCustomerName('');
    setAmount('');
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  
  const formatInputCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(Number(num));
  };

  return (
    <div className="revenue-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Ghi Nhận Doanh Số & Hợp Đồng</h1>
        <p className="subtitle">Thêm giao dịch mua hàng, doanh thu sẽ tự động cộng dồn vào tiến độ KPI của nhân viên.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid #36b37e', boxShadow: '0 8px 30px rgba(54, 179, 126, 0.15)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#172b4d' }}>Thêm Giao Dịch Mới</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Tên Khách Hàng / Công Ty</label>
              <input 
                type="text" 
                className="form-control" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required 
                style={{ padding: '12px', fontSize: '15px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Giá trị hợp đồng (VNĐ)</label>
              <input 
                type="text" 
                className="form-control" 
                value={formatInputCurrency(amount)}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw ? Number(raw) : '');
                }}
                required 
                style={{ padding: '12px', fontSize: '18px', color: '#0052cc', fontWeight: 'bold' }} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Nhân viên chốt đơn</label>
              <select className="form-control" value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '12px', fontSize: '15px' }}>
                {users.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', background: 'linear-gradient(135deg, #36b37e 0%, #00875a 100%)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)' }}>
              <Check size={20} /> XÁC NHẬN LƯU DOANH THU
            </button>
          </form>
        </div>

        {/* Lịch sử */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#172b4d' }}>Lịch Sử Ghi Nhận Gần Đây</h3>
          <div className="table-responsive">
            <table className="crm-table">
              <thead>
                <tr style={{ background: '#f4f5f7' }}>
                  <th style={{ padding: '12px' }}>Thời gian</th>
                  <th style={{ padding: '12px' }}>Khách hàng</th>
                  <th style={{ padding: '12px' }}>Nhân viên thực hiện</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {deals.filter(d => d.stageId === 'stage-6' && d.id.includes('DEAL_MANUAL_')).reverse().map(deal => {
                  const emp = users.find(e => e.id === deal.agentId);
                  return (
                    <tr key={deal.id} style={{ borderBottom: '1px solid #dfe1e6' }}>
                      <td style={{ padding: '12px', color: '#6b778c' }}>{new Date().toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#172b4d' }}>{deal.company}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#e6fcff', color: '#00b8d9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{emp ? emp.name : 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#36b37e', fontWeight: 700, fontSize: '16px', textAlign: 'right' }}>{formatCurrency(deal.value)}</td>
                    </tr>
                  );
                })}
                {deals.filter(d => d.stageId === 'stage-6' && d.id.includes('DEAL_MANUAL_')).length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#8c98a9' }}>Chưa có giao dịch thủ công nào được ghi nhận.</td>
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

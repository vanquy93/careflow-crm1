import React from 'react';
import { useCRM } from '../context/CRMContext';
import './Employees.css';

const Employees = () => {
  const { employees } = useCRM();

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>KPI & Hiệu Suất Nhân Viên</h1>
        <p className="subtitle">Bảng theo dõi mục tiêu doanh thu, số ca hỗ trợ và điểm đánh giá của từng nhân viên.</p>
      </div>

      <div className="agent-grid">
        {employees.map(emp => {
          const progress = Math.min((emp.kpi.currentRevenue / emp.kpi.targetRevenue) * 100, 100);
          return (
            <div key={emp.id} className="glass-card agent-card">
              <div className="agent-header">
                <img src={emp.avatar} alt={emp.name} className="agent-avatar" />
                <div>
                  <h3 className="agent-name">{emp.name}</h3>
                  <span className="agent-title">{emp.title}</span>
                </div>
              </div>
              <div className="agent-stats">
                <div className="stat-item">
                  <span>CSAT</span>
                  <strong>{emp.kpi.csat} ⭐</strong>
                </div>
                <div className="stat-item">
                  <span>Task hoàn thành</span>
                  <strong>{emp.kpi.tasksCompleted}/{emp.kpi.tasksTotal}</strong>
                </div>
              </div>
              <div className="progress-section">
                <div className="progress-labels">
                  <span>Doanh thu</span>
                  <span>{formatCurrency(emp.kpi.currentRevenue)} / {formatCurrency(emp.kpi.targetRevenue)}</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%`, backgroundColor: progress >= 100 ? 'var(--success-color)' : 'var(--accent-color)' }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card leaderboard-card">
        <h3>Bảng Xếp Hạng Doanh Số Tháng Này</h3>
        <div className="table-responsive">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Hạng</th>
                <th>Nhân viên</th>
                <th>Chỉ tiêu</th>
                <th>Doanh thu Đạt được</th>
                <th>Đánh giá CSAT</th>
                <th>Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {[...employees].sort((a, b) => b.kpi.currentRevenue - a.kpi.currentRevenue).map((emp, index) => {
                const progress = ((emp.kpi.currentRevenue / emp.kpi.targetRevenue) * 100).toFixed(1);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className={`rank-badge rank-${index + 1}`}>{index + 1}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={emp.avatar} alt={emp.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        <span style={{ fontWeight: 500 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(emp.kpi.targetRevenue)}</td>
                    <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>{formatCurrency(emp.kpi.currentRevenue)}</td>
                    <td>{emp.kpi.csat} ⭐</td>
                    <td>
                      <div className="mini-progress">
                        <div className="mini-progress-bar">
                          <div className="mini-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employees;

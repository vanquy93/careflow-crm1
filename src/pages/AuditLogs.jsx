import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, ShieldAlert } from 'lucide-react';
import './ListPage.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/auditLogs');
        setLogs(res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={20} color="var(--danger)" /> Nhật Ký Hệ Thống (Audit Logs)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Theo dõi mọi thay đổi dữ liệu trên hệ thống CRM 24/7</p>
        </div>
        <div className="search-box-list">
          <Search size={14} />
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng, thao tác..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table crm-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thực hiện</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: 12 }}>{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                <td className="fw-600 color-blue">{log.user} <span className="badge badge-success" style={{ marginLeft: 6 }}>{log.role}</span></td>
                <td><span className={`badge ${log.action === 'DELETE' ? 'badge-danger' : log.action === 'CREATE' ? 'badge-success' : 'badge-warning'}`}>{log.action}</span></td>
                <td>{log.entity} <small className="text-muted">({log.entityId})</small></td>
                <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.details}>{log.details}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Không có dữ liệu Log</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import './ListPage.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={20} color="var(--danger)" /> Nhật Ký Hệ Thống (Audit Logs)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Theo dõi mọi thay đổi dữ liệu trên hệ thống CRM 24/7</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange} 
            className="form-control" 
            style={{ width: '120px', padding: '6px 12px', fontSize: 13 }}
          >
            <option value={25}>25 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <div className="search-box-list">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng, thao tác..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>
      
      <div className="table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
              {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
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
        
        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-white)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Hiển thị {filteredLogs.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong số {filteredLogs.length} dòng
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="btn-outline" 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button 
              className="btn-outline" 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              style={{ padding: '4px 8px' }}
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

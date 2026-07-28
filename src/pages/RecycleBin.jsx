import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trash2, RefreshCcw, CheckSquare, XSquare } from 'lucide-react';
import { logAction } from '../utils/audit';
import { useAuth } from '../context/AuthContext';
import './ListPage.css';

const RecycleBin = () => {
  const { currentUser } = useAuth();
  const [deletedItems, setDeletedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    try {
      const [dealsRes, custRes, contRes] = await Promise.all([
        api.get('/deals?isDeleted=true'),
        api.get('/customers?isDeleted=true'),
        api.get('/contacts?isDeleted=true')
      ]);
      
      const allItems = [
        ...dealsRes.data.map(d => ({ ...d, type: 'DEAL' })),
        ...custRes.data.map(c => ({ ...c, type: 'CUSTOMER' })),
        ...contRes.data.map(c => ({ ...c, type: 'CONTACT' }))
      ];
      
      // Sắp xếp theo ngày xóa mới nhất
      allItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
      setDeletedItems(allItems);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (item) => {
    try {
      const endpoint = item.type === 'DEAL' ? '/deals' : item.type === 'CUSTOMER' ? '/customers' : '/contacts';
      await api.patch(`${endpoint}/${item.id}`, { isDeleted: false, deletedAt: null, deletedBy: null });
      await logAction(currentUser, 'RESTORE', item.type, item.id, `Đã khôi phục ${item.title || item.name}`);
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
      setSelectedItems(prev => prev.filter(id => id !== item.id));
      alert("Đã khôi phục thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi khôi phục dữ liệu.");
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedItems.length === deletedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(deletedItems.map(item => item.id));
    }
  };

  const handleToggleItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn khôi phục ${selectedItems.length} mục đã chọn?`)) return;
    
    try {
      const itemsToRestore = deletedItems.filter(item => selectedItems.includes(item.id));
      const promises = itemsToRestore.map(item => {
        const endpoint = item.type === 'DEAL' ? '/deals' : item.type === 'CUSTOMER' ? '/customers' : '/contacts';
        return api.patch(`${endpoint}/${item.id}`, { isDeleted: false, deletedAt: null, deletedBy: null });
      });
      await Promise.all(promises);
      
      setDeletedItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      alert(`Đã khôi phục thành công ${itemsToRestore.length} mục!`);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi khôi phục hàng loạt.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`CẢNH BÁO: Việc xóa vĩnh viễn ${selectedItems.length} mục sẽ không thể khôi phục. Bạn có chắc chắn?`)) return;
    
    try {
      const itemsToDelete = deletedItems.filter(item => selectedItems.includes(item.id));
      const promises = itemsToDelete.map(item => {
        const endpoint = item.type === 'DEAL' ? '/deals' : item.type === 'CUSTOMER' ? '/customers' : '/contacts';
        return api.delete(`${endpoint}/${item.id}`);
      });
      await Promise.all(promises);
      
      setDeletedItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      alert(`Đã xóa vĩnh viễn ${itemsToDelete.length} mục!`);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xóa hàng loạt.");
    }
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={20} color="var(--text-muted)" /> Thùng Rác (Recycle Bin)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Chứa các dữ liệu bị xóa. Bạn có thể khôi phục lại chúng.</p>
        </div>
      </div>
      
      <div className="table-container">
        {selectedItems.length > 0 && (
          <div style={{ padding: '12px 16px', background: '#e6fcff', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#006644', fontSize: '14px' }}>Đã chọn {selectedItems.length} mục</span>
            <button className="btn-primary" onClick={handleBulkRestore} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#36b37e', border: 'none' }}>
              <CheckSquare size={14} /> Khôi phục tất cả
            </button>
            <button className="btn-outline" onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', color: '#ff5630', borderColor: '#ff5630' }}>
              <XSquare size={14} /> Xóa vĩnh viễn
            </button>
          </div>
        )}
        <table className="data-table crm-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={deletedItems.length > 0 && selectedItems.length === deletedItems.length} 
                  onChange={handleToggleSelectAll} 
                />
              </th>
              <th>Loại dữ liệu</th>
              <th>Tên / Tiêu đề</th>
              <th>Ngày xóa</th>
              <th>Người xóa</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {deletedItems.length > 0 ? deletedItems.map(item => (
              <tr key={item.id} className={selectedItems.includes(item.id) ? 'selected-row' : ''}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)} 
                    onChange={() => handleToggleItem(item.id)} 
                  />
                </td>
                <td><span className="badge badge-warning">{item.type}</span></td>
                <td className="fw-600 color-blue">{item.title || item.name}</td>
                <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : 'Unknown'}</td>
                <td>{item.deletedBy || 'Unknown'}</td>
                <td className="text-right">
                  <button className="btn-primary" onClick={() => handleRestore(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#10b981', padding: '6px 12px', float: 'right' }}>
                    <RefreshCcw size={14} /> Khôi phục
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Thùng rác trống</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecycleBin;

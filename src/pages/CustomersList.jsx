import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { logAction } from '../utils/audit';
import './ListPage.css';
import './Modal.css';

const CustomersList = () => {
  const { users, currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'Doanh nghiệp vừa và nhỏ', industry: '', ownerId: users[0]?.id || '', projectId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        let data = response.data.filter(c => !c.isDeleted);
        if (currentUser.role === 'Sale') {
          data = data.filter(c => c.ownerId === currentUser.id);
        }
        setCustomers(data);
        const prjResponse = await api.get('/projects');
        setProjects(prjResponse.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({ code: '', name: '', type: 'Doanh nghiệp vừa và nhỏ', industry: '', ownerId: currentUser.role === 'Sale' ? currentUser.id : (users[0]?.id || ''), projectId: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        setCustomers(customers.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
        await logAction(currentUser, 'UPDATE', 'CUSTOMER', editingId, `Cập nhật khách hàng: ${formData.name}`);
        window.dispatchEvent(new CustomEvent('show_toast', {
          detail: { type: 'success', message: 'Cập nhật khách hàng thành công!' }
        }));
      } else {
        const newCustomer = { ...formData, id: `CUST_${Date.now()}` };
        await api.post('/customers', newCustomer);
        setCustomers([...customers, newCustomer]);
        await logAction(currentUser, 'CREATE', 'CUSTOMER', newCustomer.id, `Tạo khách hàng mới: ${newCustomer.name}`);
        window.dispatchEvent(new CustomEvent('show_toast', {
          detail: { type: 'success', message: 'Tạo khách hàng thành công!' }
        }));
      }
      setShowModal(false);
    } catch(e) { 
      console.error(e); 
      window.dispatchEvent(new CustomEvent('show_toast', {
        detail: { type: 'error', message: 'Đã xảy ra lỗi khi lưu!' }
      }));
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa khách hàng này? (Có thể khôi phục trong Thùng rác)')) {
      try {
        const custToDelete = customers.find(c => c.id === id);
        await api.patch(`/customers/${id}`, { 
          isDeleted: true, 
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.name 
        });
        setCustomers(customers.filter(c => c.id !== id));
        await logAction(currentUser, 'DELETE', 'CUSTOMER', id, `Xóa tạm khách hàng: ${custToDelete.name}`, true);
        window.dispatchEvent(new CustomEvent('show_toast', {
          detail: { type: 'success', message: 'Đã xóa khách hàng vào thùng rác!' }
        }));
      } catch(e) { 
        console.error(e); 
        window.dispatchEvent(new CustomEvent('show_toast', {
          detail: { type: 'error', message: 'Xóa thất bại!' }
        }));
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Mã KH', 'Tên Khách Hàng', 'Phân loại', 'Ngành nghề', 'Người quản lý'];
    const rows = filteredCustomers.map(c => {
      const ownerName = users.find(u => u.id === c.ownerId)?.name || 'Chưa rõ';
      return [c.code, c.name, c.type, c.industry, ownerName];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    // Add BOM for UTF-8 Excel support
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'DanhSach_KhachHang.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      encoding: 'utf-8',
      complete: async (results) => {
        const lines = results.data;
        if (lines.length <= 1) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        let importedCount = 0;
        const isHeader = lines[0][0] === 'Mã KH';
        const startIndex = isHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const row = lines[i];
          if (row.length >= 2) {
            const newCustomer = {
              id: `CUST_${Date.now()}_${i}`,
              code: row[0]?.trim() || `KH_${Date.now()}_${i}`,
              name: row[1]?.trim() || 'Khách hàng mới',
              type: row[2]?.trim() || 'Doanh nghiệp vừa và nhỏ',
              industry: row[3]?.trim() || '',
              ownerId: currentUser.id
            };
            try {
              await api.post('/customers', newCustomer);
              importedCount++;
            } catch(err) { console.error(err) }
          }
        }
        
        alert(`Đã nhập thành công ${importedCount} khách hàng!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        window.location.reload();
      },
      error: (error) => {
        console.error("Lỗi khi đọc file CSV:", error);
        alert("Có lỗi xảy ra khi đọc file!");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Quản lý Khách hàng Doanh nghiệp</h2>
        <div className="list-actions">
          <div className="search-box-list">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm công ty..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
          />
          <button className="btn-outline" onClick={() => fileInputRef.current.click()}><Upload size={14}/> Nhập CSV</button>
          <button className="btn-outline" onClick={handleExportCSV}><Download size={14}/> Xuất CSV</button>
          <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={14}/> Khách hàng mới</button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Tên Khách Hàng / Công ty</th>
              <th>Dự án liên kết</th>
              <th>Phân loại</th>
              <th>Ngành nghề</th>
              <th>Người quản lý</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? filteredCustomers.map(c => {
              const ownerName = users.find(u => u.id === c.ownerId)?.name || 'Chưa rõ';
              const projectName = projects.find(p => p.id === c.projectId)?.name || '-';
              return (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td className="fw-600 color-blue">{c.name}</td>
                  <td>{projectName}</td>
                  <td>
                    <span className={`badge ${c.type === 'Khách hàng cá nhân' ? 'badge-info' : ''}`}>
                      {c.type}
                    </span>
                  </td>
                  <td>{c.industry}</td>
                  <td>{ownerName}</td>
                  <td className="text-right" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-icon text-muted" onClick={() => handleOpenModal(c)}><Edit size={16}/></button>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(c.id)}><Trash2 size={16}/></button>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mã Khách Hàng</label>
                  <input type="text" className="form-control" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Tên Khách hàng / Công ty</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Phân loại</label>
                  <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Khách hàng cá nhân">Khách hàng cá nhân (B2C)</option>
                    <option value="Doanh nghiệp lớn">Doanh nghiệp lớn</option>
                    <option value="Doanh nghiệp vừa và nhỏ">Doanh nghiệp vừa và nhỏ</option>
                    <option value="Tập đoàn">Tập đoàn</option>
                    <option value="Doanh nghiệp nhà nước">Doanh nghiệp nhà nước</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ngành nghề</label>
                  <input type="text" className="form-control" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Người quản lý (Account Manager)</label>
                <select className="form-control" value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} disabled={currentUser.role === 'Sale'}>
                  {users.filter(u => u.role === 'Sale' || u.role === 'Manager').map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Dự án liên kết</label>
                <select className="form-control" value={formData.projectId || ''} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                  <option value="">-- Không thuộc dự án nào --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;

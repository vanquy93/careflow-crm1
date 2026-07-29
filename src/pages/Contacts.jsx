import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, X, Phone, Mail, Building, Briefcase, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '../api';
import { logAction } from '../utils/audit';
import { useAuth } from '../context/AuthContext';
import './ListPage.css';
import './Modal.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        let contactsData = response.data.filter(c => !c.isDeleted);
        if (currentUser.role === 'Sale') {
          contactsData = contactsData.filter(c => c.ownerId === currentUser.id);
        }
        setContacts(contactsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
    api.get('/customers').then(res => {
      let custData = res.data;
      if (currentUser.role === 'Sale') {
        custData = custData.filter(c => c.ownerId === currentUser.id);
      }
      setCustomersData(custData);
    }).catch(console.error);
  }, []);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', company: '', position: '', customerType: 'Doanh nghiệp' });
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef(null);

  const handleOpenModal = (contact = null) => {
    if (contact) {
      setEditingId(contact.id);
      setFormData(contact);
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', company: '', position: '', ownerId: currentUser.id, customerType: 'Doanh nghiệp' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/contacts/${editingId}`, formData);
        setContacts(contacts.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
        await logAction(currentUser, 'UPDATE', 'CONTACT', editingId, `Cập nhật liên hệ: ${formData.name}`);
      } else {
        const newContact = { ...formData, id: `CONT_${Date.now()}` };
        await api.post('/contacts', newContact);
        setContacts([...contacts, newContact]);
        await logAction(currentUser, 'CREATE', 'CONTACT', newContact.id, `Thêm liên hệ: ${newContact.name}`);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu Liên hệ');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) {
      try {
        const contactToDelete = contacts.find(c => c.id === id);
        await api.patch(`/contacts/${id}`, { isDeleted: true });
        setContacts(contacts.filter(c => c.id !== id));
        await logAction(currentUser, 'DELETE', 'CONTACT', id, `Xóa liên hệ: ${contactToDelete?.name}`);
      } catch (err) {
        console.error(err);
        alert('Lỗi xóa Liên hệ');
      }
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleExportCSV = () => {
    const headers = ['Họ và Tên', 'Số điện thoại', 'Email', 'Công ty', 'Chức vụ'];
    const rows = filteredContacts.map(c => [c.name, c.phone, c.email, c.company, c.position]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'DanhSach_LienHe.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        const lines = results.data;
        if (lines.length <= 1) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        let importedCount = 0;
        const isHeader = lines[0][0] === 'Họ và Tên';
        const startIndex = isHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const row = lines[i];
          if (row.length >= 3) { // At least Name, Phone, Email
            const newContact = {
              id: `CONT_${Date.now()}_${i}`,
              name: row[0]?.trim() || 'No Name',
              phone: row[1]?.trim() || '',
              email: row[2]?.trim() || '',
              company: row[3]?.trim() || '',
              position: row[4]?.trim() || '',
              customerType: row[5]?.trim() || 'Doanh nghiệp',
              ownerId: currentUser.id
            };
            try {
              await api.post('/contacts', newContact);
              importedCount++;
            } catch(err) { console.error(err) }
          }
        }
        
        alert(`Đã nhập thành công ${importedCount} liên hệ!`);
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
        <h2>Danh bạ Liên hệ</h2>
        <div className="list-actions">
          <div className="search-box-list">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm liên hệ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={14}/> Thêm liên hệ</button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ và Tên</th>
              <th>Loại KH</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Công ty</th>
              <th>Chức vụ</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length > 0 ? filteredContacts.map(contact => (
              <tr key={contact.id}>
                <td className="fw-600 color-blue">{contact.name}</td>
                <td>
                  <span className={`badge ${contact.customerType === 'Cá nhân' ? 'badge-info' : 'badge-success'}`}>
                    {contact.customerType || 'Doanh nghiệp'}
                  </span>
                </td>
                <td>{contact.phone}</td>
                <td>{contact.email}</td>
                <td>{contact.company}</td>
                <td>{contact.position}</td>
                <td className="text-right action-btns">
                  <button className="btn-icon text-muted" onClick={() => handleOpenModal(contact)} title="Sửa"><Edit size={16}/></button>
                  <button className="btn-icon text-danger" onClick={() => handleDelete(contact.id)} title="Xóa"><Trash2 size={16}/></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Không tìm thấy liên hệ nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Cập nhật Liên hệ' : 'Thêm Liên hệ mới'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Họ và Tên</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Loại Khách Hàng</label>
                  <select className="form-control" value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value})}>
                    <option value="Doanh nghiệp">Doanh nghiệp (B2B)</option>
                    <option value="Cá nhân">Cá nhân (B2C)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số điện thoại</label>
                  <input type="text" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Công ty / Doanh nghiệp (từ DB)</label>
                  <select className="form-control" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                    <option value="">-- Chọn Khách hàng --</option>
                    {customersData.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Chức vụ</label>
                  <input type="text" className="form-control" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
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

export default Contacts;

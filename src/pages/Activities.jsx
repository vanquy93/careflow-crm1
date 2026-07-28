import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Calendar as CalendarIcon, PhoneCall, Mail, MessageCircle, List } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../api';
import './ListPage.css';
import './Modal.css';

const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const initialMockActivities = [
  { id: 1, type: 'Meeting', title: 'Demo sản phẩm E-Hiring', date: '2023-11-20 14:00', contact: 'Nguyễn Quỳnh Chi', status: 'Sắp tới' },
  { id: 2, type: 'Call', title: 'Gọi điện hỏi thăm KH', date: '2023-11-19 09:30', contact: 'Trần Văn Oanh', status: 'Đã hoàn thành' },
  { id: 3, type: 'Email', title: 'Gửi báo giá hệ thống Base Finance', date: '2023-11-18 16:45', contact: 'Phạm Trọng Nam', status: 'Đã hoàn thành' },
];

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [contactsData, setContactsData] = useState([]);

  useEffect(() => {
    api.get('/activities').then(res => setActivities(res.data)).catch(console.error);
    api.get('/contacts').then(res => setContactsData(res.data)).catch(console.error);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ type: 'Call', title: '', date: '', contact: '', status: 'Sắp tới' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'list' or 'calendar'



  const handleOpenModal = (act = null) => {
    if (act) {
      setEditingId(act.id);
      setFormData(act);
    } else {
      setEditingId(null);
      setFormData({ type: 'Call', title: '', date: '', contact: '', status: 'Sắp tới' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/activities/${editingId}`, formData);
        setActivities(activities.map(a => a.id === editingId ? { ...a, ...formData } : a));
      } else {
        const newAct = { ...formData, id: `ACT_${Date.now()}` };
        await api.post('/activities', newAct);
        setActivities([...activities, newAct]);
      }
      setShowModal(false);
    } catch(e) {
      console.error(e);
      alert("Lỗi lưu Activities!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) {
      try {
        await api.delete(`/activities/${id}`);
        setActivities(activities.filter(a => a.id !== id));
      } catch(e) { console.error(e) }
    }
  };

  const getIcon = (type) => {
    if (type === 'Meeting') return <CalendarIcon size={16} className="color-blue" />;
    if (type === 'Call') return <PhoneCall size={16} className="color-blue" />;
    if (type === 'Zalo OA') return <MessageCircle size={16} style={{ color: '#0068ff' }} />;
    return <Mail size={16} className="color-blue" />;
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calendarEvents = filteredActivities.map(a => {
    const d = new Date(a.date);
    let endDate = new Date(d);
    endDate.setHours(endDate.getHours() + 1); // Default duration 1 hour
    return {
      ...a,
      start: d,
      end: endDate,
      title: `${a.type === 'Call' ? '📞' : a.type === 'Meeting' ? '🤝' : '✉️'} ${a.title} - ${a.contact}`
    };
  });

  const eventStyleGetter = (event) => {
    let backgroundColor = '#0052cc';
    if (event.type === 'Meeting') backgroundColor = '#6554c0';
    if (event.type === 'Call') backgroundColor = '#36b37e';
    if (event.type === 'Zalo OA') backgroundColor = '#0068ff';
    
    if (event.status === 'Đã hoàn thành') {
      backgroundColor = '#8792a2';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Nhật ký Hoạt động</h2>
        <div className="list-actions">
          <div className="search-box-list">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm hoạt động..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', background: '#f4f5f7', borderRadius: '6px', padding: '2px' }}>
            <button 
              className={`btn-icon ${viewMode === 'list' ? 'active-view' : ''}`} 
              style={{ background: viewMode === 'list' ? '#fff' : 'transparent', border: viewMode === 'list' ? '1px solid #dfe1e6' : 'none', borderRadius: '4px', padding: '6px 10px' }}
              onClick={() => setViewMode('list')}
            >
              <List size={16} /> Danh sách
            </button>
            <button 
              className={`btn-icon ${viewMode === 'calendar' ? 'active-view' : ''}`} 
              style={{ background: viewMode === 'calendar' ? '#fff' : 'transparent', border: viewMode === 'calendar' ? '1px solid #dfe1e6' : 'none', borderRadius: '4px', padding: '6px 10px' }}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} /> Lịch trực quan
            </button>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}><Plus size={14}/> Thêm hoạt động</button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Chủ đề</th>
                <th>Thời gian</th>
                <th>Liên hệ với</th>
                <th>Trạng thái</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length > 0 ? filteredActivities.map(act => (
                <tr key={act.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getIcon(act.type)}
                      <span>{act.type}</span>
                    </div>
                  </td>
                  <td className="fw-600 color-blue">{act.title}</td>
                  <td>{act.date}</td>
                  <td>{act.contact}</td>
                  <td><span className={`badge ${act.status === 'Đã hoàn thành' ? 'badge-success' : 'badge-warning'}`}>{act.status}</span></td>
                  <td className="text-right" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-icon text-muted" onClick={() => handleOpenModal(act)} title="Sửa"><Edit size={16}/></button>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(act.id)} title="Xóa"><Trash2 size={16}/></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="calendar-container" style={{ height: '600px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="vi"
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày"
            }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => handleOpenModal(event)}
            onSelectSlot={(slotInfo) => {
              setEditingId(null);
              setFormData({ type: 'Call', title: '', date: format(slotInfo.start, "yyyy-MM-dd HH:mm"), contact: '', status: 'Sắp tới' });
              setShowModal(true);
            }}
            selectable
          />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Cập nhật Hoạt Động' : 'Thêm Hoạt Động'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Chủ đề công việc</label>
                <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Loại hoạt động</label>
                  <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Call">Gọi điện (Call)</option>
                    <option value="Meeting">Gặp mặt (Meeting)</option>
                    <option value="Email">Gửi Email (Email)</option>
                    <option value="Zalo OA">Zalo OA</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Thời gian</label>
                  <input type="text" className="form-control" placeholder="Ví dụ: 2023-11-20 14:00" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Người liên hệ (từ DB)</label>
                  {contactsData.length === 0 ? (
                    <div style={{ color: 'var(--danger-color)', fontSize: '13px', padding: '8px 0' }}>
                      (Danh bạ đang trống! Vui lòng tạo Khách hàng ở tab "Liên hệ" trước)
                    </div>
                  ) : (
                    <select className="form-control" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}>
                      <option value="">-- Chọn Người Liên Hệ --</option>
                      {contactsData.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Trạng thái</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Sắp tới">Sắp tới (Chưa làm)</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Lưu công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;

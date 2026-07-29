import React, { useState, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const Campaigns = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Form State
  const [campName, setCampName] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campMessage, setCampMessage] = useState('');
  const [campChannel, setCampChannel] = useState('Email');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contRes, campRes] = await Promise.all([
          api.get('/contacts'),
          api.get('/campaigns')
        ]);
        
        let contData = contRes.data;
        if (currentUser.role === 'Sale') {
          contData = contData.filter(c => c.ownerId === currentUser.id);
        }
        setContacts(contData);
        setSelectedContacts(contData.map(c => c.id));
        setCampaigns(campRes.data);
      } catch (err) {
        console.error("Lỗi tải Campaigns:", err);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const newCamp = {
      id: `CAMP_${Date.now()}`,
      name: campName,
      sentCount: 0,
      message: campMessage,
      channel: campChannel,
      date: new Date().toLocaleString('vi-VN')
    };
    
    try {
      await api.post('/campaigns', newCamp);
      setCampaigns([...campaigns, newCamp]);
      setCampName(''); setCampDate(''); setCampMessage('');
      alert("Tạo chiến dịch mới thành công!");
    } catch(e) {
      console.error(e);
      alert("Lỗi lưu chiến dịch!");
    }
  };

  const handleSend = async () => {
    if (!selectedCamp) {
      alert("Vui lòng chọn chiến dịch!");
      return;
    }
    const camp = campaigns.find(c => c.id === selectedCamp);
    if (!camp) return;

    if (selectedContacts.length === 0) {
      alert("Vui lòng tích chọn ít nhất 1 khách hàng để gửi!");
      return;
    }

    const targetContacts = contacts.filter(c => selectedContacts.includes(c.id));

    try {
      // Generate messages and push to server
      const messagePromises = targetContacts.map((c, index) => {
        if (camp.channel === 'Zalo OA') {
          return api.post('/activities', {
            id: `ZALO_${Date.now()}_${index}`,
            type: 'Zalo OA',
            title: `[Chiến dịch Zalo] Gửi tới SĐT ${c.phone || 'Trống'} - ${camp.name}`,
            date: new Date().toLocaleString('vi-VN'),
            contact: c.name,
            status: 'Đã gửi thành công'
          });
        } else if (camp.channel === 'SMS') {
          return api.post('/activities', {
            id: `SMS_${Date.now()}_${index}`,
            type: 'SMS',
            title: `[Chiến dịch SMS] Gửi tới ${c.phone || 'Không có SĐT'} - ${camp.name}`,
            date: new Date().toLocaleString('vi-VN'),
            contact: c.name,
            phone: c.phone || '',
            message: camp.message,
            status: c.phone ? 'Đã gửi thành công' : 'Thất bại - Không có SĐT'
          });
        } else {
          return api.post('/emails', {
            id: `EMAIL_${Date.now()}_${index}`,
            sender: `Hệ thống (${currentUser?.name || 'Admin'}) -> ${c.email}`,
            subject: `[Chiến dịch Email] ${camp.name}`,
            snippet: camp.message.substring(0, 50) + '...',
            date: new Date().toLocaleString('vi-VN'),
            isNew: false,
            status: 'sent'
          });
        }
      });
      await Promise.all(messagePromises);

      // Update sent count
      const updatedCamp = { 
        ...camp, 
        sentCount: camp.sentCount + targetContacts.length, 
        date: new Date().toLocaleString('vi-VN') 
      };
      await api.put(`/campaigns/${camp.id}`, updatedCamp);
      
      setCampaigns(campaigns.map(c => c.id === camp.id ? updatedCamp : c));
      alert(`Đã tự động gửi chiến dịch thành công qua kênh ${camp.channel} đến ${targetContacts.length} Khách hàng!`);
      
    } catch(e) {
      console.error(e);
      alert("Lỗi khi gửi email!");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cId => cId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  return (
    <div className="campaigns-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Chiến Dịch & Khuyến Mại</h1>
        <p className="subtitle">Quản lý các chương trình lễ tết, ưu đãi và gửi thông tin hàng loạt cho khách hàng.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form tạo chiến dịch */}
        <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid #0052cc', boxShadow: '0 8px 30px rgba(0, 82, 204, 0.1)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#172b4d' }}>Tạo Chiến Dịch Mới</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Tên Chiến Dịch / Sự Kiện</label>
              <input type="text" className="form-control" placeholder="Ví dụ: Tri ân Tết..." required value={campName} onChange={e => setCampName(e.target.value)} style={{ padding: '10px' }}/>
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Ngày Bắt Đầu</label>
              <input type="date" className="form-control" required value={campDate} onChange={e => setCampDate(e.target.value)} style={{ padding: '10px' }}/>
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Kênh gửi (Channel)</label>
              <select className="form-control" value={campChannel} onChange={e => setCampChannel(e.target.value)} style={{ padding: '10px', fontSize: '15px' }}>
                <option value="Email">📧 Gửi qua Email</option>
                <option value="Zalo OA">💬 Gửi qua Zalo OA</option>
                <option value="SMS">📱 Gửi SMS (Tin nhắn điện thoại)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Thông điệp</label>
              <textarea className="form-control" rows="4" placeholder="Nhập nội dung..." required value={campMessage} onChange={e => setCampMessage(e.target.value)} style={{ padding: '12px' }}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)', border: 'none' }}>
              <Plus size={18} /> TẠO CHIẾN DỊCH
            </button>
          </form>
          
          <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', fontSize: '1.25rem', color: '#172b4d', borderBottom: '2px solid #ebecf0', paddingBottom: '8px' }}>Chương Trình Đã Thiết Lập</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {campaigns.map(camp => (
              <div key={camp.id} style={{ padding: '1.25rem', background: '#f4f5f7', borderLeft: `4px solid ${camp.channel === 'Zalo OA' ? '#0068ff' : '#0052cc'}`, borderRadius: '0 8px 8px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#172b4d' }}>{camp.name}</span>
                <span style={{ fontSize: '12px', padding: '4px 10px', background: camp.channel === 'Zalo OA' ? '#e6f0ff' : camp.channel === 'SMS' ? '#fff3e0' : '#e5e8ea', color: camp.channel === 'Zalo OA' ? '#0068ff' : camp.channel === 'SMS' ? '#e65100' : '#42526e', borderRadius: '20px', fontWeight: 600 }}>
                    {camp.channel === 'Zalo OA' ? '💬' : camp.channel === 'SMS' ? '📱' : '📧'} {camp.channel || 'Email'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#00875a', fontWeight: 600 }}>Đã tiếp cận: {camp.sentCount} khách hàng</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Cập nhật: {camp.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gửi tin nhắn */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#172b4d' }}>Thực Thi Chiến Dịch Hàng Loạt</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end', background: '#e6fcff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #b3f5ff' }}>
            <div style={{ flexGrow: 1 }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#006644' }}>Chọn chiến dịch để gửi đi</label>
              <select className="form-control" value={selectedCamp} onChange={(e) => setSelectedCamp(e.target.value)} style={{ padding: '10px', fontSize: '15px', border: '1px solid #79f2c0' }}>
                <option value="">-- Chọn chiến dịch --</option>
                {campaigns.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSend} style={{ height: '44px', padding: '0 24px', fontSize: '15px', background: '#00875a', border: 'none', boxShadow: '0 4px 10px rgba(0, 135, 90, 0.3)' }}>
              <Send size={18} /> GỬI HÀNG LOẠT NGAY
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Danh Sách Khách Hàng Nhận Thông Tin</h4>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Liên Hệ (Contact)</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Công ty</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(cust => (
                    <tr key={cust.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedContacts.includes(cust.id)}
                          onChange={() => handleSelectContact(cust.id)}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{cust.name}</td>
                      <td>{cust.phone}</td>
                      <td>{cust.email}</td>
                      <td>{cust.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;

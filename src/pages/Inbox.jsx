import React, { useState, useEffect } from 'react';
import { Mail, Search, Inbox as InboxIcon, Send, Star, Trash2, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './ListPage.css';
import './Modal.css';

const initialMockEmails = [
  { id: 1, sender: 'Nguyễn Quỳnh Chi', subject: 'Re: Báo giá E-Hiring', snippet: 'Dạ anh/chị cho em xin thêm thông tin về phần...', date: '10:30 AM', isNew: true, status: 'inbox' },
  { id: 2, sender: 'Trần Văn Oanh', subject: 'Thư mời họp', snippet: 'Vincommerce kính mời quý công ty tham dự...', date: 'Hôm qua', isNew: false, status: 'inbox' },
  { id: 3, sender: 'Phạm Trọng Nam', subject: 'Xác nhận hợp đồng', snippet: 'Bên mình đã duyệt xong bản draft, vui lòng...', date: '18/11/2023', isNew: false, status: 'inbox' },
];

const Inbox = () => {
  const { currentUser } = useAuth();

  const [currentTab, setCurrentTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load Contacts for Autocomplete
  const [emails, setEmails] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // Compose Modal State
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emailRes, contRes] = await Promise.all([
          api.get('/emails'),
          api.get('/contacts')
        ]);
        // Sort newest first
        setEmails(emailRes.data.sort((a,b) => b.id - a.id));
        setContacts(contRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSendEmail = (e) => {
    e.preventDefault();
    const newEmail = {
      id: Date.now(),
      sender: `Tôi (${currentUser?.name}) -> ${composeData.to}`,
      subject: composeData.subject,
      snippet: composeData.content.substring(0, 50) + '...',
      date: 'Vừa xong',
      isNew: false,
      status: 'sent'
    };
    setEmails([newEmail, ...emails]);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', content: '' });
  };

  const moveToTrash = (e, id) => {
    e.stopPropagation(); // Ngăn không mở email
    if (window.confirm("Chuyển thư này vào thùng rác?")) {
      setEmails(emails.map(mail => mail.id === id ? { ...mail, status: 'trash' } : mail));
    }
  };

  const deleteForever = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Xóa vĩnh viễn thư này?")) {
      setEmails(emails.filter(mail => mail.id !== id));
    }
  };

  const filteredEmails = emails.filter(mail => mail.status === currentTab && (
    mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.sender.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  return (
    <div className="inbox-page">
      <div className="inbox-sidebar">
        <button className="btn-primary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setShowCompose(true)}>
          <Plus size={16} /> Soạn thư mới
        </button>
        <ul className="inbox-menu">
          <li className={currentTab === 'inbox' ? 'active' : ''} onClick={() => setCurrentTab('inbox')}>
            <InboxIcon size={16} /> Hộp thư đến 
            <span className="count">{emails.filter(e => e.status === 'inbox' && e.isNew).length}</span>
          </li>
          <li className={currentTab === 'sent' ? 'active' : ''} onClick={() => setCurrentTab('sent')}>
            <Send size={16} /> Đã gửi
          </li>
          <li className={currentTab === 'starred' ? 'active' : ''} onClick={() => setCurrentTab('starred')}>
            <Star size={16} /> Có gắn sao
          </li>
          <li className={currentTab === 'trash' ? 'active' : ''} onClick={() => setCurrentTab('trash')}>
            <Trash2 size={16} /> Thùng rác
          </li>
        </ul>
      </div>

      <div className="inbox-content">
        <div className="list-header" style={{ marginBottom: 16 }}>
          <h2>{currentTab === 'inbox' ? 'Hộp thư đến' : currentTab === 'sent' ? 'Đã gửi' : currentTab === 'trash' ? 'Thùng rác' : 'Thư'}</h2>
          <div className="search-box-list" style={{ width: 300 }}>
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm trong email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="email-list">
          {filteredEmails.length > 0 ? filteredEmails.map(email => (
            <div key={email.id} className={`email-item ${email.isNew ? 'unread' : ''}`}>
              <div className="email-sender">{email.sender}</div>
              <div className="email-body">
                <span className="email-subject">{email.subject}</span>
                <span className="email-snippet"> - {email.snippet}</span>
              </div>
              <div className="email-date" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                <span>{email.date}</span>
                {currentTab !== 'trash' ? (
                   <button className="btn-icon text-muted" onClick={(e) => moveToTrash(e, email.id)} title="Đưa vào thùng rác"><Trash2 size={14}/></button>
                ) : (
                   <button className="btn-icon text-danger" onClick={(e) => deleteForever(e, email.id)} title="Xóa vĩnh viễn"><X size={14}/></button>
                )}
              </div>
            </div>
          )) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có thư nào trong thư mục này.
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Soạn Thư Mới</h2>
              <button className="btn-close" onClick={() => setShowCompose(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSendEmail} className="modal-body">
              <div className="form-group">
                <label>Đến (To:)</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="email@doitac.com"
                  required 
                  list="contacts-emails"
                  value={composeData.to} 
                  onChange={e => setComposeData({...composeData, to: e.target.value})} 
                />
                <datalist id="contacts-emails">
                  {contacts.map(c => (
                    <option key={c.id} value={c.email}>{c.name} ({c.company})</option>
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Chủ đề (Subject)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={composeData.subject} 
                  onChange={e => setComposeData({...composeData, subject: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Nội dung</label>
                <textarea 
                  className="form-control" 
                  rows="6" 
                  style={{ resize: 'vertical' }}
                  required 
                  value={composeData.content} 
                  onChange={e => setComposeData({...composeData, content: e.target.value})} 
                ></textarea>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowCompose(false)}>Bỏ nháp</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }}>
                  <Send size={16} /> Gửi Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, X, KeyRound, MoveUp, MoveDown } from 'lucide-react';
import { api } from '../api';
import './ListPage.css';
import './Modal.css';

const Settings = () => {
  const { isManager, users, adminAddUser, adminUpdateUser, adminDeleteUser, adminResetPassword, currentUser, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'Sale', kpiTarget: 1000000000, permissions: [] });
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#2563eb');
  const [bgColor, setBgColor] = useState(localStorage.getItem('bgColor') || '#f8fafc');
  
  const [zaloConfig, setZaloConfig] = useState(() => {
    const saved = localStorage.getItem('zaloConfig');
    return saved ? JSON.parse(saved) : { appId: '', secretKey: '', accessToken: '' };
  });
  const [zaloStatus, setZaloStatus] = useState(null);

  const [smsConfig, setSmsConfig] = useState(() => {
    const saved = localStorage.getItem('smsConfig');
    return saved ? JSON.parse(saved) : { provider: 'esms', apiKey: '', secretKey: '', brandname: '', smsType: '4' };
  });
  const [smsStatus, setSmsStatus] = useState(null);
  const [smsTestPhone, setSmsTestPhone] = useState('');

  // Tùy biến Giai đoạn
  const [dealStages, setDealStages] = useState([]);
  const [newStageTitle, setNewStageTitle] = useState('');

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await api.get('/deal_stages');
        if (res.data.length === 0) {
          const initialStages = [
            { id: "stage-1", title: "Xác Định Khách Hàng", order: 1 },
            { id: "stage-2", title: "Tiếp Cận Khách Hàng", order: 2 },
            { id: "stage-3", title: "Demo Sản Phẩm", order: 3 },
            { id: "stage-4", title: "Gửi Báo Giá", order: 4 },
            { id: "stage-5", title: "Đàm Phán Giá", order: 5 },
            { id: "stage-6", title: "Chốt Hợp Đồng", order: 6 }
          ];
          for (let s of initialStages) {
             await api.post('/deal_stages', s);
          }
          setDealStages(initialStages);
        } else {
          setDealStages(res.data.sort((a,b) => (a.order || 0) - (b.order || 0)));
        }
      } catch (err) { console.error(err); }
    };
    fetchStages();
  }, []);

  const handleAddStage = async () => {
    if (!newStageTitle.trim()) return;
    const newStage = {
      id: `stage-${Date.now()}`,
      title: newStageTitle,
      order: dealStages.length + 1
    };
    try {
      await api.post('/deal_stages', newStage);
      setDealStages([...dealStages, newStage]);
      setNewStageTitle('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteStage = async (id) => {
    if (dealStages.length <= 1) {
      alert("Phải có ít nhất 1 giai đoạn thương vụ!");
      return;
    }
    const targetStage = dealStages.find(s => s.id === id);
    if (!window.confirm(`Bạn có chắc muốn xóa giai đoạn "${targetStage?.title}"?`)) return;
    
    // Check if deals are using this stage
    try {
      const dealsRes = await api.get('/deals');
      const dealsInStage = dealsRes.data.filter(d => d.stageId === id && !d.isDeleted);
      if (dealsInStage.length > 0) {
        const fallbackStage = dealStages.find(s => s.id !== id);
        if (!window.confirm(`Có ${dealsInStage.length} thương vụ đang ở giai đoạn này. Chúng sẽ tự động chuyển về giai đoạn "${fallbackStage.title}". Bạn đồng ý chứ?`)) {
          return;
        }
        // Move deals
        for (let d of dealsInStage) {
          await api.patch(`/deals/${d.id}`, { stageId: fallbackStage.id });
        }
      }
      
      await api.delete(`/deal_stages/${id}`);
      setDealStages(dealStages.filter(s => s.id !== id));
      alert("Đã xóa giai đoạn thành công!");
    } catch (e) { console.error(e); }
  };

  const handleMoveStage = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === dealStages.length - 1) return;

    const newStages = [...dealStages];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap their 'order' values
    const tempOrder = newStages[index].order;
    newStages[index].order = newStages[swapIndex].order;
    newStages[swapIndex].order = tempOrder;
    
    // Sort by order again
    const sorted = [...newStages].sort((a, b) => (a.order || 0) - (b.order || 0));
    setDealStages(sorted);
    
    // Save to server
    try {
      await Promise.all([
        api.put(`/deal_stages/${newStages[index].id}`, newStages[index]),
        api.put(`/deal_stages/${newStages[swapIndex].id}`, newStages[swapIndex])
      ]);
    } catch(e) {
      console.error(e);
      alert('Lỗi khi lưu thứ tự giai đoạn!');
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setPrimaryColor(color);
    document.documentElement.style.setProperty('--base-blue', color);
    localStorage.setItem('primaryColor', color);
  };

  const handleBgChange = (e) => {
    const color = e.target.value;
    setBgColor(color);
    document.documentElement.style.setProperty('--bg-body', color);
    localStorage.setItem('bgColor', color);
  };

  const handleTestZalo = async () => {
    setZaloStatus('loading');
    try {
      const res = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
        headers: { 'access_token': zaloConfig.accessToken }
      });
      const data = await res.json();
      if (data.error) {
        setZaloStatus({ success: false, message: `Lỗi từ Zalo: ${data.message} (Code: ${data.error})` });
      } else {
        setZaloStatus({ success: true, message: `Kết nối thành công tới Zalo OA: ${data.data.name}` });
      }
      localStorage.setItem('zaloConfig', JSON.stringify(zaloConfig));
    } catch (error) {
      setZaloStatus({ success: false, message: "Không thể kết nối đến máy chủ Zalo. Vui lòng kiểm tra lại mạng hoặc mã Access Token!" });
    }
  };

  const handleSaveSMS = () => {
    localStorage.setItem('smsConfig', JSON.stringify(smsConfig));
    setSmsStatus({ success: true, message: 'Đã lưu cấu hình SMS thành công!' });
    setTimeout(() => setSmsStatus(null), 3000);
  };

  const handleTestSMS = async () => {
    if (!smsTestPhone) { alert('Vui lòng nhập số điện thoại test!'); return; }
    if (!smsConfig.apiKey) { alert('Vui lòng nhập API Key trước!'); return; }
    setSmsStatus('loading');
    try {
      const res = await fetch('https://rest.esms.vn/MainService.svc/json/GetBalance_V4_post_json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ApiKey: smsConfig.apiKey, SecretKey: smsConfig.secretKey })
      });
      const data = await res.json();
      if (data.CodeResult === '100') {
        setSmsStatus({ success: true, message: `Kết nối ESMS thành công! Số dư tài khoản: ${data.Balance} credit` });
        localStorage.setItem('smsConfig', JSON.stringify(smsConfig));
      } else {
        setSmsStatus({ success: false, message: `Lỗi: ${data.ErrorMessage || 'API key không hợp lệ'}` });
      }
    } catch {
      setSmsStatus({ success: false, message: 'Không thể kết nối. Kiểm tra lại API Key!' });
    }
  };

  if (!hasPermission('manage_users') && !isManager) {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        phone: user.phone || '',
        password: user.password || '', 
        role: user.role, 
        kpiTarget: user.kpi?.target || 0,
        permissions: user.permissions || [] 
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'Sale', kpiTarget: 1000000000, permissions: [] });
    }
    setShowModal(true);
  };

  const handleTogglePermission = (perm) => {
    if (formData.permissions.includes(perm)) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, perm] });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingId) {
      adminUpdateUser(editingId, formData);
    } else {
      if (!adminAddUser(formData)) {
        alert("Email này đã tồn tại!");
        return;
      }
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (id === currentUser.id) {
      alert("Bạn không thể tự xóa chính mình!");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống?")) {
      adminDeleteUser(id);
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại mật khẩu mặc định (12345678) cho nhân sự này?")) {
      const success = await adminResetPassword(id);
      if (success) alert("Đã đặt lại mật khẩu thành công!");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="list-page">
      <div className="list-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div 
            onClick={() => setActiveTab('users')}
            style={{ padding: '12px 4px', cursor: 'pointer', borderBottom: activeTab === 'users' ? '3px solid var(--base-blue)' : '3px solid transparent', fontWeight: activeTab === 'users' ? 600 : 400 }}
          >
            Quản lý Nhân sự
          </div>
          <div 
            onClick={() => setActiveTab('system')}
            style={{ padding: '12px 4px', cursor: 'pointer', borderBottom: activeTab === 'system' ? '3px solid var(--base-blue)' : '3px solid transparent', fontWeight: activeTab === 'system' ? 600 : 400 }}
          >
            Cài đặt Giao diện
          </div>
          <div 
            onClick={() => setActiveTab('deal_stages')}
            style={{ padding: '12px 4px', cursor: 'pointer', borderBottom: activeTab === 'deal_stages' ? '3px solid var(--base-blue)' : '3px solid transparent', fontWeight: activeTab === 'deal_stages' ? 600 : 400 }}
          >
            Tùy biến Thương vụ
          </div>
          <div 
            onClick={() => setActiveTab('integrations')}
            style={{ padding: '12px 4px', cursor: 'pointer', borderBottom: activeTab === 'integrations' ? '3px solid var(--base-blue)' : '3px solid transparent', fontWeight: activeTab === 'integrations' ? 600 : 400 }}
          >
            Tích hợp API (Zalo/SMS)
          </div>
        </div>
        {activeTab === 'users' && (
          <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => handleOpenModal()}><Plus size={14}/> Thêm nhân sự mới</button>
        )}
      </div>

      {activeTab === 'users' ? (
        <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Chức vụ (Role)</th>
              <th>Chỉ tiêu (Target KPI)</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td className="fw-600 color-blue">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={u.avatar} alt={u.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    {u.name}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.phone || 'N/A'}</td>
                <td><span className={`badge ${u.role === 'Manager' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span></td>
                <td>{formatCurrency(u.kpi?.target || 0)}</td>
                <td className="text-right action-btns">
                  <button className="btn-icon text-warning" title="Reset Mật khẩu" onClick={() => handleResetPassword(u.id)}><KeyRound size={16}/></button>
                  <button className="btn-icon text-muted" title="Chỉnh sửa" onClick={() => handleOpenModal(u)}><Edit size={16}/></button>
                  <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(u.id)}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : activeTab === 'deal_stages' ? (
        <div style={{ padding: '24px' }}>
          <div className="base-card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '16px' }}>Cấu trúc Phễu Bán hàng (Deal Stages)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Quản lý các cột giai đoạn trong mục Thương vụ. Bạn có thể chèn thêm bước hoặc xóa bớt. 
              Các thương vụ nằm ở giai đoạn bị xóa sẽ tự động bị đẩy về giai đoạn mặc định.
            </p>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nhập tên giai đoạn mới..." 
                value={newStageTitle}
                onChange={e => setNewStageTitle(e.target.value)}
              />
              <button className="btn-primary" onClick={handleAddStage} style={{ whiteSpace: 'nowrap' }}><Plus size={16}/> Thêm cột</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {dealStages.map((stage, idx) => (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx !== dealStages.length - 1 ? '1px solid var(--border-color)' : 'none', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--base-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{stage.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon text-muted" onClick={() => handleMoveStage(idx, 'up')} disabled={idx === 0} title="Di chuyển lên"><MoveUp size={16}/></button>
                    <button className="btn-icon text-muted" onClick={() => handleMoveStage(idx, 'down')} disabled={idx === dealStages.length - 1} title="Di chuyển xuống"><MoveDown size={16}/></button>
                    <button className="btn-icon text-danger" onClick={() => handleDeleteStage(stage.id)} title="Xóa giai đoạn" style={{ marginLeft: 8 }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'system' ? (
        <div style={{ padding: '24px' }}>
          <div className="base-card" style={{ padding: '24px', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '16px' }}>Cấu hình Giao diện (Theme)</h3>
            <div className="form-group">
              <label>Màu chủ đạo (Primary Color)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={handleColorChange}
                  style={{ width: '48px', height: '48px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{primaryColor}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Màu sắc này sẽ được áp dụng cho Thanh công cụ (Header), Nút bấm và các đường viền.</p>
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label>Màu nền hệ thống (Background Color)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={handleBgChange}
                  style={{ width: '48px', height: '48px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{bgColor}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Màu nền bao phủ toàn bộ ứng dụng (mặc định là xám nhạt/trắng).</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px' }}>
          <div className="base-card" style={{ padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '16px', color: '#0068ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1024px-Icon_of_Zalo.svg.png" style={{width: 24}} alt="zalo"/> 
              Kết nối Zalo Official Account (ZNS)
            </h3>
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>App ID</label>
              <input type="text" className="form-control" placeholder="Nhập Zalo App ID..." value={zaloConfig.appId} onChange={e => setZaloConfig({...zaloConfig, appId: e.target.value})} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Secret Key</label>
              <input type="password" className="form-control" placeholder="Nhập Secret Key..." value={zaloConfig.secretKey} onChange={e => setZaloConfig({...zaloConfig, secretKey: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Access Token (Mã truy cập cấp quyền)</label>
              <textarea className="form-control" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR..." value={zaloConfig.accessToken} onChange={e => setZaloConfig({...zaloConfig, accessToken: e.target.value})}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={handleTestZalo} disabled={zaloStatus === 'loading'} style={{ background: '#0068ff' }}>
                {zaloStatus === 'loading' ? 'Đang kiểm tra...' : 'Lưu & Kiểm tra kết nối'}
              </button>
            </div>

            {zaloStatus && zaloStatus !== 'loading' && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '4px', background: zaloStatus.success ? '#e6ffed' : '#ffebe9', border: `1px solid ${zaloStatus.success ? '#2ea043' : '#ff8182'}`, color: zaloStatus.success ? '#05501e' : '#cf222e', fontSize: '13.5px' }}>
                {zaloStatus.message}
              </div>
            )}
          </div>

          {/* SMS Integration */}
          <div style={{ background: '#fff', border: '1px solid #dfe1e6', borderRadius: 12, padding: 24, marginTop: 20 }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
              <span style={{ fontSize: 24 }}>📱</span> Tích Hợp Gửi SMS (ESMS.vn)
            </h3>

            <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
              <strong>⚠️ Hướng dẫn:</strong> Đăng ký tại <a href="https://esms.vn" target="_blank" rel="noreferrer" style={{ color: '#0052cc' }}>esms.vn</a> → Lấy API Key + Secret Key → Đăng ký Brandname → Dán vào đây. Chi phí ~350đ/tin.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>API Key *</label>
                <input type="text" className="form-control" placeholder="Nhập ESMS API Key..." value={smsConfig.apiKey} onChange={e => setSmsConfig({...smsConfig, apiKey: e.target.value})} style={{ padding: 10 }}/>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Secret Key *</label>
                <input type="password" className="form-control" placeholder="Nhập Secret Key..." value={smsConfig.secretKey} onChange={e => setSmsConfig({...smsConfig, secretKey: e.target.value})} style={{ padding: 10 }}/>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Brandname (Tên hiển thị)</label>
                <input type="text" className="form-control" placeholder="VD: NEXTHOME" value={smsConfig.brandname} onChange={e => setSmsConfig({...smsConfig, brandname: e.target.value})} style={{ padding: 10 }}/>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Loại SMS</label>
                <select className="form-control" value={smsConfig.smsType} onChange={e => setSmsConfig({...smsConfig, smsType: e.target.value})} style={{ padding: 10 }}>
                  <option value="4">Brandname quảng cáo (Type 4)</option>
                  <option value="2">Brandname OTP (Type 2)</option>
                  <option value="8">Fix2phone (Type 8)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600 }}>Số điện thoại test</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="tel" className="form-control" placeholder="0984214746" value={smsTestPhone} onChange={e => setSmsTestPhone(e.target.value)} style={{ padding: 10 }}/>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveSMS} style={{ background: '#36b37e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                💾 Lưu cấu hình
              </button>
              <button onClick={handleTestSMS} disabled={smsStatus === 'loading'} style={{ background: '#0052cc', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                {smsStatus === 'loading' ? 'Đang kiểm tra...' : '📱 Kiểm tra kết nối'}
              </button>
            </div>

            {smsStatus && smsStatus !== 'loading' && (
              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: smsStatus.success ? '#e6ffed' : '#ffebe9', border: `1px solid ${smsStatus.success ? '#2ea043' : '#ff8182'}`, color: smsStatus.success ? '#05501e' : '#cf222e', fontSize: 13.5 }}>
                {smsStatus.message}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Cập nhật Nhân sự' : 'Tạo Tài khoản Nhân sự'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Họ và Tên</label>
                <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email đăng nhập</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingId} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số điện thoại</label>
                  <input type="tel" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Nhập số điện thoại..." />
                </div>
              </div>
              <div className="form-group">
                <label>Mật khẩu {editingId && '(Bỏ trống nếu không đổi)'}</label>
                <input type="text" className="form-control" required={!editingId} minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)..." />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Chức vụ (Role)</label>
                  <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Sale">Sale (Nhân viên)</option>
                    <option value="Manager">Manager (Quản lý)</option>
                    {currentUser.role === 'Admin' && <option value="Admin">Admin (Quản trị cao cấp)</option>}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mục tiêu KPI (VND)</label>
                  <input type="text" className="form-control" required value={new Intl.NumberFormat('vi-VN').format(formData.kpiTarget)} onChange={e => setFormData({...formData, kpiTarget: Number(e.target.value.replace(/\D/g, ''))})} />
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Quyền hạn (Permissions)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                    <input type="checkbox" checked={formData.permissions.includes('view_all')} onChange={() => handleTogglePermission('view_all')} />
                    Xem tất cả dữ liệu
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                    <input type="checkbox" checked={formData.permissions.includes('view_reports')} onChange={() => handleTogglePermission('view_reports')} />
                    Xem Báo cáo Doanh thu
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                    <input type="checkbox" checked={formData.permissions.includes('manage_users')} onChange={() => handleTogglePermission('manage_users')} />
                    Quản lý Nhân sự
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', color: 'var(--danger)' }}>
                    <input type="checkbox" checked={formData.permissions.includes('delete_data')} onChange={() => handleTogglePermission('delete_data')} />
                    Quyền Xóa dữ liệu
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
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

export default Settings;

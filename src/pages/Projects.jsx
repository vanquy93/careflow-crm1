import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, Plus, Users, User, Trash2, X, Building, Crown, Link, Activity, Briefcase } from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
  const { users, currentUser, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', managerId: '', memberIds: [] });
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailTab, setDetailTab] = useState('customers');

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data || [])).catch(() => setProjects([]));
    api.get('/customers').then(r => setCustomers(r.data.filter(c => !c.isDeleted) || [])).catch(() => setCustomers([]));
    api.get('/deals').then(r => setDeals(r.data.filter(d => !d.isDeleted) || [])).catch(() => setDeals([]));
    api.get('/activities').then(r => setActivities(r.data || [])).catch(() => setActivities([]));
  }, []);

  const visibleProjects = isManager
    ? projects
    : projects.filter(p => p.memberIds?.includes(currentUser.id) || p.managerId === currentUser.id);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const allMemberIds = form.managerId && !form.memberIds.includes(form.managerId)
      ? [form.managerId, ...form.memberIds]
      : form.memberIds;
      
    if (editingProject) {
      const updatedProject = {
        ...editingProject,
        name: form.name,
        description: form.description,
        managerId: form.managerId,
        memberIds: allMemberIds,
        updatedAt: new Date().toISOString(),
      };
      await api.put(`/projects/${editingProject.id}`, updatedProject);
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      if (selectedProject?.id === editingProject.id) setSelectedProject(updatedProject);
    } else {
      const newProject = {
        id: `PRJ_${Date.now()}`,
        name: form.name,
        description: form.description,
        managerId: form.managerId,
        memberIds: allMemberIds,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      await api.post('/projects', newProject);
      setProjects(prev => [...prev, newProject]);
    }
    
    setShowModal(false);
    setEditingProject(null);
    setForm({ name: '', description: '', managerId: '', memberIds: [] });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa dự án này?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const toggleMember = (uid) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(uid)
        ? prev.memberIds.filter(id => id !== uid)
        : [...prev.memberIds, uid]
    }));
  };

  const getProjectCustomers = (project) =>
    customers.filter(c => project.memberIds?.includes(c.ownerId));

  const getProjectDeals = (project) => {
    const prjCustomerNames = getProjectCustomers(project).map(c => c.name);
    return deals.filter(d =>
      project.memberIds?.includes(d.agentId) ||
      prjCustomerNames.includes(d.company)
    );
  };

  const getProjectActivities = (project) =>
    activities.filter(a => project.memberIds?.some(mid => {
      const m = users.find(u => u.id === mid);
      return m && (a.user === m.name || a.contact === m.name);
    }));

  const STAGE_LABELS = {
    'stage-1': 'Xác Định KH', 'stage-2': 'Tiếp Cận', 'stage-3': 'Demo SP',
    'stage-4': 'Gửi Báo Giá', 'stage-5': 'Đàm Phán', 'stage-6': 'Chốt HĐ'
  };

  const formatCurrency = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#172b4d', margin: 0 }}>🏗️ Quản Lý Dự Án</h1>
          <p style={{ color: '#6b778c', margin: '4px 0 0', fontSize: '14px' }}>Phân chia nhóm, theo dõi tiến độ theo từng dự án</p>
        </div>
        {isManager && (
          <button onClick={() => {
            setEditingProject(null);
            setForm({ name: '', description: '', managerId: '', memberIds: [] });
            setShowModal(true);
          }}
            style={{ background: 'linear-gradient(135deg,#0052cc,#0065ff)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18}/> Tạo Dự Án
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedProject ? '380px 1fr' : '1fr', gap: 20 }}>
        {/* Project list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visibleProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, color: '#6b778c' }}>
              <FolderOpen size={48} style={{ marginBottom: 12, opacity: 0.3 }}/>
              <p>Chưa có dự án nào</p>
              {isManager && <button onClick={() => setShowModal(true)} style={{ marginTop: 12, background: '#0052cc', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>Tạo dự án đầu tiên</button>}
            </div>
          )}
          {visibleProjects.map(project => {
            const members = users.filter(u => project.memberIds?.includes(u.id));
            const manager = users.find(u => u.id === project.managerId);
            const prjCustomers = getProjectCustomers(project);
            const prjDeals = getProjectDeals(project);
            const prjRevenue = prjDeals.filter(d => d.stageId === 'stage-6').reduce((s,d) => s+(Number(d.value)||0), 0);
            const isSelected = selectedProject?.id === project.id;
            return (
              <div key={project.id} onClick={() => setSelectedProject(isSelected ? null : project)} style={{
                background: isSelected ? '#f0f4ff' : '#fff',
                border: isSelected ? '2px solid #0052cc' : '1px solid #dfe1e6',
                borderRadius: 12, padding: '18px 20px', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: isSelected ? '0 4px 12px rgba(0,82,204,0.15)' : '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: '#172b4d', fontSize: '1rem', fontWeight: 700 }}>📁 {project.name}</h3>
                    {project.description && <p style={{ margin: '4px 0 0', color: '#6b778c', fontSize: 12 }}>{project.description}</p>}
                    {manager && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#ff8b00', fontSize: 12, fontWeight: 600 }}>
                        <Crown size={12}/> PM: {manager.name}
                      </div>
                    )}
                  </div>
                  {(isAdmin || currentUser.id === project.managerId) && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={e => { 
                        e.stopPropagation(); 
                        setEditingProject(project);
                        setForm({
                          name: project.name,
                          description: project.description || '',
                          managerId: project.managerId || '',
                          memberIds: project.memberIds || []
                        });
                        setShowModal(true);
                      }}
                        style={{ background: 'transparent', border: 'none', color: '#0052cc', cursor: 'pointer', padding: 4 }} title="Chỉnh sửa">
                        <span style={{ fontSize: 16 }}>✏️</span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                        style={{ background: 'transparent', border: 'none', color: '#ff5630', cursor: 'pointer', padding: 4 }} title="Xóa">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#0052cc', fontWeight: 600 }}><Users size={12} style={{verticalAlign: 'middle'}}/> {members.length} TV</span>
                  <span style={{ fontSize: 12, color: '#36b37e', fontWeight: 600 }}><Building size={12} style={{verticalAlign: 'middle'}}/> {prjCustomers.length} KH</span>
                  <span style={{ fontSize: 12, color: '#ff8b00', fontWeight: 600 }}><Briefcase size={12} style={{verticalAlign: 'middle'}}/> {prjDeals.length} deal</span>
                  {prjRevenue > 0 && <span style={{ fontSize: 12, color: '#00875a', fontWeight: 700 }}>💰 {(prjRevenue/1e6).toFixed(0)}tr</span>}
                </div>
                <div style={{ display: 'flex', marginTop: 10 }}>
                  {members.slice(0, 6).map((m,i) => (
                    <img key={m.id} src={m.avatar} alt={m.name} title={m.name}
                      style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, objectFit: 'cover' }}/>
                  ))}
                  {members.length > 6 && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginLeft: -8, border: '2px solid #fff' }}>+{members.length-6}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project detail panel */}
        {selectedProject && (() => {
          const prjMembers = users.filter(u => selectedProject.memberIds?.includes(u.id));
          const prjManager = users.find(u => u.id === selectedProject.managerId);
          const prjCustomers = getProjectCustomers(selectedProject);
          const prjDeals = getProjectDeals(selectedProject);
          const prjActivities = getProjectActivities(selectedProject);
          return (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxHeight: '82vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: '#172b4d', fontSize: '1.2rem' }}>📁 {selectedProject.name}</h2>
                  {prjManager && <div style={{ fontSize: 12, color: '#ff8b00', fontWeight: 600, marginTop: 4 }}><Crown size={12}/> Quản lý: {prjManager.name}</div>}
                </div>
                <button onClick={() => setSelectedProject(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b778c' }}><X size={20}/></button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '2px solid #f4f5f7', marginBottom: 16, gap: 4 }}>
                {[['customers',`👥 KH (${prjCustomers.length})`],['deals',`💼 Deal (${prjDeals.length})`],['members',`👤 Thành viên (${prjMembers.length})`],['activities',`📋 Hoạt động (${prjActivities.length})`]].map(([tab, label]) => (
                  <button key={tab} onClick={() => setDetailTab(tab)} style={{
                    padding: '8px 14px', border: 'none', borderBottom: detailTab === tab ? '2px solid #0052cc' : '2px solid transparent',
                    background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: detailTab === tab ? 700 : 400,
                    color: detailTab === tab ? '#0052cc' : '#6b778c', marginBottom: -2
                  }}>{label}</button>
                ))}
              </div>

              {/* Tab: Customers */}
              {detailTab === 'customers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prjCustomers.length === 0 ? <p style={{ color: '#6b778c', fontSize: 13 }}>Chưa có khách hàng. Gán thành viên → KH của họ tự hiện ở đây.</p> :
                    prjCustomers.map(c => {
                      const owner = users.find(u => u.id === c.ownerId);
                      return (
                        <div key={c.id} onClick={() => navigate('/customers')} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fc', borderRadius: 8, cursor: 'pointer', border: '1px solid #eee' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#172b4d' }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: '#6b778c' }}>{c.phone} · {c.industry || c.type || ''}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ fontSize: 11, color: '#0052cc', fontWeight: 600 }}><User size={10}/> {owner?.name}</span>
                            <Link size={12} style={{ color: '#aaa' }}/>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}

              {/* Tab: Deals */}
              {detailTab === 'deals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prjDeals.length === 0 ? <p style={{ color: '#6b778c', fontSize: 13 }}>Chưa có thương vụ nào.</p> :
                    prjDeals.map(d => {
                      const agent = users.find(u => u.id === d.agentId);
                      return (
                        <div key={d.id} onClick={() => navigate('/deals')} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fc', borderRadius: 8, cursor: 'pointer', border: '1px solid #eee' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#172b4d' }}>{d.title}</div>
                            <div style={{ fontSize: 12, color: '#6b778c' }}>{d.company} · {STAGE_LABELS[d.stageId] || d.stageId}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: d.stageId === 'stage-6' ? '#36b37e' : '#0052cc', fontSize: 14 }}>{formatCurrency(d.value)}</div>
                            <div style={{ fontSize: 11, color: '#6b778c' }}>{agent?.name}</div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}

              {/* Tab: Members */}
              {detailTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prjMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8f9fc', borderRadius: 8 }}>
                      <img src={m.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#172b4d', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.name}
                          {m.id === selectedProject.managerId && <span style={{ background: '#fff3cd', color: '#ff8b00', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}><Crown size={10}/> PM</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b778c' }}>{m.role} · {m.phone || m.email}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12 }}>
                        <div style={{ color: '#36b37e', fontWeight: 600 }}>{prjCustomers.filter(c => c.ownerId === m.id).length} KH</div>
                        <div style={{ color: '#0052cc', fontWeight: 600 }}>{prjDeals.filter(d => d.agentId === m.id).length} deal</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Activities */}
              {detailTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prjActivities.length === 0 ? <p style={{ color: '#6b778c', fontSize: 13 }}>Chưa có hoạt động nào.</p> :
                    prjActivities.slice(0, 20).map(a => (
                      <div key={a.id} style={{ padding: '10px 14px', background: '#f8f9fc', borderRadius: 8, borderLeft: '3px solid #0052cc' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#172b4d' }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: '#6b778c' }}>{a.type} · {a.date} · {a.contact}</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modal create project */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: '#172b4d' }}>{editingProject ? 'Sửa Thông Tin Dự Án' : 'Tạo Dự Án Mới'}</h2>
              <button onClick={() => {setShowModal(false); setEditingProject(null);}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b778c' }}><X size={22}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 6, color: '#172b4d' }}>📋 Tên Dự Án *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Ví dụ: Dự án TPHCM Q3/2026" required style={{ padding: 10, fontSize: 15 }}/>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 6, color: '#172b4d' }}>📝 Mô tả</label>
                <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows="2" placeholder="Mô tả ngắn về dự án..." style={{ padding: 10 }}/>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 6, color: '#172b4d' }}>👑 Người Quản Lý Dự Án (PM)</label>
                <select className="form-control" value={form.managerId} onChange={e => setForm(p => ({...p, managerId: e.target.value}))} style={{ padding: 10, fontSize: 14 }}>
                  <option value="">-- Chọn PM --</option>
                  {users.filter(u => ['Manager','Admin'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: 10, color: '#172b4d' }}>👥 Thành Viên Nhóm</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', padding: '4px 2px' }}>
                  {users.filter(u => u.id !== 'admin').map(u => (
                    <label key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      border: form.memberIds.includes(u.id) ? '1.5px solid #0052cc' : '1px solid #dfe1e6',
                      borderRadius: 8, cursor: 'pointer',
                      background: form.memberIds.includes(u.id) ? '#f0f4ff' : '#fff',
                      transition: 'all 0.15s'
                    }}>
                      <input type="checkbox" checked={form.memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} style={{ accentColor: '#0052cc', width: 16, height: 16 }}/>
                      <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#172b4d' }}>
                          {u.name}
                          {u.id === form.managerId && <span style={{ marginLeft: 8, background: '#fff3cd', color: '#ff8b00', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>PM</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b778c' }}>{u.role} · {u.phone || u.email}</div>
                      </div>
                      {form.memberIds.includes(u.id) && <span style={{ color: '#0052cc', fontSize: 18, fontWeight: 700 }}>✓</span>}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b778c' }}>
                  Đã chọn <strong>{form.memberIds.length}</strong> thành viên
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => {setShowModal(false); setEditingProject(null);}} style={{ flex: 1, padding: '12px', border: '1px solid #dfe1e6', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ flex: 2, background: 'linear-gradient(135deg,#0052cc,#0065ff)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                  ✅ {editingProject ? 'Lưu Thay Đổi' : 'Tạo Dự Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

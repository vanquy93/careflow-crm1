import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, Plus, Filter, Settings, Search, X, Trash2, Clock, Activity, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { stages } from '../data/mockData';
import { api } from '../api';
import { logAction } from '../utils/audit';
import './Customers.css';
import './Modal.css';

const DealsBoard = () => {
  const { currentUser, isManager, users, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dealLogs, setDealLogs] = useState([]);
  
  // Relational data
  const [customersData, setCustomersData] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);

  // Fetch Data from Server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, custRes] = await Promise.all([
          api.get('/deals'),
          api.get('/customers')
        ]);
        setDeals(dealsRes.data.filter(d => !d.isDeleted));
        let custData = custRes.data.filter(c => !c.isDeleted);
        if (currentUser.role === 'Sale') {
          custData = custData.filter(c => c.ownerId === currentUser.id);
        }
        setCustomersData(custData);
        
        // Check if URL has a Deal ID to auto-open
        const dealIdToOpen = searchParams.get('id');
        if (dealIdToOpen) {
          const targetDeal = dealsRes.data.find(d => d.id === dealIdToOpen);
          if (targetDeal) {
            handleOpenModal(targetDeal);
            // Clear URL param after opening
            setSearchParams({});
          }
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu Thương vụ:", err);
      }
    };
    fetchData();
  }, [searchParams, setSearchParams]);

  // Discard localstorage sync since we use Server
  useEffect(() => {
    window.dispatchEvent(new Event('deals_updated'));
  }, [deals]);

  useEffect(() => {
    // Role-based filtering + Text search filtering
    let result = deals;
    
    if (!isManager) {
      result = result.filter(d => d.agentId === currentUser.id);
    }
    
    if (searchQuery.trim() !== '') {
      result = result.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDeals(result);
  }, [deals, currentUser, isManager, searchQuery]);

  const formatCurrency = (val) => {
    if (val === 0) return 'VND0';
    return 'VND' + new Intl.NumberFormat('vi-VN').format(val);
  };
  
  const formatInputCurrency = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(Number(num));
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const getLeadScore = (value) => {
    if (value > 50000000) return { label: '🔥 NÓNG', color: '#ff5630', bg: '#ffebe6' };
    if (value >= 10000000) return { label: '⛅ ẤM', color: '#ffab00', bg: '#fffae6' };
    return { label: '❄️ LẠNH', color: '#0052cc', bg: '#e6efff' };
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    // Nếu kéo thả trong cùng 1 cột thì bỏ qua hoặc xử lý reorder
    if (source.droppableId === destination.droppableId) {
      return; 
    }

    const draggedDeal = deals.find(d => d.id === draggableId);
    if (!draggedDeal) return;
    
    const updatedDeal = { ...draggedDeal, stageId: destination.droppableId };
    
    // Update UI immediately (Optimistic UI)
    setDeals(prev => prev.map(d => d.id === draggableId ? updatedDeal : d));
    
    try {
      // 1. Cập nhật vào DB
      await api.put(`/deals/${draggableId}`, updatedDeal);
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái API:", err);
      // Revert UI on failure
      setDeals(prev => prev.map(d => d.id === draggableId ? draggedDeal : d));
      return; // Dừng lại nếu lỗi API
    }

    try {
      // 2. Ghi Log
      await logAction(currentUser, 'UPDATE', 'DEAL', draggableId, `Di chuyển "${draggedDeal.title}" từ ${source.droppableId} sang ${destination.droppableId}`, false);
      
      // 3. Notification Logic
      if (destination.droppableId === 'stage-6') {
        const notif = {
          id: `NOTIF_${Date.now()}`,
          type: 'DEAL',
          referenceId: draggedDeal.id,
          message: `🎉 Chúc mừng! Thương vụ "${draggedDeal.title}" trị giá ${formatCurrency(draggedDeal.value)} vừa được chuyển sang Chốt Hợp Đồng!`,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        await api.post('/notifications', notif);
        window.dispatchEvent(new Event('new_notification'));
      }
    } catch (err) {
      console.error("Lỗi khi ghi log hoặc gửi thông báo:", err);
      // Không revert UI ở đây vì API lưu DB đã thành công
    }
  };

  const totalValueOverall = filteredDeals.reduce((acc, d) => acc + d.value, 0);

  const handleOpenModal = async (deal = null) => {
    if (deal) {
      setSelectedDeal(deal);
      try {
        const res = await api.get(`/auditLogs?entityId=${deal.id}`);
        setDealLogs(res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch(e) {
        console.error(e);
        setDealLogs([]);
      }
    } else {
      setSelectedDeal({
        id: `DEAL_${Date.now()}`,
        title: '',
        company: customersData[0]?.name || '',
        value: 0,
        stageId: 'stage-1',
        agentId: currentUser.id,
        notes: '',
        tags: [],
        createdAt: new Date().toISOString()
      });
      setDealLogs([]);
    }
    setShowModal(true);
  };

  const handleDeleteDeal = async (id) => {
    if (!hasPermission('delete_data')) {
      alert("Bạn không có quyền Xóa dữ liệu!");
      return;
    }
    if (window.confirm("Bạn có chắc muốn xóa thương vụ này? (Có thể khôi phục trong Thùng rác)")) {
      try {
        const dealToDelete = deals.find(d => d.id === id);
        await api.patch(`/deals/${id}`, { 
          isDeleted: true, 
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.name 
        });
        setDeals(deals.filter(d => d.id !== id));
        if (selectedDeal?.id === id) setShowModal(false);
        await logAction(currentUser, 'DELETE', 'DEAL', id, `Xóa tạm thương vụ: ${dealToDelete.title}`, true);
      } catch (e) {
        console.error("Lỗi xóa:", e);
      }
    }
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    const isExisting = deals.find(d => d.id === selectedDeal.id);
    
    try {
      if (isExisting) {
        await api.put(`/deals/${selectedDeal.id}`, selectedDeal);
        await logAction(currentUser, 'UPDATE', 'DEAL', selectedDeal.id, `Cập nhật thông tin thương vụ: ${selectedDeal.title}`, false);
        setDeals(deals.map(d => d.id === selectedDeal.id ? selectedDeal : d));
      } else {
        await api.post('/deals', selectedDeal);
        await logAction(currentUser, 'CREATE', 'DEAL', selectedDeal.id, `Tạo mới thương vụ: ${selectedDeal.title}`, false);
        setDeals([...deals, selectedDeal]);
      }
      setShowModal(false);
      setSelectedDeal(null);
    } catch (err) {
      console.error("Lỗi lưu Thương vụ:", err);
      alert("Đã xảy ra lỗi khi lưu vào máy chủ!");
    }
  };

  return (
    <div className="deals-page">
      {/* Sub Header */}
      <div className="deals-subheader">
        <div className="deals-subheader-left">
          <button className="btn-add-deal" onClick={() => handleOpenModal()}><Plus size={16} /> Thêm thương vụ</button>
          <div className="divider-vertical"></div>
          <span className="total-summary">{formatCurrency(totalValueOverall)} - {filteredDeals.length} Thương vụ</span>
        </div>
        
        <div className="deals-subheader-right">
          <div className="quick-filter">
            <input 
              type="text" 
              placeholder="Tìm kiếm thương vụ..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={14} className="filter-icon" />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-container">
          {stages.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stageId === stage.id);
            const stageTotalValue = stageDeals.reduce((acc, d) => acc + d.value, 0);
            
            return (
              <div key={stage.id} className="board-column">
                <div className="column-header">
                  <h3 className="column-title">{stage.title}</h3>
                  <div className="column-stats">
                    <ActivityIcon />
                    <span>{formatCurrency(stageTotalValue)} - {stageDeals.length} TV</span>
                  </div>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div 
                      className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {stageDeals.map((deal, index) => {
                        const agent = users.find(e => e.id === deal.agentId) || currentUser;
                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                className={`deal-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleOpenModal(deal)}
                              >
                                {deal.tags && deal.tags.length > 0 && (
                                  <div className="card-tags">
                                    {deal.tags.map((tag, i) => (
                                      <div key={i} className="color-bar" style={{ backgroundColor: tag }}></div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="card-header">
                                  <div className="card-title">{deal.title}</div>
                                  <button className="btn-more" onClick={(e) => { e.stopPropagation(); handleOpenModal(deal); }}><ChevronRight size={14}/></button>
                                </div>
                                
                                <div style={{ marginBottom: '8px' }}>
                                  <span style={{ 
                                    fontSize: '11px', 
                                    padding: '4px 8px', 
                                    borderRadius: '12px', 
                                    fontWeight: 700, 
                                    backgroundColor: getLeadScore(deal.value).bg,
                                    color: getLeadScore(deal.value).color
                                  }}>
                                    {getLeadScore(deal.value).label}
                                  </span>
                                </div>

                                <div className="card-company">{deal.company}</div>
                                {deal.createdAt && (
                                  <div style={{fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <Clock size={12} /> {formatDate(deal.createdAt)}
                                  </div>
                                )}
                                
                                <div className="card-footer">
                                  <div className="card-agent">
                                    <img src={agent?.avatar || 'https://i.pravatar.cc/150'} alt={agent?.name} />
                                    <span>{agent?.name}</span>
                                  </div>
                                  <div className="card-value">{formatCurrency(deal.value)}</div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Deal Modal */}
      {showModal && selectedDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cập nhật Thương vụ</h2>
              <div>
                {selectedDeal.id && hasPermission('delete_data') && (
                  <button type="button" className="btn-icon text-danger" onClick={() => handleDeleteDeal(selectedDeal.id)} style={{ marginRight: '8px' }}>
                    <Trash2 size={16}/>
                  </button>
                )}
                <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
            </div>
            <form onSubmit={handleSaveDeal} className="modal-body">
              <div className="form-group">
                <label>Tên Thương Vụ</label>
                <input 
                  type="text" 
                  value={selectedDeal.title} 
                  onChange={e => setSelectedDeal({...selectedDeal, title: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Khách hàng / Công ty</label>
                <select 
                  value={selectedDeal.company} 
                  onChange={e => setSelectedDeal({...selectedDeal, company: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">-- Chọn Khách hàng --</option>
                  {customersData.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Giá trị (VND)</label>
                <input 
                  type="text" 
                  value={formatInputCurrency(selectedDeal.value)} 
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setSelectedDeal({...selectedDeal, value: raw ? Number(raw) : 0});
                  }}
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{flex: 1}}>
                  <label>Giai đoạn</label>
                  <select 
                    value={selectedDeal.stageId} 
                    onChange={e => setSelectedDeal({...selectedDeal, stageId: e.target.value})}
                    className="form-control"
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                
                {isManager && (
                  <div className="form-group" style={{flex: 1}}>
                    <label>Người phụ trách</label>
                    <select 
                      value={selectedDeal.agentId} 
                      onChange={e => setSelectedDeal({...selectedDeal, agentId: e.target.value})}
                      className="form-control"
                    >
                      {users.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea 
                  value={selectedDeal.notes || ''} 
                  onChange={e => setSelectedDeal({...selectedDeal, notes: e.target.value})}
                  className="form-control"
                  rows="3"
                ></textarea>
              </div>
              
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Activity size={18}/> Lịch sử Tương tác <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>({dealLogs.length} hoạt động)</span></h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingLeft: '16px', paddingRight: '4px', borderLeft: '2px solid var(--border-color)', position: 'relative' }}>
                  {dealLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có hoạt động nào được ghi nhận.</p>
                  ) : (
                    dealLogs.map((log) => (
                      <div key={log.id} style={{ position: 'relative', marginBottom: '14px' }}>
                        <div style={{
                          position: 'absolute', left: '-21px', top: '2px', width: '10px', height: '10px',
                          backgroundColor: log.action === 'CREATE' ? '#36b37e' : (log.action === 'DELETE' ? '#ff5630' : '#2563eb'),
                          borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 0 1px var(--border-color)'
                        }}></div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>{log.details}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <User size={10} style={{ marginRight: 4 }}/> {log.user} • {formatDate(log.timestamp)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-add-deal">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

export default DealsBoard;

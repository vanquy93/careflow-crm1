import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { api } from '../api';
import './AIAssistant.css';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [deals, setDeals] = useState([]);
  const [dealStages, setDealStages] = useState([]);

  useEffect(() => {
    // Load deals and dynamic stages for insights
    Promise.all([
      api.get('/deals'),
      api.get('/deal_stages')
    ]).then(([resDeals, resStages]) => {
      setDeals(resDeals.data);
      setDealStages(resStages.data);
    }).catch(console.error);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Find the last stage to exclude won deals
      const lastStageId = dealStages.length > 0 ? dealStages[dealStages.length - 1].id : 'stage-6';
      
      // Generate Smart Insight
      const hotDeals = deals.filter(d => !d.isDeleted && d.value > 50000000 && d.stageId !== lastStageId);
      let insight = "Chào sếp! Hôm nay sếp có cần hỗ trợ gì không?";
      if (hotDeals.length > 0) {
        insight = `Chào sếp! Hệ thống đang có ${hotDeals.length} thương vụ 🔥 NÓNG (trên 50 triệu) đang chờ chốt. Sếp có muốn xem danh sách không?`;
      }
      setMessages([{ sender: 'ai', text: insight }]);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: inputValue }];
    setMessages(newMsgs);
    setInputValue('');

    // Simulate AI thinking
    setTimeout(() => {
      let reply = "Tính năng phân tích ngôn ngữ tự nhiên đang được nâng cấp. Sếp có thể dùng các gợi ý bên dưới hoặc gõ tên một Giai đoạn thương vụ để tôi đếm nhé!";
      
      const lastStageId = dealStages.length > 0 ? dealStages[dealStages.length - 1].id : 'stage-6';
      
      // Dynamic Search by Stage Name or Deal Name
      const matchedStage = dealStages.find(s => inputValue.toLowerCase().includes(s.title.toLowerCase()));

      if (matchedStage) {
        const stageDeals = deals.filter(d => d.stageId === matchedStage.id && !d.isDeleted);
        const stageValue = stageDeals.reduce((acc, curr) => acc + curr.value, 0);
        reply = `Hiện tại có ${stageDeals.length} thương vụ đang ở giai đoạn "${matchedStage.title}" với tổng giá trị ${new Intl.NumberFormat('vi-VN').format(stageValue)} VND.`;
      } else if (inputValue.toLowerCase().includes('doanh thu')) {
        const total = deals.filter(d => d.stageId === lastStageId && !d.isDeleted).reduce((acc, curr) => acc + curr.value, 0);
        reply = `Tổng doanh thu hiện tại của hệ thống (các hợp đồng ở giai đoạn cuối) là: ${new Intl.NumberFormat('vi-VN').format(total)} VND.`;
      } else if (inputValue.toLowerCase().includes('nóng') || inputValue.toLowerCase().includes('hot')) {
        const hotDeals = deals.filter(d => !d.isDeleted && d.value > 50000000 && d.stageId !== lastStageId);
        reply = `Sếp đang có ${hotDeals.length} thương vụ NÓNG: ${hotDeals.map(d => d.company).join(', ')}. Hãy ưu tiên chốt nhé!`;
      } else {
        // Fallback: Search deals by name/company
        const searchedDeals = deals.filter(d => !d.isDeleted && (d.title.toLowerCase().includes(inputValue.toLowerCase()) || d.company.toLowerCase().includes(inputValue.toLowerCase())));
        if (searchedDeals.length > 0) {
           const top = searchedDeals.slice(0, 3);
           const stagesDict = dealStages.reduce((acc, s) => ({...acc, [s.id]: s.title}), {});
           reply = `Tìm thấy ${searchedDeals.length} kết quả: ${top.map(d => `"${d.title}" (Giai đoạn: ${stagesDict[d.stageId] || 'Chưa rõ'})`).join(' | ')}${searchedDeals.length > 3 ? '...' : ''}`;
        }
      }
      
      setMessages([...newMsgs, { sender: 'ai', text: reply }]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    setInputValue(action);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="ai-fab" 
          onClick={handleOpen}
          title="Trợ lý AI"
        >
          <Sparkles size={24} color="white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="ai-avatar"><Sparkles size={16} color="white" /></div>
              <strong style={{ fontSize: '15px' }}>Trợ lý CRM</strong>
            </div>
            <button onClick={() => setIsOpen(false)} className="ai-close-btn"><X size={18} /></button>
          </div>
          
          <div className="ai-chat-body">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-message ${m.sender}`}>
                <div className="ai-bubble">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="ai-chat-suggestions">
            <button onClick={() => handleQuickAction('Báo cáo doanh thu')}>Báo cáo doanh thu</button>
            <button onClick={() => handleQuickAction('Thương vụ nóng')}>Thương vụ nóng</button>
          </div>

          <form onSubmit={handleSend} className="ai-chat-input">
            <input 
              type="text" 
              placeholder="Hỏi trợ lý..." 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button type="submit"><Send size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { api } from '../api';
import './AIAssistant.css';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    // Load deals for insights
    api.get('/deals').then(res => setDeals(res.data)).catch(console.error);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Generate Smart Insight
      const hotDeals = deals.filter(d => !d.isDeleted && d.value > 50000000 && d.stageId !== 'stage-6');
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
      let reply = "Tính năng phân tích ngôn ngữ tự nhiên đang được nâng cấp. Sếp có thể dùng các gợi ý bên dưới!";
      if (inputValue.toLowerCase().includes('doanh thu')) {
        const total = deals.filter(d => d.stageId === 'stage-6').reduce((acc, curr) => acc + curr.value, 0);
        reply = `Tổng doanh thu hiện tại của hệ thống (các hợp đồng đã chốt) là: ${new Intl.NumberFormat('vi-VN').format(total)} VND.`;
      } else if (inputValue.toLowerCase().includes('nóng') || inputValue.toLowerCase().includes('hot')) {
        const hotDeals = deals.filter(d => !d.isDeleted && d.value > 50000000 && d.stageId !== 'stage-6');
        reply = `Sếp đang có ${hotDeals.length} thương vụ NÓNG: ${hotDeals.map(d => d.company).join(', ')}. Hãy ưu tiên chốt nhé!`;
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

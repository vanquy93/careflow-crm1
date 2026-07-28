import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, Users, Target, Activity } from 'lucide-react';
import { api } from '../api';
import './GlobalSearch.css';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ deals: [], customers: [], contacts: [] });
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Keyboard shortcut Ctrl+K and Global Event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    const handleOpenFromEvent = () => setIsOpen(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open_global_search', handleOpenFromEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open_global_search', handleOpenFromEvent);
    };
  }, []);

  // Fetch and filter
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ deals: [], customers: [], contacts: [] });
      return;
    }
    
    // Focus input when opened
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSearch = async () => {
      if (query.trim().length < 2) {
        setResults({ deals: [], customers: [], contacts: [] });
        return;
      }
      
      try {
        const [dealsRes, custRes, contRes] = await Promise.all([
          api.get('/deals'),
          api.get('/customers'),
          api.get('/contacts')
        ]);
        
        const q = query.toLowerCase();
        
        setResults({
          deals: dealsRes.data.filter(d => !d.isDeleted && (d.title.toLowerCase().includes(q) || d.company.toLowerCase().includes(q))),
          customers: custRes.data.filter(c => c.name.toLowerCase().includes(q) || (c.contactPerson && c.contactPerson.toLowerCase().includes(q))),
          contacts: contRes.data.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        });
      } catch (e) {
        console.error(e);
      }
    };
    
    const debounceId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const totalResults = results.deals.length + results.customers.length + results.contacts.length;

  return (
    <div className="global-search-overlay" onClick={() => setIsOpen(false)}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={20} className="search-icon" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Tìm kiếm Thương vụ, Khách hàng, Liên hệ..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="esc-hint">ESC</span>
        </div>
        
        <div className="global-search-body">
          {query.trim().length > 0 && totalResults === 0 && (
            <div className="no-results">Không tìm thấy kết quả nào.</div>
          )}
          
          {query.trim().length === 0 && (
            <div className="search-placeholder">Gõ từ khóa để bắt đầu tìm kiếm...</div>
          )}

          {results.deals.length > 0 && (
            <div className="result-group">
              <div className="group-title">Thương vụ</div>
              {results.deals.map(deal => (
                <div key={deal.id} className="result-item" onClick={() => handleNavigate(`/deals?id=${deal.id}`)}>
                  <Briefcase size={16} />
                  <div className="result-info">
                    <strong>{deal.title}</strong>
                    <span>{deal.company} - {new Intl.NumberFormat('vi-VN').format(deal.value)} VND</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {results.customers.length > 0 && (
            <div className="result-group">
              <div className="group-title">Khách hàng / Công ty</div>
              {results.customers.map(c => (
                <div key={c.id} className="result-item" onClick={() => handleNavigate('/customers')}>
                  <Target size={16} />
                  <div className="result-info">
                    <strong>{c.name}</strong>
                    <span>{c.contactPerson || c.industry || 'Không có người đại diện'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {results.contacts.length > 0 && (
            <div className="result-group">
              <div className="group-title">Danh bạ (Liên hệ)</div>
              {results.contacts.map(c => (
                <div key={c.id} className="result-item" onClick={() => handleNavigate('/contacts')}>
                  <Users size={16} />
                  <div className="result-info">
                    <strong>{c.name}</strong>
                    <span>{c.email} - {c.company}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="global-search-footer">
          <div><kbd>↑</kbd> <kbd>↓</kbd> để chọn</div>
          <div><kbd>↵</kbd> để mở</div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

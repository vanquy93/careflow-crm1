import React from 'react';
import { Columns, DollarSign, Calendar, Edit, MoreHorizontal } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="left-minibar">
      <div className="minibar-menu">
        <button className="minibar-item">
          <Columns size={20} />
          <span>Quy trình</span>
        </button>
        <button className="minibar-item active">
          <DollarSign size={20} />
          <span>Thương vụ</span>
        </button>
        <button className="minibar-item">
          <Calendar size={20} />
          <span>Nhật ký</span>
        </button>
        <button className="minibar-item">
          <Edit size={20} />
          <span>Chỉnh sửa</span>
        </button>
      </div>

      <div className="minibar-bottom">
        <button className="minibar-item">
          <MoreHorizontal size={20} />
          <span>Công cụ khác</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

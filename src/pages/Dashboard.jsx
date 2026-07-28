import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, Users, Target, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../api';
import html2pdf from 'html2pdf.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css';
import './Funnel.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { isManager, currentUser } = useAuth();
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [funnelFilterAgent, setFunnelFilterAgent] = useState('ALL');
  
  // States for KPI Table
  const [kpiSearch, setKpiSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'kpi.current', direction: 'desc' });
  
  // State for Company Target
  const [companyTarget, setCompanyTarget] = useState(() => {
    const saved = localStorage.getItem('companyTarget');
    return saved ? Number(saved) : 2000000000; // Default 2 tỷ
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, uRes] = await Promise.all([
          api.get('/deals'),
          api.get('/users')
        ]);
        setDeals(dRes.data);
        setUsers(uRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchData();
  }, []);

  // Handle Sales view
  if (!isManager && currentUser?.role === 'Sale') {
    // Only calculate KPI for the current user
    const userDeals = deals.filter(d => d.agentId === currentUser.id && d.stageId === 'stage-6');
    const currentRevenue = userDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const target = currentUser.kpi?.target || 0;
    const progress = target > 0 ? ((currentRevenue / target) * 100).toFixed(1) : 0;
    
    // Funnel for current user
    const funnelStages = [
      { id: 'stage-1', name: 'Xác định', color: '#6554c0' },
      { id: 'stage-2', name: 'Tiếp Cận', color: '#0052cc' },
      { id: 'stage-3', name: 'Demo', color: '#ffab00' },
      { id: 'stage-4', name: 'Báo Giá', color: '#ff5630' },
      { id: 'stage-5', name: 'Đàm Phán', color: '#ff8b00' },
      { id: 'stage-6', name: 'Chốt HĐ', color: '#36b37e' }
    ];
    const userAllDeals = deals.filter(d => d.agentId === currentUser.id);
    const maxDeals = Math.max(...funnelStages.map(s => userAllDeals.filter(d => d.stageId === s.id).length), 1);

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
      <div className="dashboard-wrapper">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">KPI Cá Nhân của bạn</h1>
            <p className="dash-subtitle">Tiến độ hoàn thành mục tiêu - Hạn chót: 31/12/2026</p>
          </div>
        </div>

        <div className="summary-cards">
          <div className="sum-card">
            <div className="sum-icon" style={{ backgroundColor: 'rgba(101, 84, 192, 0.1)', color: '#6554c0' }}>
              <Target size={24} />
            </div>
            <div className="sum-info">
              <p>Mục Tiêu Được Giao (VND)</p>
              <h3>{formatCurrency(target)}</h3>
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-icon" style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)', color: '#36b37e' }}>
              <TrendingUp size={24} />
            </div>
            <div className="sum-info">
              <p>Doanh Thu Hiện Tại (VND)</p>
              <h3>{formatCurrency(currentRevenue)}</h3>
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-icon" style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', color: '#ffab00' }}>
              <Users size={24} />
            </div>
            <div className="sum-info">
              <p>Tỷ Lệ Hoàn Thành KPI</p>
              <h3>{progress}%</h3>
            </div>
          </div>
        </div>

        <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="chart-box">
            <h3 style={{ margin: 0, marginBottom: '1rem' }}>Phễu Bán Hàng Cá Nhân</h3>
            <div className="chart-inner" style={{ overflow: 'hidden', padding: '20px 10px' }}>
              <div className="funnel-container">
                {funnelStages.map((stage) => {
                  const count = userAllDeals.filter(d => d.stageId === stage.id).length;
                  const widthPct = Math.max((count / maxDeals) * 100, 5);
                  return (
                    <div key={stage.id} className="funnel-row" title={`Giai đoạn: ${stage.name} - ${count} thương vụ`}>
                      <div className="funnel-label">{stage.name}</div>
                      <div className="funnel-bar-wrapper">
                        <div className="funnel-bar" style={{ backgroundColor: stage.color, width: `${widthPct}%` }}></div>
                      </div>
                      <div className="funnel-count">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isManager && currentUser?.role !== 'Sale') {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Tính toán KPI thực tế cho từng nhân viên (Bao gồm cả Manager nếu họ trực tiếp chốt Deal)
  const salesUsers = users.map(user => {
    // Chỉ tính doanh thu của các Deal ở "stage-6" (Chốt Hợp Đồng)
    const userDeals = deals.filter(d => d.agentId === user.id && d.stageId === 'stage-6');
    const currentRevenue = userDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    return {
      ...user,
      kpi: {
        target: user.kpi?.target || 0,
        current: currentRevenue
      }
    };
  }).filter(u => u.role === 'Sale' || u.kpi.current > 0); // Hiển thị Sale hoặc bất kỳ ai có doanh thu

  const handleSaveTarget = () => {
    localStorage.setItem('companyTarget', companyTarget);
    setIsEditingTarget(false);
  };

  const totalCurrent = salesUsers.reduce((acc, emp) => acc + emp.kpi.current, 0);
  const totalPercentage = companyTarget > 0 ? ((totalCurrent / companyTarget) * 100).toFixed(1) : 0;

  // Data cho biểu đồ Bar
  const kpiData = {
    labels: salesUsers.map(e => e.name),
    datasets: [
      {
        label: 'Đạt được (VND)',
        data: salesUsers.map(e => e.kpi.current),
        backgroundColor: 'rgba(54, 179, 126, 0.85)',
        borderColor: '#36b37e',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Chỉ tiêu (VND)',
        data: salesUsers.map(e => e.kpi.target),
        backgroundColor: 'rgba(101, 84, 192, 0.15)',
        borderColor: '#6554c0',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
      tooltip: {
        backgroundColor: 'rgba(23, 43, 77, 0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#ebecf0', borderDash: [4, 4] },
        ticks: {
          callback: function(value) {
            if (value >= 1000000000) return (value / 1000000000) + ' Tỷ';
            if (value >= 1000000) return (value / 1000000) + ' Tr';
            return value;
          }
        }
      },
      x: { grid: { display: false } }
    }
  };

  // Data cho biểu đồ Phễu
  const funnelStages = [
    { id: 'stage-1', name: 'Xác định', color: '#6554c0' },
    { id: 'stage-2', name: 'Tiếp Cận', color: '#0052cc' },
    { id: 'stage-3', name: 'Demo', color: '#ffab00' },
    { id: 'stage-4', name: 'Báo Giá', color: '#ff5630' },
    { id: 'stage-5', name: 'Đàm Phán', color: '#ff8b00' },
    { id: 'stage-6', name: 'Chốt HĐ', color: '#36b37e' }
  ];
  
  const filteredFunnelDeals = funnelFilterAgent === 'ALL' 
    ? deals 
    : deals.filter(d => d.agentId === funnelFilterAgent);

  const maxDeals = Math.max(...funnelStages.map(s => filteredFunnelDeals.filter(d => d.stageId === s.id).length), 1);

  const handleExportCSV = () => {
    const headers = ['Mã NV', 'Tên NV', 'Role', 'Chỉ Tiêu (VND)', 'Doanh Thu Đạt Được (VND)', 'Tỷ lệ (%)'];
    const rows = salesUsers.map(emp => {
      const pct = emp.kpi.target > 0 ? ((emp.kpi.current / emp.kpi.target) * 100).toFixed(2) : 0;
      return [emp.id, emp.name, emp.role, emp.kpi.target, emp.kpi.current, pct];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BaoCao_KPI_ThucTe.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('dashboard-content');
    const opt = {
      margin:       0.5,
      filename:     'BaoCao_Dashboard_CRM.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Logic Sắp xếp & Tìm kiếm bảng KPI
  const filteredAndSortedKpiData = useMemo(() => {
    let result = [...salesUsers];
    if (kpiSearch.trim() !== '') {
      result = result.filter(u => u.name.toLowerCase().includes(kpiSearch.toLowerCase()) || u.role.toLowerCase().includes(kpiSearch.toLowerCase()));
    }
    
    result.sort((a, b) => {
      let aValue = a;
      let bValue = b;
      
      const keys = sortConfig.key.split('.');
      for (const k of keys) {
        aValue = aValue[k];
        bValue = bValue[k];
      }
      
      if (sortConfig.key === 'progress') {
         aValue = a.kpi.target > 0 ? (a.kpi.current / a.kpi.target) : 0;
         bValue = b.kpi.target > 0 ? (b.kpi.current / b.kpi.target) : 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [salesUsers, kpiSearch, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: 4 }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} style={{ marginLeft: 4 }} /> : <ArrowDown size={12} style={{ marginLeft: 4 }} />;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Báo Cáo & KPI Tổng Quan</h1>
          <p className="dash-subtitle">Dữ liệu được đồng bộ trực tiếp từ các Thương vụ (Real-time)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-export" style={{ background: '#fff', color: '#172b4d', border: '1px solid #dfe1e6' }} onClick={handleExportCSV}>
            <Download size={16} /> Xuất CSV
          </button>
          <button className="btn-export" style={{ background: '#ff5630' }} onClick={handleExportPDF}>
            <FileText size={16} /> Xuất PDF (Cho Sếp)
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        <div className="summary-cards">
        <div className="sum-card">
          <div className="sum-icon" style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)', color: '#36b37e' }}>
            <TrendingUp size={24} />
          </div>
          <div className="sum-info">
            <p>Tổng Doanh Thu (Hợp Đồng Đã Chốt)</p>
            <h3>{formatCurrency(totalCurrent)}</h3>
          </div>
        </div>
        <div className="sum-card">
          <div className="sum-icon" style={{ backgroundColor: 'rgba(0, 82, 204, 0.1)', color: '#0052cc' }}>
            <Target size={24} />
          </div>
          <div className="sum-info">
            <p>Mục Tiêu Toàn Công Ty</p>
            {isEditingTarget ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={companyTarget} 
                  onChange={e => setCompanyTarget(Number(e.target.value))} 
                  className="form-control" 
                  style={{ width: '150px', padding: '4px 8px', fontSize: '14px', fontWeight: 'bold' }}
                  autoFocus
                  onBlur={handleSaveTarget}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTarget()}
                />
              </div>
            ) : (
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsEditingTarget(true)} title="Click để chỉnh sửa">
                {formatCurrency(companyTarget)}
                <span style={{ fontSize: '12px', color: '#0052cc', fontWeight: 'normal', textDecoration: 'underline' }}>Sửa</span>
              </h3>
            )}
          </div>
        </div>
        <div className="sum-card">
          <div className="sum-icon" style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', color: '#ffab00' }}>
            <Users size={24} />
          </div>
          <div className="sum-info">
            <p>Tỷ Lệ Hoàn Thành KPI</p>
            <h3>{totalPercentage}%</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Thống Kê Tiến Độ KPI Cá Nhân</h3>
          <div className="chart-inner">
            <Bar data={kpiData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Phễu Bán Hàng (Sales Funnel)</h3>
            <select 
              className="form-control" 
              style={{ width: '180px', padding: '6px', fontSize: '13px' }}
              value={funnelFilterAgent}
              onChange={e => setFunnelFilterAgent(e.target.value)}
            >
              <option value="ALL">Tất cả nhân viên</option>
              {salesUsers.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="chart-inner" style={{ overflow: 'hidden', padding: '20px 10px' }}>
            <div className="funnel-container">
              {funnelStages.map((stage, idx) => {
                const count = filteredFunnelDeals.filter(d => d.stageId === stage.id).length;
                const widthPct = Math.max((count / maxDeals) * 100, 5); // min 5% width for visibility
                return (
                  <div key={stage.id} className="funnel-row" title={`Giai đoạn: ${stage.name} - ${count} thương vụ`}>
                    <div className="funnel-label">{stage.name}</div>
                    <div className="funnel-bar-wrapper">
                      <div className="funnel-bar" style={{ backgroundColor: stage.color, width: `${widthPct}%` }}></div>
                    </div>
                    <div className="funnel-count">{count}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Hiển thị số lượng Thương vụ theo từng giai đoạn
            </div>
          </div>
        </div>
      </div>

      <div className="table-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Bảng Thành Tích Cá Nhân</h3>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Tìm kiếm nhân viên..." 
              value={kpiSearch}
              onChange={e => setKpiSearch(e.target.value)}
              style={{ width: '250px', padding: '6px 12px 6px 32px', fontSize: '13px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b778c' }} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="kpi-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Nhân Viên {getSortIcon('name')}</div>
                </th>
                <th onClick={() => requestSort('role')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Chức vụ {getSortIcon('role')}</div>
                </th>
                <th onClick={() => requestSort('kpi.target')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Mục tiêu (VND) {getSortIcon('kpi.target')}</div>
                </th>
                <th onClick={() => requestSort('kpi.current')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Doanh thu (VND) {getSortIcon('kpi.current')}</div>
                </th>
                <th onClick={() => requestSort('progress')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Tiến độ {getSortIcon('progress')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedKpiData.map(emp => {
                const progress = emp.kpi.target > 0 ? Math.min((emp.kpi.current / emp.kpi.target) * 100, 100) : 0;
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={emp.avatar} alt={emp.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{formatCurrency(emp.kpi.target)}</td>
                    <td style={{ color: '#36b37e', fontWeight: 600 }}>{formatCurrency(emp.kpi.current)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#dfe1e6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#36b37e', width: `${progress}%` }}></div>
                        </div>
                        <span style={{ fontSize: 12 }}>{progress.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedKpiData.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#8c98a9' }}>Không tìm thấy nhân viên nào!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;

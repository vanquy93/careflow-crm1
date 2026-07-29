import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, Users, Target, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown, BarChart2, Calendar } from 'lucide-react';
import { api } from '../api';
import html2pdf from 'html2pdf.js';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';
import './Funnel.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const QUARTERS = ['Quý 1 (T1-T3)','Quý 2 (T4-T6)','Quý 3 (T7-T9)','Quý 4 (T10-T12)'];

const Dashboard = () => {
  const { isManager, currentUser, users } = useAuth();
  const [deals, setDeals] = useState([]);
  const [dealStages, setDealStages] = useState([]);
  const wonStageId = dealStages.length > 0 ? dealStages[dealStages.length - 1].id : 'stage-6';
  
  // States for unified dashboard
  const [viewMode, setViewMode] = useState('month'); // month | quarter | year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  
  const [kpiSearch, setKpiSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'kpi.current', direction: 'desc' });
  const [companyTarget, setCompanyTarget] = useState(() => {
    const saved = localStorage.getItem('companyTarget');
    return saved ? Number(saved) : 2000000000;
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/deals'), api.get('/deal_stages')])
      .then(([dealsRes, stagesRes]) => {
        setDeals(dealsRes.data.filter(d => !d.isDeleted));
        if (stagesRes.data.length > 0) {
          setDealStages(stagesRes.data.sort((a,b) => (a.order||0) - (b.order||0)));
        } else {
          setDealStages([
            { id: 'stage-1', title: 'Xác định', color: '#6554c0' },
            { id: 'stage-2', title: 'Tiếp Cận', color: '#0052cc' },
            { id: 'stage-3', title: 'Demo', color: '#ffab00' },
            { id: 'stage-4', title: 'Báo Giá', color: '#ff5630' },
            { id: 'stage-5', title: 'Đàm Phán', color: '#ff8b00' },
            { id: 'stage-6', title: 'Chốt HĐ', color: '#36b37e' }
          ]);
        }
      })
      .catch(console.error);
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatShort = (val) => {
    if (val >= 1e9) return (val/1e9).toFixed(1) + ' Tỷ';
    if (val >= 1e6) return (val/1e6).toFixed(0) + ' Tr';
    return val;
  };

  const handleSaveTarget = () => {
    localStorage.setItem('companyTarget', companyTarget);
    setIsEditingTarget(false);
  };

  // 1. Data logic for Reports (Revenue charts)
  const closedDeals = useMemo(() => {
    let d = deals.filter(d => d.stageId === 'stage-6');
    if (!isManager) d = d.filter(d => d.agentId === currentUser.id);
    if (selectedAgent !== 'ALL') d = d.filter(d => d.agentId === selectedAgent);
    return d;
  }, [deals, isManager, currentUser, selectedAgent, wonStageId]);

  const chartData = useMemo(() => {
    let raw = {};
    if (viewMode === 'month') {
      MONTHS.forEach(m => raw[m] = 0);
      closedDeals.forEach(d => {
        let date = new Date(d.createdAt || Date.now());
        if (date.getFullYear() === selectedYear) {
          let m = MONTHS[date.getMonth()];
          raw[m] += Number(d.value) || 0;
        }
      });
    } else if (viewMode === 'quarter') {
      QUARTERS.forEach(q => raw[q] = 0);
      closedDeals.forEach(d => {
        let date = new Date(d.createdAt || Date.now());
        if (date.getFullYear() === selectedYear) {
          let q = QUARTERS[Math.floor(date.getMonth() / 3)];
          raw[q] += Number(d.value) || 0;
        }
      });
    } else {
      let years = [selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1];
      years.forEach(y => raw[`Năm ${y}`] = 0);
      closedDeals.forEach(d => {
        let yr = new Date(d.createdAt || Date.now()).getFullYear();
        if (years.includes(yr)) {
          raw[`Năm ${yr}`] += Number(d.value) || 0;
        }
      });
    }
    return raw;
  }, [closedDeals, viewMode, selectedYear]);

  const chartLabels = Object.keys(chartData);
  const chartValues = Object.values(chartData);
  const chartTotalRevenue = chartValues.reduce((s,v) => s+v, 0);
  const bestPeriodIdx = chartValues.indexOf(Math.max(...chartValues));

  const barData = {
    labels: chartLabels,
    datasets: [{
      label: 'Doanh Thu (VND)',
      data: chartValues,
      backgroundColor: chartValues.map((v,i) => i === bestPeriodIdx ? 'rgba(0,178,167,0.9)' : 'rgba(0,178,167,0.4)'),
      borderColor: '#00b2a7',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const lineData = {
    labels: chartLabels,
    datasets: [{
      label: 'Xu hướng Doanh Thu',
      data: chartValues,
      borderColor: '#00b2a7',
      backgroundColor: 'rgba(0,178,167,0.1)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: '#00b2a7',
      tension: 0.4,
      fill: true,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(23, 43, 77, 0.9)',
        callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed.y) }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => formatShort(v) }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  // 2. Data logic for KPI and Funnel (Filtered by Time)
  const timeFilteredDeals = useMemo(() => {
    return deals.filter(d => {
      const date = new Date(d.createdAt || Date.now());
      if (date.getFullYear() !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && date.getMonth() !== Number(selectedMonth)) return false;
      if (selectedQuarter !== 'ALL' && Math.floor(date.getMonth() / 3) !== Number(selectedQuarter)) return false;
      return true;
    });
  }, [deals, selectedYear, selectedMonth, selectedQuarter]);

  // Overall KPI total revenue (for the selected time period)
  const totalRevenue = timeFilteredDeals.filter(d => d.stageId === wonStageId).reduce((s, d) => s + (Number(d.value) || 0), 0);

  let salesUsers = [];
  if (isManager) {
    salesUsers = users.map(user => {
      const userDeals = timeFilteredDeals.filter(d => d.agentId === user.id && d.stageId === wonStageId);
      const currentRevenue = userDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      return {
        ...user,
        kpi: { target: user.kpi?.target || 0, current: currentRevenue },
        dealsCount: timeFilteredDeals.filter(d => d.agentId === user.id && d.stageId === wonStageId).length
      };
    }).filter(u => u.role === 'Sale' || u.kpi.current > 0);
  }

  const filteredAndSortedKpiData = useMemo(() => {
    let result = [...salesUsers];
    if (kpiSearch.trim() !== '') {
      result = result.filter(u => u.name.toLowerCase().includes(kpiSearch.toLowerCase()) || u.role.toLowerCase().includes(kpiSearch.toLowerCase()));
    }
    result.sort((a, b) => {
      let aValue = a, bValue = b;
      const keys = sortConfig.key.split('.');
      for (const k of keys) { aValue = aValue[k]; bValue = bValue[k]; }
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
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: 4 }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} style={{ marginLeft: 4 }} /> : <ArrowDown size={12} style={{ marginLeft: 4 }} />;
  };

  const filteredFunnelDeals = selectedAgent === 'ALL' ? timeFilteredDeals : timeFilteredDeals.filter(d => d.agentId === selectedAgent);
  const maxDeals = Math.max(...dealStages.map(s => filteredFunnelDeals.filter(d => d.stageId === s.id).length), 1);
  
  // Only calculate percentage against target for year (if Month/Quarter is ALL) 
  // or proportionately if we want to get fancy, but let's just use the strict target
  const totalPercentage = companyTarget > 0 ? ((totalRevenue / companyTarget) * 100).toFixed(1) : 0;

  // 3. Export Logic
  const handleExportCSV = () => {
    const headers = ['Tên Nhân Viên', 'Chức Vụ', 'Mục Tiêu (VND)', 'Doanh Thu (VND)', 'Hoàn Thành (%)', 'Số Hợp Đồng'];
    const rows = salesUsers.map(emp => {
      const pct = emp.kpi.target > 0 ? ((emp.kpi.current / emp.kpi.target) * 100).toFixed(1) : 0;
      return [emp.name, emp.role, emp.kpi.target, emp.kpi.current, pct, emp.dealsCount];
    });
    
    const revHeaders = ['Kỳ Báo Cáo', 'Doanh Thu (VND)'];
    const revRows = chartLabels.map((label, i) => [label, chartValues[i]]);

    const csvContent = 
      "--- BÁO CÁO NHÂN SỰ & KPI ---\n" + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n') +
      "\n\n--- BÁO CÁO DOANH THU THEO KỲ ---\n" +
      [revHeaders.join(','), ...revRows.map(e => e.join(','))].join('\n');
      
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `BaoCao_ChiTiet_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('dashboard-content');
    const opt = {
      margin: 0.5,
      filename: 'BaoCao_Dashboard_CRM.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!isManager && currentUser?.role !== 'Sale') {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dash-header" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="dash-title">📊 Báo Cáo & Dashboard</h1>
          <p className="dash-subtitle">Phân tích toàn diện doanh thu, KPI và phễu bán hàng</p>
        </div>
        
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Chart View Modes */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-white)', padding: 4, borderRadius: 8 }}>
            {[['month','Tháng'],['quarter','Quý'],['year','Năm']].map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: viewMode === mode ? '#0052cc' : 'transparent',
                color: viewMode === mode ? '#fff' : '#42526e'
              }} title={`Xem biểu đồ theo ${label}`}>{label}</button>
            ))}
          </div>

          {/* Time Filters for KPI & Funnel */}
          <select className="form-control" style={{ width: 110, padding: '8px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {Array.from({length: 11}, (_, i) => 2020 + i).map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
          
          <select className="form-control" style={{ width: 110, padding: '8px' }} value={selectedQuarter} onChange={e => { setSelectedQuarter(e.target.value); setSelectedMonth('ALL'); }}>
            <option value="ALL">Tất cả Quý</option>
            {[0,1,2,3].map(q => <option key={q} value={q}>Quý {q+1}</option>)}
          </select>
          
          <select className="form-control" style={{ width: 110, padding: '8px' }} value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedQuarter('ALL'); }}>
            <option value="ALL">Tất cả Tháng</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          {isManager && (
            <select className="form-control" style={{ width: 150, padding: '8px' }} value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
              <option value="ALL">Tất cả nhân sự</option>
              {users.filter(u => u.role === 'Sale').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}

          <button className="btn-export" style={{ background: 'var(--bg-white)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={handleExportCSV}>
            <Download size={16} /> Xuất CSV
          </button>
          <button className="btn-export" style={{ background: '#ff5630' }} onClick={handleExportPDF}>
            <FileText size={16} /> Xuất PDF
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        {/* SUMMARY CARDS */}
        <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="sum-card" style={{ padding: '20px', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(54,179,126,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#36b37e' }}><TrendingUp size={20}/></div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Tổng Doanh Thu</p>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>{formatCurrency(totalRevenue)}</h3>
          </div>

          <div className="sum-card" style={{ padding: '20px', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(0,178,167,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00b2a7' }}><BarChart2 size={20}/></div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Kỳ Tốt Nhất</p>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>{chartLabels[bestPeriodIdx] || '-'}</h3>
          </div>

          <div className="sum-card" style={{ padding: '20px', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,171,0,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffab00' }}><Target size={20}/></div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Mục Tiêu Công Ty</p>
            </div>
            {isEditingTarget ? (
              <input type="number" value={companyTarget} onChange={e => setCompanyTarget(Number(e.target.value))} 
                className="form-control" style={{ width: '100%', padding: '4px 8px', fontSize: '14px', fontWeight: 'bold' }} autoFocus onBlur={handleSaveTarget} onKeyDown={e => e.key === 'Enter' && handleSaveTarget()} />
            ) : (
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => setIsEditingTarget(true)} title="Sửa mục tiêu">
                {formatCurrency(companyTarget)}
              </h3>
            )}
          </div>

          <div className="sum-card" style={{ padding: '20px', background: 'var(--bg-white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(101,84,192,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6554c0' }}><Users size={20}/></div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ Lệ Đạt KPI</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>{totalPercentage}%</h3>
              <div style={{ flex: 1, height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#6554c0', width: `${Math.min(totalPercentage, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-white)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>Biểu Đồ Doanh Thu ({viewMode === 'month' ? 'Tháng' : viewMode === 'quarter' ? 'Quý' : 'Năm'})</h3>
            <div style={{ height: 280 }}><Bar data={barData} options={chartOpts} /></div>
          </div>
          <div style={{ background: 'var(--bg-white)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>Xu Hướng</h3>
            <div style={{ height: 280 }}><Line data={lineData} options={chartOpts} /></div>
          </div>
        </div>

        {/* FUNNEL & KPI SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: isManager ? '1fr 2fr' : '1fr', gap: 20, marginBottom: 24 }}>
          {/* Funnel */}
          <div style={{ background: 'var(--bg-white)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>Phễu Bán Hàng</h3>
            <div className="funnel-container">
              {dealStages.map((stage) => {
                const count = filteredFunnelDeals.filter(d => d.stageId === stage.id).length;
                const widthPct = (count / maxDeals) * 100;
                return (
                  <div key={stage.id} className="funnel-row" title={`Giai đoạn: ${stage.title} - ${count} thương vụ`}>
                    <div className="funnel-label">{stage.title}</div>
                    <div className="funnel-bar-wrapper">
                      <div className="funnel-bar" style={{ backgroundColor: stage.color || '#0052cc', width: `${widthPct}%` }}></div>
                    </div>
                    <div className="funnel-count">{count}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Hiển thị số lượng Thương vụ theo giai đoạn
            </div>
          </div>

          {/* KPI Table (Manager Only) */}
          {isManager && (
            <div style={{ background: 'var(--bg-white)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Xếp Hạng Nhân Viên & Tiến Độ KPI</h3>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" placeholder="Tìm kiếm nhân sự..." value={kpiSearch} onChange={e => setKpiSearch(e.target.value)} style={{ width: '220px', padding: '8px 12px 8px 32px', fontSize: '13px' }}/>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b778c' }} />
                </div>
              </div>
              
              <div className="table-responsive">
                <table className="kpi-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', padding: 12, borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Nhân Viên {getSortIcon('name')}</div>
                      </th>
                      <th onClick={() => requestSort('dealsCount')} style={{ cursor: 'pointer', padding: 12, borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Hợp Đồng {getSortIcon('dealsCount')}</div>
                      </th>
                      <th onClick={() => requestSort('kpi.target')} style={{ cursor: 'pointer', padding: 12, borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Chỉ tiêu {getSortIcon('kpi.target')}</div>
                      </th>
                      <th onClick={() => requestSort('kpi.current')} style={{ cursor: 'pointer', padding: 12, borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Đạt được {getSortIcon('kpi.current')}</div>
                      </th>
                      <th onClick={() => requestSort('progress')} style={{ cursor: 'pointer', padding: 12, borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Tiến độ {getSortIcon('progress')}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedKpiData.map((emp, i) => {
                      const progress = emp.kpi.target > 0 ? Math.min((emp.kpi.current / emp.kpi.target) * 100, 100) : 0;
                      return (
                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {i === 0 && <span style={{ fontSize: 16 }}>🥇</span>}
                            {i === 1 && <span style={{ fontSize: 16 }}>🥈</span>}
                            {i === 2 && <span style={{ fontSize: 16 }}>🥉</span>}
                            {i > 2 && <span style={{ width: 16 }}></span>}
                            <img src={emp.avatar} alt={emp.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            <div>
                              <strong style={{ color: 'var(--text-main)', fontSize: 14 }}>{emp.name}</strong>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.role}</div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{emp.dealsCount}</td>
                          <td style={{ padding: '12px' }}>{formatShort(emp.kpi.target)}</td>
                          <td style={{ padding: '12px', color: '#36b37e', fontWeight: 700 }}>{formatCurrency(emp.kpi.current)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: progress >= 100 ? '#36b37e' : '#0052cc', width: `${progress}%` }}></div>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', width: 40 }}>{progress.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAndSortedKpiData.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#8c98a9' }}>Không có dữ liệu.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

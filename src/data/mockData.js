export const employees = [
  { id: "EMP001", name: "Hùng", role: "Manager", avatar: "https://i.pravatar.cc/150?img=11", kpi: { target: 20000000000, current: 0 } },
  { id: "EMP002", name: "Dung", role: "Sale", avatar: "https://i.pravatar.cc/150?img=5", kpi: { target: 500000000, current: 0 } },
  { id: "EMP003", name: "My", role: "Sale", avatar: "https://i.pravatar.cc/150?img=9", kpi: { target: 15000000000, current: 14799990000 } },
  { id: "EMP004", name: "Tân", role: "Sale", avatar: "https://i.pravatar.cc/150?img=12", kpi: { target: 1000000000, current: 574000000 } },
  { id: "EMP005", name: "Nam", role: "Sale", avatar: "https://i.pravatar.cc/150?img=14", kpi: { target: 500000000, current: 285000000 } },
  { id: "EMP006", name: "Nghĩa Trần", role: "Sale", avatar: "https://i.pravatar.cc/150?img=15", kpi: { target: 1500000000, current: 1225000000 } },
  { id: "EMP007", name: "Khang", role: "Sale", avatar: "https://i.pravatar.cc/150?img=33", kpi: { target: 500000000, current: 345000000 } }
];

export const stages = [
  { id: "stage-1", title: "Xác Định Khách Hàng" },
  { id: "stage-2", title: "Tiếp Cận Khách Hàng" },
  { id: "stage-3", title: "Demo Sản Phẩm" },
  { id: "stage-4", title: "Gửi Báo Giá" },
  { id: "stage-5", title: "Đàm Phán Giá" },
  { id: "stage-6", title: "Chốt Hợp Đồng" }
];

export const dealsData = [
  // Cột 1: Xác Định Khách Hàng
  { id: "d1", title: "Hoàng Tuấn Anh | ElecLink", company: "Hoàng Tuấn Anh | ElecLink", value: 0, agentId: "EMP001", stageId: "stage-1", tags: ["#FF5630", "#FFAB00", "#36B37E"] },
  { id: "d2", title: "Lê Quang Hưng | MegaBank", company: "Không có mô tả", value: 0, agentId: "EMP002", stageId: "stage-1", tags: [] },
  { id: "d3", title: "Base Wework | Hãng hàng không Vietjet Air", company: "Đặng Minh Khoa", value: 13000000000, agentId: "EMP003", stageId: "stage-1", tags: [] },
  { id: "d4", title: "[Webform Lead] Base CRM | Anh Minh Team Leader", company: "Không có mô tả", value: 311200000, agentId: "EMP003", stageId: "stage-1", tags: [] },
  { id: "d5", title: "Base HRM | Lotte Việt Nam | Chị Quỳnh Chi HRM", company: "Nguyễn Quỳnh Chi", value: 78000000, agentId: "EMP004", stageId: "stage-1", tags: ["#0052CC", "#FF5630", "#FFAB00"] },
  { id: "d6", title: "Base E-hiring | Ngân hàng BIDV", company: "Đỗ Minh Giang", value: 100000000, agentId: "EMP005", stageId: "stage-1", tags: [] },
  
  // Cột 2: Tiếp Cận Khách Hàng
  { id: "d7", title: "Base Wework | Tổng Công ty Xây dựng Viettel Construction", company: "Trần Hữu Giang", value: 113000000, agentId: "EMP005", stageId: "stage-2", tags: [] },
  { id: "d8", title: "Base Service | VPBank | Chị Ngọc Hà CMO", company: "Hoàng Ngọc Hà", value: 310000000, agentId: "EMP004", stageId: "stage-2", tags: [] },
  { id: "d9", title: "Base XSpace | Anh Bình | FPT Corp", company: "Trần Quang Lan", value: 310000000, agentId: "EMP003", stageId: "stage-2", tags: ["#FF5630", "#36B37E", "#0052CC"] },
  { id: "d10", title: "Base CRM | Microsoft Việt Nam", company: "Hồ Anh Minh", value: 130000000, agentId: "EMP004", stageId: "stage-2", tags: [] },
  { id: "d11", title: "Employee Happiness | Tập đoàn Đá quý DOJI", company: "Phạm Trọng Nam", value: 149990000, agentId: "EMP003", stageId: "stage-2", tags: [] },

  // Cột 3: Demo Sản Phẩm
  { id: "d12", title: "ACME Bank | Đỗ Minh Sơn | Quản lý dự án", company: "Đỗ Minh Sơn", value: 25000000, agentId: "EMP006", stageId: "stage-3", tags: [] },
  { id: "d13", title: "Base CRM | Hãng Hàng không Quốc gia Vietnam Airlines", company: "Hoàng Minh Khoa", value: 13000000000, agentId: "EMP003", stageId: "stage-3", tags: [] },
  { id: "d14", title: "Base HRM | Tập đoàn Hòa Phát", company: "Đặng Quang Yến", value: 31900000, agentId: "EMP003", stageId: "stage-3", tags: ["#36B37E", "#0052CC"] },

  // Cột 4: Gửi Báo Giá
  { id: "d15", title: "Base HRM | Chi nhánh hoá chất ĐG HCM | Lâm Thị Bảo Uyên", company: "Lâm Thị Bảo Uyên", value: 72000000, agentId: "EMP005", stageId: "stage-4", tags: [] },
  { id: "d16", title: "Base One | Anh Hưng | Công ty TNHH ACME", company: "Nguyễn Cao Hưng", value: 600000000, agentId: "EMP006", stageId: "stage-4", tags: [] },
  { id: "d17", title: "Anh Hưng | Công ty TNHH ACME", company: "Lê Quang Sơn", value: 600000000, agentId: "EMP006", stageId: "stage-4", tags: [] },
  { id: "d18", title: "Base CRM | Masan Group | Anh Minh CEO", company: "Hồ Anh Minh", value: 78000000, agentId: "EMP004", stageId: "stage-4", tags: [] },
  { id: "d19", title: "B3 | Base Workflow | Công ty TNHH SX - TM DG Group", company: "Nguyễn Phúc Nguyên", value: 221000000, agentId: "EMP007", stageId: "stage-4", tags: ["#FFAB00", "#FF5630", "#36B37E", "#0052CC"] },
  { id: "d20", title: "B3 | Base Service | Hoá Chất Đức Giang", company: "Nguyễn Thị Tuyết Ngân", value: 124000000, agentId: "EMP007", stageId: "stage-4", tags: [] },

  // Cột 5: Đàm Phán Giá
  { id: "d21", title: "Base CRM | Tổng công ty PVI", company: "Trần Quang Lan", value: 130000000, agentId: "EMP003", stageId: "stage-5", tags: [] },
  { id: "d22", title: "Base Finance+ | Công ty Chứng khoán SSI", company: "Vũ Minh Anh", value: 688000000, agentId: "EMP003", stageId: "stage-5", tags: [] },
  { id: "d23", title: "Base XSpace | Tổng Công ty Novaland | Anh Dũng Giám đốc", company: "Bùi Anh Dũng", value: 500000000, agentId: "EMP004", stageId: "stage-5", tags: [] },

  // Cột 6: Chốt Hợp Đồng
  { id: "d24", title: "Base E-Hiring | Techcombank chi nhánh Hà Nội | Anh Sơn", company: "Nguyễn Quỳnh Chi", value: 200000000, agentId: "EMP003", stageId: "stage-6", tags: [] },
  { id: "d25", title: "Digital Workspace | Vingroup - VinCommerce | Lê Minh Khoa", company: "Trần Văn Oanh", value: 100000000, agentId: "EMP003", stageId: "stage-6", tags: [] },
  { id: "d26", title: "Base Finance | Sabeco Vietnam | Nguyễn Dương", company: "Phạm Trọng Nam", value: 86000000, agentId: "EMP004", stageId: "stage-6", tags: ["#36B37E", "#FF5630"] }
];

export const initialCustomers = [];
export const campaigns = [];
export const deals = [];

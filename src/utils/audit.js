import { api } from '../api';

export const logAction = async (user, action, entity, entityId, details, isSensitive = false) => {
  try {
    const timestamp = new Date().toISOString();
    
    // 1. Lưu log vào Database
    await api.post('/auditLogs', {
      id: `LOG_${Date.now()}`,
      user: user.name,
      role: user.role,
      action,
      entity,
      entityId,
      details,
      timestamp
    });

    // 2. Nếu là hành động nhạy cảm (như Xóa), gửi Alert và Email cho Admin
    if (isSensitive) {
      // Gửi Notification
      await api.post('/notifications', {
        id: `ALERT_${Date.now()}`,
        type: 'ALERT',
        message: `⚠️ Cảnh báo: ${user.name} vừa thực hiện hành động xóa trên ${entity} (${details}).`,
        timestamp,
        isRead: false
      });

      // Gửi Email tới Admin
      await api.post('/emails', {
        id: `EMAIL_ALERT_${Date.now()}`,
        sender: 'Hệ thống Bảo mật',
        subject: `[CẢNH BÁO BẢO MẬT] Hành động xóa dữ liệu bởi ${user.name}`,
        snippet: `Vào lúc ${new Date(timestamp).toLocaleString('vi-VN')}, tài khoản ${user.name} (${user.role}) đã xóa dữ liệu thuộc về ${entity}...`,
        date: new Date(timestamp).toLocaleString('vi-VN'),
        isNew: true,
        status: 'received'
      });
    }
  } catch (error) {
    console.error("Lỗi khi ghi Log hệ thống:", error);
  }
};

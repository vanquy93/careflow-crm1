import axios from 'axios';

// Tự động nhận diện IP của máy chủ hiện tại
// Nếu nhân viên truy cập qua 192.168.1.50, nó sẽ gọi API đến 192.168.1.50:3001
// Lấy IP server, xử lý trường hợp chạy Desktop App (file:// -> rỗng)
let SERVER_IP = window.location.hostname;
if (!SERVER_IP || SERVER_IP === '') {
  SERVER_IP = 'localhost';
}

const API_URL = `http://${SERVER_IP}:3001`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

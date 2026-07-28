import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let jsonServerProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

function startBackend() {
  const userDataPath = app.getPath('userData');
  const targetDbPath = path.join(userDataPath, 'db.json');
  
  // Copy db.json vào thư mục người dùng (AppData) nếu chưa có để đảm bảo quyền ghi
  if (!fs.existsSync(targetDbPath)) {
    const defaultDbPath = path.join(app.getAppPath(), 'server', 'db.json');
    if (fs.existsSync(defaultDbPath)) {
      fs.copyFileSync(defaultDbPath, targetDbPath);
      console.log('Đã copy db.json khởi tạo vào:', targetDbPath);
    }
  } else {
    console.log('Sử dụng db.json hiện tại tại:', targetDbPath);
  }

  // Khởi động json-server
  const jsonServerBin = path.join(app.getAppPath(), 'node_modules', 'json-server', 'lib', 'bin.js');
  
  jsonServerProcess = fork(jsonServerBin, [targetDbPath, '--port', '3001', '--host', '0.0.0.0'], {
    env: { ...process.env },
    stdio: 'pipe'
  });

  jsonServerProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  jsonServerProcess.stderr.on('data', (data) => console.error(`Backend Err: ${data}`));
}

app.whenReady().then(() => {
  startBackend();
  // Chờ 1 giây để đảm bảo Backend đã khởi động xong rồi mới bật UI
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (jsonServerProcess) {
    jsonServerProcess.kill();
  }
});

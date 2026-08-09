import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import {
  RoutingRule,
  AutomationConfig,
  TransferLog,
  ActiveTransfer,
  ConnectionStatus,
  ServerStats,
  FileCategory,
  SharedOutboxFile,
} from './src/types';

const app = express();
const PORT = 3000;

// Enable CORS for cross-device LAN / WAN / mobile connections
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-session-token, x-device-name');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: Auto-detect LAN IP address
const getLanIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
  return '192.168.1.105';
};

// Default Base Storage Path & Shared Outbox
const BASE_STORAGE = path.join(process.cwd(), 'storage');
const SHARED_OUTBOX_DIR = path.join(BASE_STORAGE, 'shared_outbox');

// Helper to ensure directory exists
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirExists(BASE_STORAGE);
ensureDirExists(SHARED_OUTBOX_DIR);

// Initial Default Routing Rules
let routingRules: RoutingRule[] = [
  {
    id: 'rule-video',
    category: 'video',
    name: 'Video',
    extensions: ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv'],
    targetPath: 'D:/Media/Videos',
    description: 'Tự động chuyển các file video vào thư mục giải trí Video',
    isDefault: true,
  },
  {
    id: 'rule-photo',
    category: 'photo',
    name: 'Hình ảnh',
    extensions: ['.jpg', '.jpeg', '.png', '.heic', '.raw', '.webp', '.gif', '.svg'],
    targetPath: 'D:/Media/Photos',
    description: 'Chuyển hình ảnh & ảnh chụp điện thoại vào thư mục Photos',
    isDefault: true,
  },
  {
    id: 'rule-code',
    category: 'code',
    name: 'Mã nguồn',
    extensions: ['.py', '.html', '.cpp', '.json', '.zip', '.js', '.ts', '.rs', '.java', '.css', '.rar'],
    targetPath: 'E:/Projects/SourceCode',
    description: 'Lưu trữ source code và file nén dự án',
    isDefault: true,
  },
  {
    id: 'rule-document',
    category: 'document',
    name: 'Tài liệu',
    extensions: ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.md'],
    targetPath: 'C:/Users/Documents',
    description: 'Chuyển file báo cáo, hợp đồng, văn bản làm việc',
    isDefault: true,
  },
  {
    id: 'rule-other',
    category: 'other',
    name: 'Khác (Unsorted)',
    extensions: ['*'],
    targetPath: 'C:/Downloads/QR_Unsorted',
    description: 'Các định dạng chưa thiết lập sẽ vào thư mục chờ phân loại',
    isDefault: true,
  },
];

// Default Automation Config
let automationConfig: AutomationConfig = {
  autoUnzip: true,
  smartRename: true,
  junkFilter: true,
  desktopNotifications: true,
  soundAlerts: true,
};

// Session & State
let currentToken = 'TOKEN_' + Math.random().toString(36).substring(2, 8).toUpperCase();
let connectionStatus: ConnectionStatus = {
  isConnected: false,
  sessionToken: currentToken,
  lanIp: getLanIp(),
  port: PORT,
  transferMode: 'wan', // Default to WAN/Internet Cloud Relay
};

let transferLogs: TransferLog[] = [];
let activeUploads: Map<string, ActiveTransfer> = new Map();
let sharedOutboxFiles: SharedOutboxFile[] = [];
let sseClients: Response[] = [];

// Broadcast event to all connected PC SSE clients safely
const broadcastSSE = (eventType: string, data: any) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter((client) => {
    try {
      if (client.writableEnded || client.destroyed) return false;
      client.write(payload);
      return true;
    } catch (err) {
      return false;
    }
  });
};

// Helper: Junk File Filter
const isJunkFile = (filename: string): boolean => {
  const lower = filename.toLowerCase();
  const junkNames = ['.ds_store', 'thumbs.db', 'desktop.ini', '.localized'];
  if (junkNames.includes(lower)) return true;
  if (lower.startsWith('._') || lower.startsWith('~$')) return true;
  return false;
};

// Helper: Extension Matching & Category Router
const routeFile = (filename: string): { category: FileCategory; targetPath: string } => {
  const ext = path.extname(filename).toLowerCase();
  
  for (const rule of routingRules) {
    if (rule.category === 'other') continue;
    if (rule.extensions.some((e) => e.toLowerCase() === ext)) {
      return { category: rule.category, targetPath: rule.targetPath };
    }
  }

  const defaultRule = routingRules.find((r) => r.category === 'other');
  return {
    category: 'other',
    targetPath: defaultRule ? defaultRule.targetPath : 'C:/Downloads/QR_Unsorted',
  };
};

// Map virtual/custom target path to local storage folder safely
const getPhysicalPathForTarget = (targetPath: string, filename: string): string => {
  const cleanCategoryName = targetPath
    .replace(/^[A-Z]:\//i, '')
    .replace(/[\\/]/g, '_');
  const dir = path.join(BASE_STORAGE, cleanCategoryName);
  ensureDirExists(dir);
  return path.join(dir, filename);
};

// Get Public Wan Base URL safely
const getWanBaseUrl = (req?: Request): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (req && req.headers && req.headers.host) {
    let protocol = 'https';
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (forwardedProto) {
      protocol = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto.split(',')[0].trim();
    } else if (req.protocol) {
      protocol = req.protocol;
    }
    return `${protocol}://${req.headers.host}`;
  }
  return `http://${connectionStatus.lanIp}:${PORT}`;
};

// Multer storage in temp memory/disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

/* ========================================================================= */
/*                              API ROUTES                                   */
/* ========================================================================= */

// 1. SSE for Real-time PC Dashboard Updates
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial state
  res.write(
    `event: init\ndata: ${JSON.stringify({
      connectionStatus: {
        ...connectionStatus,
        wanUrl: getWanBaseUrl(req),
      },
      automationConfig,
      routingRules,
      transferLogs,
      sharedOutboxFiles,
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// 2. Get Connection & Session Status
app.get('/api/status', (req: Request, res: Response) => {
  const wanUrl = getWanBaseUrl(req);
  res.json({
    status: {
      ...connectionStatus,
      wanUrl,
    },
    config: automationConfig,
    rules: routingRules,
    stats: {
      totalFiles: transferLogs.length,
      totalBytes: transferLogs.reduce((acc, l) => acc + l.size, 0),
      todayFiles: transferLogs.length,
      todayBytes: transferLogs.reduce((acc, l) => acc + l.size, 0),
      activeUploadsCount: activeUploads.size,
    } as ServerStats,
  });
});

// Switch Network Transfer Mode (LAN vs WAN)
app.post('/api/network-mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode === 'lan' || mode === 'wan') {
    connectionStatus.transferMode = mode;
    broadcastSSE('connection_changed', {
      ...connectionStatus,
      wanUrl: getWanBaseUrl(req),
    });
    return res.json({ success: true, mode });
  }
  res.status(400).json({ error: 'Invalid mode. Use "lan" or "wan".' });
});

// 3. Generate QR Code Image or Data URL (Supports WAN / Internet Cloud Mode)
app.get('/api/qrcode', async (req: Request, res: Response) => {
  try {
    const mode = (req.query.mode as string) || connectionStatus.transferMode || 'wan';
    let appUrl = '';

    if (mode === 'wan') {
      appUrl = getWanBaseUrl(req);
    } else {
      appUrl = `http://${connectionStatus.lanIp}:${PORT}`;
    }

    const targetUrl = `${appUrl}?token=${connectionStatus.sessionToken}&mode=mobile&net=${mode}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: mode === 'wan' ? '#1e1b4b' : '#0f172a',
        light: '#ffffff',
      },
    });
    res.json({ qrDataUrl, targetUrl, token: connectionStatus.sessionToken, mode });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// 4. Mobile Device Ping / Heartbeat
app.post('/api/mobile/ping', (req: Request, res: Response) => {
  const { token, deviceName } = req.body;
  const clientToken = token || req.headers['x-session-token'];

  connectionStatus.isConnected = true;
  connectionStatus.deviceName = deviceName || connectionStatus.deviceName || 'Thiết bị máy con';
  connectionStatus.connectedAt = new Date().toISOString();

  broadcastSSE('connection_changed', {
    ...connectionStatus,
    wanUrl: getWanBaseUrl(req),
  });

  res.json({
    success: true,
    sessionToken: connectionStatus.sessionToken,
    message: 'Kết nối thành công với Máy Chủ PC',
  });
});

// 5. Refresh Session Token
app.post('/api/token/refresh', (req: Request, res: Response) => {
  currentToken = 'TOKEN_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  connectionStatus.sessionToken = currentToken;
  connectionStatus.isConnected = false;
  connectionStatus.deviceName = undefined;

  broadcastSSE('connection_changed', {
    ...connectionStatus,
    wanUrl: getWanBaseUrl(req),
  });
  res.json({ success: true, token: currentToken });
});

// 6. Update Routing Rules
app.get('/api/rules', (req: Request, res: Response) => {
  res.json(routingRules);
});

app.post('/api/rules', (req: Request, res: Response) => {
  const { rules } = req.body;
  if (Array.isArray(rules)) {
    routingRules = rules;
    broadcastSSE('rules_updated', routingRules);
    return res.json({ success: true, rules: routingRules });
  }
  res.status(400).json({ error: 'Invalid rules array' });
});

// 7. Update Automation Settings
app.get('/api/config', (req: Request, res: Response) => {
  res.json(automationConfig);
});

app.post('/api/config', (req: Request, res: Response) => {
  automationConfig = { ...automationConfig, ...req.body };
  broadcastSSE('config_updated', automationConfig);
  res.json({ success: true, config: automationConfig });
});

// 8. File Transfer Endpoint (Mobile -> PC over WAN / Internet / LAN)
app.post('/api/upload', upload.array('files'), async (req: Request, res: Response) => {
  const token = (req.headers['x-session-token'] as string) || req.body.token || req.query.token;

  // Sync connection state on upload
  connectionStatus.isConnected = true;
  const deviceName = (req.headers['x-device-name'] as string) || req.body.deviceName || connectionStatus.deviceName || 'Thiết bị máy con';
  connectionStatus.deviceName = deviceName;

  broadcastSSE('connection_changed', {
    ...connectionStatus,
    wanUrl: getWanBaseUrl(req),
  });

  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Không tìm thấy file gửi lên.' });
  }

  const results: TransferLog[] = [];

  for (const file of files) {
    const originalName = file.originalname;
    const fileSize = file.size;
    const fileExt = path.extname(originalName).toLowerCase();

    // Junk Filter check
    if (automationConfig.junkFilter && isJunkFile(originalName)) {
      const junkLog: TransferLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        filename: originalName,
        originalName,
        extension: fileExt,
        size: fileSize,
        category: 'other',
        targetPath: 'Bị bỏ qua (Lọc file rác OS)',
        fullSavedPath: '[Ignored]',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        status: 'filtered',
        deviceName,
      };
      transferLogs.unshift(junkLog);
      results.push(junkLog);
      broadcastSSE('file_processed', junkLog);
      continue;
    }

    // Determine target routing folder
    const { category, targetPath } = routeFile(originalName);

    // Smart Renaming logic
    let finalFilename = originalName;
    let isRenamed = false;

    let targetPhysicalPath = getPhysicalPathForTarget(targetPath, finalFilename);

    if (automationConfig.smartRename && fs.existsSync(targetPhysicalPath)) {
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const dateSuffix = new Date()
        .toISOString()
        .replace(/[-T:]/g, '')
        .slice(0, 13); // e.g. 20260808_1935
      finalFilename = `${nameWithoutExt}_${dateSuffix}${ext}`;
      targetPhysicalPath = getPhysicalPathForTarget(targetPath, finalFilename);
      isRenamed = true;
    }

    // Save File
    try {
      fs.writeFileSync(targetPhysicalPath, file.buffer);

      let status: TransferLog['status'] = isRenamed ? 'renamed' : 'completed';
      let unzippedFilesList: string[] = [];

      // Auto-Unzip feature for .zip files
      if (automationConfig.autoUnzip && fileExt === '.zip') {
        try {
          const zip = await JSZip.loadAsync(file.buffer);
          const unzipDir = targetPhysicalPath + '_extracted';
          ensureDirExists(unzipDir);

          const zipEntries = Object.keys(zip.files);
          for (const filename of zipEntries) {
            const entry = zip.files[filename];
            if (!entry.dir) {
              const content = await entry.async('nodebuffer');
              const destFile = path.join(unzipDir, path.basename(filename));
              fs.writeFileSync(destFile, content);
              unzippedFilesList.push(path.basename(filename));
            }
          }
          status = 'unzipped';
        } catch (zipErr: any) {
          console.error('Auto-Unzip error:', zipErr);
        }
      }

      // Calculate speed
      const speedMbps = +(Math.random() * 25 + 35).toFixed(1); // Realistic transfer speed simulate

      const log: TransferLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        filename: finalFilename,
        originalName,
        extension: fileExt,
        size: fileSize,
        category,
        targetPath,
        fullSavedPath: targetPhysicalPath,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        status,
        speedMbps,
        unzippedFiles: unzippedFilesList.length > 0 ? unzippedFilesList : undefined,
        deviceName,
      };

      transferLogs.unshift(log);
      results.push(log);
      broadcastSSE('file_processed', log);
    } catch (saveErr: any) {
      const errLog: TransferLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        filename: originalName,
        originalName,
        extension: fileExt,
        size: fileSize,
        category,
        targetPath,
        fullSavedPath: '',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        status: 'failed',
        error: saveErr.message || 'Lỗi ghi file vào thư mục đích',
        deviceName,
      };
      transferLogs.unshift(errLog);
      results.push(errLog);
      broadcastSSE('file_processed', errLog);
    }
  }

  res.json({
    success: true,
    message: `Đã nhận và tự động phân loại ${results.length} file qua Internet/LAN!`,
    results,
  });
});

/* ========================================================================= */
/*                   TWO-WAY INTERNET TRANSFER (PC OUTBOX)                    */
/* ========================================================================= */

// Get files shared from PC Outbox to Mobile devices
app.get('/api/shared-files', (req: Request, res: Response) => {
  res.json(sharedOutboxFiles);
});

// PC User uploads files to Shared Outbox for Mobile/Remote devices to download
app.post('/api/pc/share-upload', upload.array('files'), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Không tìm thấy file để chia sẻ.' });
  }

  const addedFiles: SharedOutboxFile[] = [];

  files.forEach((file) => {
    const id = 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const savePath = path.join(SHARED_OUTBOX_DIR, `${id}_${file.originalname}`);
    fs.writeFileSync(savePath, file.buffer);

    const { category } = routeFile(file.originalname);

    const sharedItem: SharedOutboxFile = {
      id,
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      category,
      createdAt: new Date().toLocaleTimeString('vi-VN'),
      downloadCount: 0,
    };

    sharedOutboxFiles.unshift(sharedItem);
    addedFiles.push(sharedItem);
  });

  broadcastSSE('shared_files_updated', sharedOutboxFiles);

  res.json({
    success: true,
    message: `Đã đưa ${addedFiles.length} file vào Kho Chia Sẻ Outbox!`,
    files: addedFiles,
  });
});

// Download shared file from PC Outbox to Mobile/Remote device
app.get('/api/download-shared/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const item = sharedOutboxFiles.find((f) => f.id === fileId);

  if (!item) {
    return res.status(404).send('File không tồn tại hoặc đã bị gỡ bỏ.');
  }

  const filePath = path.join(SHARED_OUTBOX_DIR, `${item.id}_${item.originalName}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File trên server PC đã bị xóa.');
  }

  item.downloadCount += 1;
  broadcastSSE('shared_files_updated', sharedOutboxFiles);

  res.download(filePath, item.originalName);
});

// Delete file from Shared Outbox
app.delete('/api/shared-files/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const itemIndex = sharedOutboxFiles.findIndex((f) => f.id === fileId);

  if (itemIndex !== -1) {
    const item = sharedOutboxFiles[itemIndex];
    const filePath = path.join(SHARED_OUTBOX_DIR, `${item.id}_${item.originalName}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    sharedOutboxFiles.splice(itemIndex, 1);
    broadcastSSE('shared_files_updated', sharedOutboxFiles);
  }

  res.json({ success: true, files: sharedOutboxFiles });
});

// 9. Get Transfer History Logs
app.get('/api/logs', (req: Request, res: Response) => {
  res.json(transferLogs);
});

// Clear Logs
app.delete('/api/logs', (req: Request, res: Response) => {
  transferLogs = [];
  broadcastSSE('logs_cleared', {});
  res.json({ success: true, message: 'Đã xóa nhật ký truyền tải.' });
});

// 10. Inspect Physical Storage Files (Virtual Folder Viewer)
app.get('/api/storage/files', (req: Request, res: Response) => {
  try {
    const categories = fs.readdirSync(BASE_STORAGE);
    const result: Record<string, { name: string; size: number; path: string; modified: string }[]> = {};

    categories.forEach((catFolder) => {
      const catPath = path.join(BASE_STORAGE, catFolder);
      if (fs.statSync(catPath).isDirectory()) {
        const files = fs.readdirSync(catPath).map((f) => {
          const filePath = path.join(catPath, f);
          const stat = fs.statSync(filePath);
          return {
            name: f,
            size: stat.size,
            path: filePath,
            modified: stat.mtime.toLocaleString('vi-VN'),
          };
        });
        result[catFolder] = files;
      }
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Express API Error Handler (prevents API errors from falling through to Vite HTML/405)
app.use('/api', (err: any, req: Request, res: Response, next: any) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Lỗi xử lý API' });
});

// Express API 404 Fallback (prevents unhandled /api/* requests from falling through to Vite SPA index.html)
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} không tồn tại` });
});

/* ========================================================================= */
/*                          VITE & STATIC SERVING                            */
/* ========================================================================= */

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QR Auto-File Router running on http://localhost:${PORT}`);
  });
}

start();

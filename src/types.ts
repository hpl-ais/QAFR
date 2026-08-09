export type FileCategory = 'video' | 'photo' | 'code' | 'document' | 'other';

export interface RoutingRule {
  id: string;
  category: FileCategory;
  name: string;
  extensions: string[];
  targetPath: string;
  description: string;
  isDefault?: boolean;
}

export interface AutomationConfig {
  autoUnzip: boolean;
  smartRename: boolean;
  junkFilter: boolean;
  desktopNotifications: boolean;
  soundAlerts: boolean;
}

export interface TransferLog {
  id: string;
  filename: string;
  originalName: string;
  extension: string;
  size: number;
  category: FileCategory;
  targetPath: string;
  fullSavedPath: string;
  timestamp: string;
  status: 'completed' | 'unzipped' | 'renamed' | 'filtered' | 'failed';
  speedMbps?: number;
  error?: string;
  unzippedFiles?: string[];
  deviceName?: string;
}

export interface ActiveTransfer {
  fileId: string;
  filename: string;
  size: number;
  uploadedBytes: number;
  progressPercent: number;
  speedMbps: number;
  category: FileCategory;
  targetPath: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface ConnectionStatus {
  isConnected: boolean;
  deviceName?: string;
  deviceIp?: string;
  connectedAt?: string;
  sessionToken: string;
  lanIp: string;
  port: number;
  transferMode: 'lan' | 'wan';
  wanUrl?: string;
}

export interface ServerStats {
  totalFiles: number;
  totalBytes: number;
  todayFiles: number;
  todayBytes: number;
  activeUploadsCount: number;
}

export interface SharedOutboxFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  category: FileCategory;
  createdAt: string;
  downloadCount: number;
}

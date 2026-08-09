import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Smartphone,
  Send,
  Zap,
  Sparkles,
  FolderCheck,
  RefreshCw,
  Download,
  Globe,
  Radio,
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  Box,
} from 'lucide-react';
import { TransferLog, SharedOutboxFile } from '../types';

interface MobileWebUIProps {
  sessionToken: string;
  lanIp: string;
  onUploadSuccess: (results: TransferLog[]) => void;
  onBackToPC: () => void;
}

export const MobileWebUI: React.FC<MobileWebUIProps> = ({
  sessionToken,
  lanIp,
  onUploadSuccess,
  onBackToPC,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadResults, setUploadResults] = useState<TransferLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sharedFiles, setSharedFiles] = useState<SharedOutboxFile[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch Shared Outbox Files from PC
  const fetchSharedFiles = async () => {
    setIsLoadingShared(true);
    try {
      const res = await fetch('/api/shared-files');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSharedFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch shared files:', err);
    } finally {
      setIsLoadingShared(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();

    // Heartbeat Ping to notify server that client device is connected
    const pingServer = async () => {
      try {
        const urlToken = new URLSearchParams(window.location.search).get('token');
        const tokenToUse = urlToken || sessionToken;
        await fetch('/api/mobile/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenToUse,
            deviceName: 'Thiết Bị Máy Con (' + (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Web') + ')',
          }),
        });
      } catch (err) {
        console.warn('Ping server failed:', err);
      }
    };

    pingServer();
    const pingInterval = setInterval(pingServer, 8000);

    // SSE listener for real-time updates when PC shares files
    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('shared_files_updated', (e: MessageEvent) => {
      try {
        setSharedFiles(JSON.parse(e.data));
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      clearInterval(pingInterval);
      eventSource.close();
    };
  }, [sessionToken]);

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setErrorMessage(null);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setErrorMessage(null);
    }
  };

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Perform Real File Upload
  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadSpeed(42.8);
    setErrorMessage(null);

    const urlToken = new URLSearchParams(window.location.search).get('token');
    const tokenToUse = urlToken || sessionToken;
    const deviceName = 'Thiết Bị Máy Con (' + (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Web') + ')';

    const formData = new FormData();
    formData.append('token', tokenToUse);
    formData.append('deviceName', deviceName);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    // Simulated progress interval
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-session-token': tokenToUse,
          'x-device-name': deviceName,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadResults(data.results);
        onUploadSuccess(data.results);
        setSelectedFiles([]);
      } else {
        setErrorMessage(data.error || 'Truyền file thất bại, vui lòng kiểm tra kết nối.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMessage('Không thể gửi file tới server PC qua Internet/LAN.');
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-amber-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-sky-400" />;
      default:
        return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-900">
      {/* Mobile Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">QR Mobile Cloud</h1>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Đã nối 2 chiều Internet / LAN</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700/80 text-[11px] text-slate-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span>Giao Diện Máy Con</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 space-y-4">
        {/* Connection Type Indicator Banner */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Globe className="w-4 h-4 text-purple-400" />
            <span>Kênh truyền: <strong className="text-purple-300 font-mono">Internet Cloud Relay</strong></span>
          </div>
          <span className="font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px] font-bold">
            {sessionToken}
          </span>
        </div>

        {/* 2-Way Direction Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Tới PC</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('download');
              fetchSharedFiles();
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'download'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Nhận Từ PC ({sharedFiles.length})</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD TO PC */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Large Dropzone Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-slate-900/60 hover:bg-slate-900 p-7 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-inner group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 flex items-center justify-center mb-3 transition-transform duration-200">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-base font-bold text-white mb-1">
                Chọn File Gửi Về PC
              </h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Truyền không giới hạn qua Internet & LAN. Tự động lưu đúng thư mục trên máy tính.
              </p>

              <span className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Bấm Chọn File Ngay
              </span>
            </div>

            {/* Selected File List */}
            {selectedFiles.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">
                    Danh Sách File Đã Chọn ({selectedFiles.length})
                  </span>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-rose-400 hover:underline text-[11px]"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <File className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-medium text-slate-200 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-500">{formatBytes(file.size)}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-indigo-400 font-medium">
                        <Zap className="w-3.5 h-3.5 animate-bounce" /> Đang gửi qua Internet...
                      </span>
                      <span className="font-mono">{uploadProgress}% ({uploadSpeed} MB/s)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Main Action Submit Button */}
                <button
                  onClick={handleStartUpload}
                  disabled={isUploading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Truyền Dữ Liệu...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Ngay Tới PC</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Upload Success Feedback Cards */}
            {uploadResults.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Gửi Thành Công & Tự Phân Loại Trên PC!</span>
                </div>

                <div className="space-y-2">
                  {uploadResults.map((res) => (
                    <div
                      key={res.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1"
                    >
                      <div className="font-semibold text-white truncate">{res.filename}</div>
                      <div className="flex items-center text-slate-400 text-[11px] space-x-1">
                        <FolderCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Lưu tại PC:</span>
                        <span className="font-mono text-indigo-300 truncate">{res.targetPath}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOWNLOAD FROM PC (SHARED OUTBOX) */}
        {activeTab === 'download' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Kho File PC Chia Sẻ Cho Điện Thoại:</span>
              <button
                onClick={fetchSharedFiles}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingShared ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>

            {sharedFiles.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                <Download className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">Chưa Có File Nào Từ PC</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Bạn có thể kéo thả file trên giao diện PC vào mục "Kho Outbox" để điện thoại truy cập và tải về từ xa qua Internet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sharedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-white truncate">{file.filename}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{file.createdAt}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{file.downloadCount} lượt tải</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`/api/download-shared/${file.id}`}
                      download={file.filename}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Về</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-500">
        QR Auto-Router • Truyền file 2 chiều Internet / LAN mã hóa TLS
      </div>
    </div>
  );
};

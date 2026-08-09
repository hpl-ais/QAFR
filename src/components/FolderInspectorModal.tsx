import React, { useEffect, useState } from 'react';
import {
  FolderOpen,
  X,
  File,
  Video,
  Image,
  Code,
  FileText,
  FolderArchive,
  Download,
  Trash2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

interface FolderInspectorModalProps {
  initialFolder?: string;
  onClose: () => void;
}

interface FileItem {
  name: string;
  size: number;
  path: string;
  modified: string;
}

export const FolderInspectorModal: React.FC<FolderInspectorModalProps> = ({
  initialFolder,
  onClose,
}) => {
  const [storageData, setStorageData] = useState<Record<string, FileItem[]>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/storage/files');
      const data = await res.json();
      setStorageData(data);

      const keys = Object.keys(data);
      if (keys.length > 0) {
        if (initialFolder) {
          const match = keys.find((k) =>
            initialFolder.toLowerCase().includes(k.toLowerCase())
          );
          setActiveTab(match || keys[0]);
        } else {
          setActiveTab(keys[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch storage files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [initialFolder]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Xem Thư Mục Đích Trên PC (Storage Vault)</h3>
              <p className="text-xs text-slate-400">
                Kiểm tra các file thực tế đã được QR Auto-Router phân loại vào đĩa cứng.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons for Categories */}
        <div className="flex items-center space-x-2 my-4 overflow-x-auto border-b border-slate-800/80 pb-2">
          {Object.keys(storageData).map((catName) => {
            const count = storageData[catName]?.length || 0;
            const isActive = activeTab === catName;

            return (
              <button
                key={catName}
                onClick={() => setActiveTab(catName)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{catName}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={fetchFiles}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white ml-auto"
            title="Tải lại thư mục"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Files Table Container */}
        <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <span>Đang đọc ổ đĩa...</span>
            </div>
          ) : !activeTab || !storageData[activeTab] || storageData[activeTab].length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <FolderArchive className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-xs font-medium text-slate-400">Thư mục này hiện đang trống</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Các file đúng định dạng khi truyền từ điện thoại sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {storageData[activeTab].map((file, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 hover:bg-slate-900 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate mr-2">
                    <File className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{file.modified}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Đã Lưu On Disk
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800 mt-2">
          <span>Đường dẫn vật lý: <code className="text-slate-400 font-mono">./storage/{activeTab}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

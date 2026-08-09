import React from 'react';
import {
  Bell,
  X,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  FolderArchive,
  AlertCircle,
} from 'lucide-react';
import { TransferLog } from '../types';

interface DesktopNotificationToastProps {
  log: TransferLog;
  onClose: () => void;
  onOpenFolder: (path: string) => void;
}

export const DesktopNotificationToast: React.FC<DesktopNotificationToastProps> = ({
  log,
  onClose,
  onOpenFolder,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 rounded-2xl p-4 shadow-2xl max-w-sm w-full animate-slide-up backdrop-blur-md">
      <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-xs block">
              Thông Báo Nhận File Mới!
            </span>
            <span className="text-[10px] text-slate-400">Tự động phân loại LAN</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{log.filename}</span>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div>Đã lưu tự động vào:</div>
          <div className="font-mono text-indigo-300 truncate mt-0.5">{log.targetPath}</div>
        </div>

        {log.status === 'unzipped' && (
          <div className="text-[10px] text-purple-300 flex items-center gap-1 bg-purple-950/40 p-1.5 rounded border border-purple-800/40">
            <FolderArchive className="w-3.5 h-3.5" /> Đã tự động giải nén ZIP
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end space-x-2">
        <button
          onClick={() => {
            onOpenFolder(log.targetPath);
            onClose();
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1"
        >
          <FolderOpen className="w-3.5 h-3.5" /> Mở Thư Mục
        </button>
      </div>
    </div>
  );
};

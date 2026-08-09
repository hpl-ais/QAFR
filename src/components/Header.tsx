import React from 'react';
import {
  QrCode,
  Smartphone,
  Monitor,
  FolderOpen,
  RefreshCw,
  Sparkles,
  Wifi,
  Copy,
  Check,
} from 'lucide-react';

interface HeaderProps {
  viewMode?: 'desktop' | 'mobile';
  setViewMode?: (mode: 'desktop' | 'mobile') => void;
  isConnected: boolean;
  deviceName?: string;
  lanUrl: string;
  onOpenStorageModal: () => void;
  onRefreshToken: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  isConnected,
  deviceName,
  lanUrl,
  onOpenStorageModal,
  onRefreshToken,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* App Title & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                QR Auto-Router
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> LAN Speed
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Truyền & Tự động phân loại file qua LAN bằng quét mã QR
            </p>
          </div>
        </div>

        {/* Center Connection Indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </div>
          <span className="text-slate-300 font-medium">
            {isConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                Đã kết nối: <strong className="text-white">{deviceName || 'Mobile'}</strong>
              </span>
            ) : (
              <span className="text-amber-300">Đang chờ quét QR...</span>
            )}
          </span>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* LAN URL Copy Button */}
          <button
            onClick={handleCopy}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
            title="Sao chép liên kết LAN"
          >
            <Wifi className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-slate-200 truncate max-w-[140px]">{lanUrl}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Refresh Token */}
          <button
            onClick={onRefreshToken}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Đổi mã QR & Token kết nối"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Storage File Explorer */}
          <button
            onClick={onOpenStorageModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Xem Thư Mục Đích</span>
          </button>
        </div>
      </div>
    </header>
  );
};

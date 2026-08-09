import React from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Wifi,
  Globe,
  Lock,
  Radio,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface QRCodeSectionProps {
  status: ConnectionStatus;
  qrDataUrl: string;
  targetUrl: string;
  onRefreshToken: () => void;
  onOpenMobileView?: () => void;
  onSwitchMode: (mode: 'lan' | 'wan') => void;
}

export const QRCodeSection: React.FC<QRCodeSectionProps> = ({
  status,
  qrDataUrl,
  targetUrl,
  onRefreshToken,
  onOpenMobileView,
  onSwitchMode,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isWan = status.transferMode === 'wan';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isWan ? 'bg-purple-500/15' : 'bg-indigo-500/10'
        }`}
      ></div>

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Kết Nối QR Mã Hóa</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Token Safe
          </span>
        </div>

        {/* Network Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <button
            onClick={() => onSwitchMode('wan')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isWan
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 Internet (WAN)</span>
          </button>

          <button
            onClick={() => onSwitchMode('lan')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              !isWan
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>🏠 Wifi Nội Bộ (LAN)</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          {isWan
            ? '🌐 Quét mã từ bất kỳ đâu qua 4G/5G/Internet toàn cầu. Không cần chung Wifi!'
            : '🏠 Truyền cực nhanh trong mạng Wifi nội bộ (cùng Router LAN).'}
        </p>

        {/* Center QR Display Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative group shadow-inner">
          {/* Mode Indicator Badge */}
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            {isWan ? (
              <>
                <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                <span className="text-purple-300 font-semibold">Chế Độ Cloud Relay (Toàn Cầu)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-300 font-semibold">Chế Độ Mạng LAN Nội Bộ</span>
              </>
            )}
          </div>

          {qrDataUrl ? (
            <div className="bg-white p-3 rounded-lg shadow-md relative">
              <img
                src={qrDataUrl}
                alt="Transfer QR Code"
                className="w-48 h-48 object-contain transition-transform group-hover:scale-105 duration-300"
              />
            </div>
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <span className="text-xs">Đang tạo mã QR...</span>
            </div>
          )}

          {/* Connection Status Badge under QR */}
          <div className="mt-4 w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    status.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    status.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="font-medium text-slate-300 truncate max-w-[170px]">
                {status.isConnected
                  ? `Đã nối: ${status.deviceName || 'Điện thoại'}`
                  : 'Sẵn sàng truyền 2 chiều...'}
              </span>
            </div>
            <button
              onClick={onRefreshToken}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Đổi QR
            </button>
          </div>
        </div>
      </div>

      {/* Connection Info & Links */}
      <div className="mt-5 space-y-3">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              {isWan ? <Globe className="w-3.5 h-3.5 text-purple-400" /> : <Wifi className="w-3.5 h-3.5 text-indigo-400" />}
              {isWan ? 'Địa Chỉ Internet (WAN):' : 'Địa Chỉ IP LAN:'}
            </span>
            <span className="font-mono text-slate-200 font-medium truncate max-w-[150px]">
              {isWan ? status.wanUrl || 'https://cloud-relay.app' : `${status.lanIp}:${status.port}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Token Xác Thực:
            </span>
            <span className="font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 text-[11px] font-semibold">
              {status.sessionToken}
            </span>
          </div>
        </div>

        <div>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="text-white font-bold">Đã Copy Link Kết Nối!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>{isWan ? 'Copy Link Truy Cập Cho Máy Con (Internet)' : 'Copy Link Truy Cập Cho Máy Con (LAN)'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

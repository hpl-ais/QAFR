import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FileText,
  Video,
  Image,
  Code,
  FolderArchive,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  FolderOpen,
  Zap,
  ArrowDownToLine,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TransferLog, ServerStats, FileCategory } from '../types';

interface TransferBoardProps {
  logs: TransferLog[];
  stats: ServerStats;
  onClearLogs: () => void;
  onOpenFolderInspect: (path: string) => void;
}

export const TransferBoard: React.FC<TransferBoardProps> = ({
  logs,
  stats,
  onClearLogs,
  onOpenFolderInspect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<TransferLog | null>(null);

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetPath.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get Icon by Category
  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'photo':
        return <Image className="w-4 h-4 text-pink-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <FolderArchive className="w-4 h-4 text-amber-400" />;
    }
  };

  // Get Status Badge
  const getStatusBadge = (log: TransferLog) => {
    switch (log.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Thành công
          </span>
        );
      case 'unzipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FolderArchive className="w-3 h-3" /> Đã giải nén Zip
          </span>
        );
      case 'renamed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" /> Trùng tên (Smart Rename)
          </span>
        );
      case 'filtered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trash2 className="w-3 h-3" /> Lọc file rác OS
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Thất bại
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full">
      {/* Real-time Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tổng File Nhận</span>
            <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.totalFiles}</div>
          <span className="text-[11px] text-slate-500">Tự động phân loại</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dung Lượng LAN</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">{formatBytes(stats.totalBytes)}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Băng thông 5GHz (~50 MB/s)</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Trạng Thái Nhận</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {stats.activeUploadsCount > 0 ? (
              <span className="text-purple-400 animate-pulse">Đang truyền...</span>
            ) : (
              <span className="text-slate-300">Sẵn sàng</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">Stream dữ liệu song song</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Quy Tắc Đã Khớp</span>
            <CheckCircle2 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-white">100%</div>
          <span className="text-[11px] text-slate-500">Video, Photo, Code, Docs</span>
        </div>
      </div>

      {/* Main Board Header & Filters */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Nhật Ký Nhận File Real-time</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {logs.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Xóa lịch sử truyền file"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Xóa Nhật Ký</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên file hoặc thư mục đích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
            >
              <option value="all">Tất cả nhóm file</option>
              <option value="video">🎥 Video</option>
              <option value="photo">🖼️ Hình ảnh</option>
              <option value="code">💻 Mã nguồn</option>
              <option value="document">📄 Tài liệu</option>
              <option value="other">📦 Khác (Unsorted)</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
              <FolderArchive className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-400">Chưa có file nào được truyền</p>
              <p className="text-xs text-slate-600 mt-1">
                Quét mã QR trên điện thoại hoặc thử nghiệm ở tab Mobile để truyền file đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-medium sticky top-0 backdrop-blur-xs z-10">
                  <tr>
                    <th className="py-2.5 px-3">Tên File</th>
                    <th className="py-2.5 px-3">Dung Lượng</th>
                    <th className="py-2.5 px-3">Thư Mục Mục Tiêu PC</th>
                    <th className="py-2.5 px-3">Trạng Thái Router</th>
                    <th className="py-2.5 px-3 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetails(log)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div className="truncate max-w-[180px] sm:max-w-[220px]">
                            <div className="font-medium text-slate-100 truncate">{log.filename}</div>
                            {log.filename !== log.originalName && (
                              <div className="text-[10px] text-slate-500 truncate">
                                Gốc: {log.originalName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-400">{formatBytes(log.size)}</td>

                      <td className="py-2.5 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFolderInspect(log.targetPath);
                          }}
                          className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 group/btn"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                          <span className="truncate max-w-[180px]">{log.targetPath}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3">{getStatusBadge(log)}</td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetails(log);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Xem chi tiết router"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Drawer / Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(selectedLogForDetails.category)}
                <h3 className="font-bold text-white text-base">Thông Tin Routing File</h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md bg-slate-800"
              >
                Đóng ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Tên File Đã Lưu:</span>
                  <span className="font-semibold text-white">{selectedLogForDetails.filename}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dung Lượng:</span>
                  <span className="font-mono text-slate-200">
                    {formatBytes(selectedLogForDetails.size)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Thời Gian Nhận:</span>
                  <span className="text-slate-200">{selectedLogForDetails.timestamp}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Thiết Bị Gửi:</span>
                  <span className="text-indigo-300 font-medium">{selectedLogForDetails.deviceName || 'Mobile'}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-slate-400 font-medium mb-1">Thư Mục Mục Tiêu Phân Loại:</div>
                <div className="font-mono bg-indigo-500/10 text-indigo-300 p-2 rounded border border-indigo-500/20 break-all">
                  {selectedLogForDetails.targetPath}
                </div>
              </div>

              {selectedLogForDetails.unzippedFiles && (
                <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/50 space-y-1.5">
                  <div className="text-purple-300 font-medium flex items-center gap-1">
                    <FolderArchive className="w-4 h-4 text-purple-400" /> Các file đã bung nén tự động:
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {selectedLogForDetails.unzippedFiles.map((f, i) => (
                      <li key={i} className="font-mono text-[11px] truncate">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLogForDetails.error && (
                <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-800/50 text-rose-300">
                  <strong>Lỗi Ghi File:</strong> {selectedLogForDetails.error}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  onOpenFolderInspect(selectedLogForDetails.targetPath);
                  setSelectedLogForDetails(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4" /> Mở Trong Explorer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

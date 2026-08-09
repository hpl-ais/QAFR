import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Share2,
  Trash2,
  Download,
  File,
  Sparkles,
  Check,
  RefreshCw,
  Copy,
  Globe,
  Radio,
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  Box,
} from 'lucide-react';
import { SharedOutboxFile } from '../types';

interface SharedOutboxSectionProps {
  sharedFiles: SharedOutboxFile[];
  onRefresh: () => void;
  targetUrl: string;
}

export const SharedOutboxSection: React.FC<SharedOutboxSectionProps> = ({
  sharedFiles,
  onRefresh,
  targetUrl,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/pc/share-upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to share file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSharedFile = async (id: string) => {
    try {
      const res = await fetch(`/api/shared-files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete shared file:', err);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              Kho File PC Chia Sẻ Ra Ngoài (Internet Outbox)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Thả file tại đây để điện thoại di động hoặc các thiết bị ngoài có thể truy cập và tải về từ xa.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyShareLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã Copy Link Truy Cập</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link Tải Cho Điện Thoại</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>Thêm File Chia Sẻ</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Drop Target Box if empty */}
      {sharedFiles.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-950/50 hover:bg-slate-950 p-8 rounded-xl text-center cursor-pointer transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Chưa có file nào trong Kho Chia Sẻ
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bấm vào đây hoặc chọn "Thêm File Chia Sẻ" để tải file từ máy tính PC lên. Điện thoại mở Web QR sẽ thấy ngay và tải được về qua Internet!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getCategoryIcon(file.category)}
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-xs text-white truncate" title={file.filename}>
                      {file.filename}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{formatBytes(file.size)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSharedFile(file.id)}
                  title="Xóa khỏi Kho Chia Sẻ"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80 text-slate-400">
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-indigo-400" />
                  <strong className="text-slate-200">{file.downloadCount}</strong> lượt tải
                </span>
                <span className="text-slate-500">{file.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

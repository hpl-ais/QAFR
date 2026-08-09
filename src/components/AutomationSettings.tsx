import React from 'react';
import {
  FolderArchive,
  Sparkles,
  Filter,
  Bell,
  Volume2,
  CheckCircle2,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { AutomationConfig } from '../types';

interface AutomationSettingsProps {
  config: AutomationConfig;
  onUpdateConfig: (updated: Partial<AutomationConfig>) => void;
  onTestNotification: () => void;
}

export const AutomationSettings: React.FC<AutomationSettingsProps> = ({
  config,
  onUpdateConfig,
  onTestNotification,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Tính Năng Tự Động Hóa (Automation Engine)</h2>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          Tải Siêu Tốc & Tự Xử Lý
        </span>
      </div>

      {/* Grid of Automation Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Auto-Unzip */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-0.5">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                Auto-Unzip (Bung nén tự động)
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động bung nén file <code className="text-indigo-300">.zip</code> hoặc <code className="text-indigo-300">.rar</code> trực tiếp vào thư mục đích.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
            <input
              type="checkbox"
              checked={config.autoUnzip}
              onChange={(e) => onUpdateConfig({ autoUnzip: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* 2. Smart Renaming */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                Smart Renaming (Trùng tên)
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Thêm timestamp <code className="text-indigo-300">file_20260808_1935.ext</code> tránh ghi đè làm mất dữ liệu cũ.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
            <input
              type="checkbox"
              checked={config.smartRename}
              onChange={(e) => onUpdateConfig({ smartRename: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* 3. Junk Filter */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                Lọc File Rác Hệ Điều Hành
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự bỏ qua các file rác OS tạm <code className="text-indigo-300">.DS_Store</code>, <code className="text-indigo-300">thumbs.db</code>, <code className="text-indigo-300">._*</code>.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
            <input
              type="checkbox"
              checked={config.junkFilter}
              onChange={(e) => onUpdateConfig({ junkFilter: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* 4. Desktop Notifications */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                Thông Báo Popup Desktop
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hiển thị popup thông báo góc màn hình kèm nút ấn nhanh <strong className="text-slate-200">"Mở Thư Mục"</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.desktopNotifications}
                onChange={(e) =>
                  onUpdateConfig({ desktopNotifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>

            <button
              onClick={onTestNotification}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Thử Thông Báo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

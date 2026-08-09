import React, { useState } from 'react';
import {
  FolderTree,
  Video,
  Image,
  Code,
  FileText,
  FolderArchive,
  Edit2,
  Check,
  Plus,
  RotateCcw,
  Save,
  HelpCircle,
  Tag,
  Sparkles,
} from 'lucide-react';
import { RoutingRule, FileCategory } from '../types';

interface RoutingRulesTableProps {
  rules: RoutingRule[];
  onSaveRules: (updatedRules: RoutingRule[]) => void;
}

export const RoutingRulesTable: React.FC<RoutingRulesTableProps> = ({
  rules,
  onSaveRules,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [localRules, setLocalRules] = useState<RoutingRule[]>(rules);
  const [newExtInput, setNewExtInput] = useState<{ [ruleId: string]: string }>({});

  // Sync state if props update
  React.useEffect(() => {
    setLocalRules(rules);
  }, [rules]);

  // Handle path change
  const handlePathChange = (id: string, newPath: string) => {
    setLocalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, targetPath: newPath } : r))
    );
  };

  // Add extension pill
  const handleAddExtension = (ruleId: string) => {
    const extToAdd = newExtInput[ruleId]?.trim().toLowerCase();
    if (!extToAdd) return;

    const formattedExt = extToAdd.startsWith('.') ? extToAdd : `.${extToAdd}`;

    setLocalRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId && !r.extensions.includes(formattedExt)) {
          return { ...r, extensions: [...r.extensions, formattedExt] };
        }
        return r;
      })
    );

    setNewExtInput((prev) => ({ ...prev, [ruleId]: '' }));
  };

  // Remove extension pill
  const handleRemoveExtension = (ruleId: string, extToRemove: string) => {
    setLocalRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            extensions: r.extensions.filter((e) => e !== extToRemove),
          };
        }
        return r;
      })
    );
  };

  // Category Icon helper
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

  // Category Badge Colors
  const getCategoryColor = (category: FileCategory) => {
    switch (category) {
      case 'video':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'photo':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      case 'code':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'document':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
  };

  const handleSave = () => {
    onSaveRules(localRules);
    setEditingRuleId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Bảng Cấu Hình Phân Loại (Routing Rules)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              Tự Động Mạng Cục Bộ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập đường dẫn thư mục đích trên máy tính cho từng định dạng đuôi file.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nhóm File</th>
                <th className="py-3 px-4">Đuôi File Hỗ Trợ (Extensions)</th>
                <th className="py-3 px-4">Thư Mục Đích Trực Tiếp Trên PC</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {localRules.map((rule) => {
                const isEditing = editingRuleId === rule.id;

                return (
                  <tr key={rule.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Category Column */}
                    <td className="py-3.5 px-4 font-medium align-top">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg border ${getCategoryColor(rule.category)}`}>
                          {getCategoryIcon(rule.category)}
                        </div>
                        <div>
                          <div className="text-slate-100 font-semibold">{rule.name}</div>
                          <div className="text-[11px] text-slate-500">{rule.description}</div>
                        </div>
                      </div>
                    </td>

                    {/* Extension Pills Column */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {rule.extensions.map((ext) => (
                          <span
                            key={ext}
                            className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 group"
                          >
                            <span>{ext}</span>
                            {isEditing && rule.category !== 'other' && (
                              <button
                                onClick={() => handleRemoveExtension(rule.id, ext)}
                                className="text-slate-500 hover:text-rose-400 ml-0.5"
                                title="Xóa extension này"
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Add Extension Input in Edit Mode */}
                      {isEditing && rule.category !== 'other' && (
                        <div className="flex items-center space-x-1.5 mt-1">
                          <input
                            type="text"
                            placeholder="+Thêm đuôi (vd: .m4v)"
                            value={newExtInput[rule.id] || ''}
                            onChange={(e) =>
                              setNewExtInput({ ...newExtInput, [rule.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddExtension(rule.id);
                            }}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32"
                          />
                          <button
                            onClick={() => handleAddExtension(rule.id)}
                            className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded text-[11px] font-medium"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Target Folder Path Column */}
                    <td className="py-3.5 px-4 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={rule.targetPath}
                          onChange={(e) => handlePathChange(rule.id, e.target.value)}
                          className="w-full font-mono bg-slate-900 border border-indigo-500/80 rounded-lg px-3 py-1.5 text-xs text-indigo-300 focus:outline-none shadow-sm"
                        />
                      ) : (
                        <div className="font-mono bg-slate-900/90 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs truncate max-w-sm">
                          {rule.targetPath}
                        </div>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right align-top">
                      {isEditing ? (
                        <button
                          onClick={() => setEditingRuleId(null)}
                          className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Xong
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingRuleId(rule.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Sửa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { QRCodeSection } from './components/QRCodeSection';
import { TransferBoard } from './components/TransferBoard';
import { RoutingRulesTable } from './components/RoutingRulesTable';
import { AutomationSettings } from './components/AutomationSettings';
import { MobileWebUI } from './components/MobileWebUI';
import { FolderInspectorModal } from './components/FolderInspectorModal';
import { DesktopNotificationToast } from './components/DesktopNotificationToast';
import { SharedOutboxSection } from './components/SharedOutboxSection';
import {
  ConnectionStatus,
  AutomationConfig,
  RoutingRule,
  TransferLog,
  ServerStats,
  SharedOutboxFile,
} from './types';

export default function App() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    sessionToken: 'LOADING...',
    lanIp: '192.168.1.105',
    port: 3000,
    transferMode: 'wan',
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    autoUnzip: true,
    smartRename: true,
    junkFilter: true,
    desktopNotifications: true,
    soundAlerts: true,
  });
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [transferLogs, setTransferLogs] = useState<TransferLog[]>([]);
  const [sharedOutboxFiles, setSharedOutboxFiles] = useState<SharedOutboxFile[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats>({
    totalFiles: 0,
    totalBytes: 0,
    todayFiles: 0,
    todayBytes: 0,
    activeUploadsCount: 0,
  });

  const [inspectorFolder, setInspectorFolder] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<TransferLog | null>(null);

  // Play audio alert
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Web Audio API not allowed without user interaction first');
    }
  };

  // Fetch initial QR & Status
  const fetchQRAndStatus = async () => {
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      setConnectionStatus(statusData.status);
      setAutomationConfig(statusData.config);
      setRoutingRules(statusData.rules);
      if (statusData.stats) setServerStats(statusData.stats);

      const qrRes = await fetch('/api/qrcode');
      const qrData = await qrRes.json();
      setQrDataUrl(qrData.qrDataUrl);
      setTargetUrl(qrData.targetUrl);

      fetchSharedOutbox();
    } catch (err) {
      console.error('Failed to fetch QR / Status:', err);
    }
  };

  // Fetch Shared Outbox Files
  const fetchSharedOutbox = async () => {
    try {
      const res = await fetch('/api/shared-files');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSharedOutboxFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch shared files:', err);
    }
  };

  // Switch Network Mode (LAN vs WAN)
  const handleSwitchNetworkMode = async (mode: 'lan' | 'wan') => {
    try {
      const res = await fetch('/api/network-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        fetchQRAndStatus();
      }
    } catch (err) {
      console.error('Failed to switch network mode:', err);
    }
  };

  // Refresh token
  const handleRefreshToken = async () => {
    try {
      await fetch('/api/token/refresh', { method: 'POST' });
      fetchQRAndStatus();
    } catch (err) {
      console.error('Failed to refresh token:', err);
    }
  };

  // Update routing rules on server
  const handleSaveRules = async (updatedRules: RoutingRule[]) => {
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutingRules(data.rules);
      }
    } catch (err) {
      console.error('Failed to save rules:', err);
    }
  };

  // Update automation config on server
  const handleUpdateConfig = async (updatedConfig: Partial<AutomationConfig>) => {
    const newConfig = { ...automationConfig, ...updatedConfig };
    setAutomationConfig(newConfig);

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  // Clear logs on server
  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setTransferLogs([]);
      setServerStats((prev) => ({ ...prev, totalFiles: 0, totalBytes: 0 }));
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Setup Real-time SSE Connection
  useEffect(() => {
    fetchQRAndStatus();

    // Check if opened with mode=mobile or token parameter (client device / máy con)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'mobile' || urlParams.has('token')) {
      setViewMode('mobile');
    }

    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('init', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.connectionStatus) setConnectionStatus(data.connectionStatus);
      if (data.automationConfig) setAutomationConfig(data.automationConfig);
      if (data.routingRules) setRoutingRules(data.routingRules);
      if (data.transferLogs) setTransferLogs(data.transferLogs);
      if (data.sharedOutboxFiles) setSharedOutboxFiles(data.sharedOutboxFiles);
    });

    eventSource.addEventListener('connection_changed', (e: MessageEvent) => {
      const status = JSON.parse(e.data);
      setConnectionStatus(status);
    });

    eventSource.addEventListener('file_processed', (e: MessageEvent) => {
      const log = JSON.parse(e.data) as TransferLog;
      setTransferLogs((prev) => [log, ...prev]);

      setServerStats((prev) => ({
        ...prev,
        totalFiles: prev.totalFiles + 1,
        totalBytes: prev.totalBytes + log.size,
      }));

      // Trigger desktop toast notification if enabled
      if (automationConfig.desktopNotifications && log.status !== 'filtered') {
        setActiveToast(log);
      }

      if (automationConfig.soundAlerts) {
        playAlertSound();
      }
    });

    eventSource.addEventListener('shared_files_updated', (e: MessageEvent) => {
      setSharedOutboxFiles(JSON.parse(e.data));
    });

    eventSource.addEventListener('rules_updated', (e: MessageEvent) => {
      setRoutingRules(JSON.parse(e.data));
    });

    eventSource.addEventListener('config_updated', (e: MessageEvent) => {
      setAutomationConfig(JSON.parse(e.data));
    });

    eventSource.addEventListener('logs_cleared', () => {
      setTransferLogs([]);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleOpenFolderInspect = (path: string) => {
    setInspectorFolder(path);
    setIsInspectorOpen(true);
  };

  const handleTestNotification = () => {
    const dummyLog: TransferLog = {
      id: 'test_' + Date.now(),
      filename: 'sample_video_2026.mp4',
      originalName: 'sample_video_2026.mp4',
      extension: '.mp4',
      size: 45800000,
      category: 'video',
      targetPath: 'D:/Media/Videos',
      fullSavedPath: 'D:/Media/Videos/sample_video_2026.mp4',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      status: 'completed',
    };
    setActiveToast(dummyLog);
    playAlertSound();
  };

  // Render Mobile View directly if requested
  if (viewMode === 'mobile') {
    return (
      <MobileWebUI
        sessionToken={connectionStatus.sessionToken}
        lanIp={connectionStatus.lanIp}
        onUploadSuccess={() => {
          // Upload processed
        }}
        onBackToPC={() => setViewMode('desktop')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        isConnected={connectionStatus.isConnected}
        deviceName={connectionStatus.deviceName}
        lanUrl={targetUrl || `http://${connectionStatus.lanIp}:${connectionStatus.port}`}
        onOpenStorageModal={() => {
          setInspectorFolder(null);
          setIsInspectorOpen(true);
        }}
        onRefreshToken={handleRefreshToken}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Grid: QR Code & Status + Transfer Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: QR Code Card */}
          <div className="lg:col-span-1">
            <QRCodeSection
              status={connectionStatus}
              qrDataUrl={qrDataUrl}
              targetUrl={targetUrl}
              onRefreshToken={handleRefreshToken}
              onOpenMobileView={() => setViewMode('mobile')}
              onSwitchMode={handleSwitchNetworkMode}
            />
          </div>

          {/* Column 2 & 3: Real-time Transfer Board */}
          <div className="lg:col-span-2">
            <TransferBoard
              logs={transferLogs}
              stats={serverStats}
              onClearLogs={handleClearLogs}
              onOpenFolderInspect={handleOpenFolderInspect}
            />
          </div>
        </div>

        {/* Section 2: Shared Internet Outbox (PC File Sharing to Mobile) */}
        <SharedOutboxSection
          sharedFiles={sharedOutboxFiles}
          onRefresh={fetchSharedOutbox}
          targetUrl={targetUrl}
        />

        {/* Section 3: Routing Rules Table */}
        <RoutingRulesTable rules={routingRules} onSaveRules={handleSaveRules} />

        {/* Section 4: Automation Settings */}
        <AutomationSettings
          config={automationConfig}
          onUpdateConfig={handleUpdateConfig}
          onTestNotification={handleTestNotification}
        />
      </main>

      {/* Modals & Toast Notifications */}
      {isInspectorOpen && (
        <FolderInspectorModal
          initialFolder={inspectorFolder || undefined}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}

      {activeToast && (
        <DesktopNotificationToast
          log={activeToast}
          onClose={() => setActiveToast(null)}
          onOpenFolder={(path) => handleOpenFolderInspect(path)}
        />
      )}

      {/* App Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>🚀 QR Auto-File Router • Truyền file siêu tốc qua Internet & Wifi LAN</div>
          <div className="font-mono text-slate-600">
            Node.js Express + React Vite • Cloud Relay & Local Auto Router 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

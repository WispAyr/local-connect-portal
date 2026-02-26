import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Monitor, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export default function ScreensDashboard() {
  const { client } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    Promise.all([
      api.get(`/modules/screens/config${cid}`),
      api.get(`/modules/screens/status${cid}`).catch(() => ({ status: 'unknown' })),
    ]).then(([cfg, st]) => {
      setConfig(cfg);
      setStatus(st);
    }).finally(() => setLoading(false));
  }, [client]);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  if (!config) {
    return (
      <div className="text-center py-16">
        <Monitor size={48} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Digital Screens</h2>
        <p className="text-gray-500">Screens module not configured for this account. Contact admin to set up.</p>
      </div>
    );
  }

  const portalUrl = config.screens_portal_url || 'https://screens.local-connect.uk';
  const statusIcon = status?.status === 'online' ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Digital Screens</h1>
          <p className="text-gray-500 mt-1">Manage your digital signage content</p>
        </div>
        <a href={`${portalUrl}/#portal`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-black rounded-lg font-medium hover:bg-accent/90 transition-colors">
          Open Screens Portal <ExternalLink size={16} />
        </a>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <Monitor size={20} className="text-cyan-400 mb-3" />
          <div className="text-2xl font-bold">{config.screen_count}</div>
          <div className="text-sm text-gray-500">Active Screens</div>
        </div>
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">{statusIcon}</div>
          <div className="text-lg font-bold capitalize">{status?.status || 'Unknown'}</div>
          <div className="text-sm text-gray-500">Portal Status</div>
        </div>
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <RefreshCw size={20} className="text-gray-500 mb-3" />
          <div className="text-lg font-bold">{config.last_synced ? new Date(config.last_synced).toLocaleDateString() : 'Never'}</div>
          <div className="text-sm text-gray-500">Last Synced</div>
        </div>
      </div>

      {/* Portal preview */}
      <div className="bg-surface-2 border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <h2 className="font-medium">Screens Portal Preview</h2>
          <a href={portalUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">
            {portalUrl} <ExternalLink size={14} />
          </a>
        </div>
        <div className="aspect-video bg-[#07080a] flex items-center justify-center">
          <div className="text-center">
            <Monitor size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Click "Open Screens Portal" to manage your screen content</p>
            <a href={`${portalUrl}/#portal`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors">
              Launch Portal <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

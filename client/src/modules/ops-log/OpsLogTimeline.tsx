import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { ScrollText, Plus, AlertTriangle, Info, Shield, Zap, CheckCircle, Trash2, Edit2 } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  incident: { icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  decision: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  action: { icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
};

export default function OpsLogTimeline() {
  const { client, user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, byType: {} });
  const [form, setForm] = useState({ type: 'info', message: '' });

  const load = () => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/ops-log/entries${cid}`).then(setEntries);
    api.get(`/modules/ops-log/stats${cid}`).then(setStats);
  };
  useEffect(load, [client]);

  const addEntry = async () => {
    if (!form.message.trim()) return;
    await api.post('/modules/ops-log/entries', { client_id: client?.id || 'lc-events', type: form.type, message: form.message, author: user?.name || 'Unknown' });
    setForm({ type: 'info', message: '' });
    load();
  };

  const del = async (id: string) => {
    await fetch(`/api/modules/ops-log/entries/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Ops Log</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} entries</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(stats.byType || {}).map(([type, count]) => {
            const cfg = typeConfig[type] || typeConfig.info;
            return <span key={type} className={`px-2 py-1 rounded text-xs border ${cfg.bg} ${cfg.color}`}>{type}: {count as number}</span>;
          })}
        </div>
      </div>

      {/* Add entry form */}
      <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-5 mb-6">
        <div className="flex gap-3">
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white w-36">
            {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input placeholder="What happened?" value={form.message} onChange={e => setForm({...form, message: e.target.value})} onKeyDown={e => e.key === 'Enter' && addEntry()}
            className="flex-1 bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          <button onClick={addEntry} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/80">
            <Plus size={16} /> Log
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800/50" />
        <div className="space-y-1">
          {entries.map(e => {
            const cfg = typeConfig[e.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={e.id} className="relative pl-14 py-3 group">
                <div className={`absolute left-3.5 top-4 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg} border`}>
                  <Icon size={12} className={cfg.color} />
                </div>
                <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-4 hover:border-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-sm">{e.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{e.author} · {new Date(e.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => del(e.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {entries.length === 0 && <p className="text-center text-gray-500 py-12 pl-14">No log entries yet. Add the first entry above.</p>}
      </div>
    </div>
  );
}

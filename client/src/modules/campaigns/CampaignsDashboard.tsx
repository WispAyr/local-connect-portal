import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Eye, X } from 'lucide-react';

export default function CampaignsDashboard() {
  const { client } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, pendingReviews: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/campaigns${cid}`).then(setCampaigns);
    api.get(`/modules/campaigns/stats${cid}`).then(setStats);
  };
  useEffect(load, [client]);

  const create = async () => {
    await api.post('/modules/campaigns', { ...form, client_id: client?.id || 'lc-events' });
    setShowForm(false); setForm({ name: '', description: '' }); load();
  };

  const statusColors: Record<string, string> = {
    draft: 'text-gray-400 bg-gray-400/10', active: 'text-emerald-400 bg-emerald-400/10',
    paused: 'text-amber-400 bg-amber-400/10', completed: 'text-blue-400 bg-blue-400/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.active} active · {stats.pendingReviews} pending reviews</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="flex justify-between mb-4"><h3 className="text-white font-semibold">New Campaign</h3><button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button></div>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Campaign Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={create} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm">Create</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map(c => (
          <Link key={c.id} to={`/campaigns/${c.id}`} className="bg-surface-2 rounded-xl border border-gray-800/50 p-5 hover:border-gray-700/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-purple-400" />
                <h3 className="text-white font-semibold">{c.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[c.status] || ''}`}>{c.status}</span>
            </div>
            {c.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{c.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {c.pending_reviews > 0 && <span className="text-amber-400">⚠ {c.pending_reviews} pending review{c.pending_reviews > 1 ? 's' : ''}</span>}
              <span>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
        {campaigns.length === 0 && <p className="text-gray-500 col-span-full text-center py-12">No campaigns yet</p>}
      </div>
    </div>
  );
}

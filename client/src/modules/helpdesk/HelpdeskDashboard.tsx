import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import { HelpCircle, Plus, X, AlertTriangle, Clock, CheckCircle, BookOpen } from 'lucide-react';

export default function HelpdeskDashboard() {
  const { client, user } = useAuth();
  const [stats, setStats] = useState<any>({ open: 0, inProgress: 0, total: 0, articles: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'normal', category: '' });

  const load = () => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/helpdesk/stats${cid}`).then(setStats);
    api.get(`/modules/helpdesk/tickets${cid}`).then(setTickets);
  };
  useEffect(load, [client]);

  const create = async () => {
    await api.post('/modules/helpdesk/tickets', { ...form, client_id: client?.id || 'lc-events', created_by: user?.name });
    setShowForm(false); setForm({ subject: '', description: '', priority: 'normal', category: '' }); load();
  };

  const priorityColors: Record<string, string> = {
    low: 'text-gray-400', normal: 'text-blue-400', high: 'text-amber-400', urgent: 'text-red-400',
  };
  const statusColors: Record<string, string> = {
    open: 'text-emerald-400 bg-emerald-400/10', 'in-progress': 'text-blue-400 bg-blue-400/10',
    waiting: 'text-amber-400 bg-amber-400/10', resolved: 'text-gray-400 bg-gray-400/10', closed: 'text-gray-500 bg-gray-500/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Helpdesk</h1>
          <p className="text-gray-500 text-sm mt-1">Support tickets and knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Link to="/helpdesk/kb" className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm"><BookOpen size={16} /> Knowledge Base</Link>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm"><Plus size={16} /> New Ticket</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open', value: stats.open, icon: AlertTriangle, color: 'text-emerald-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-400' },
          { label: 'Total', value: stats.total, icon: HelpCircle, color: 'text-gray-400' },
          { label: 'KB Articles', value: stats.articles, icon: BookOpen, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface-2 rounded-xl p-5 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-2"><s.icon size={20} className={s.color} /><span className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="flex justify-between mb-4"><h3 className="text-white font-semibold">New Ticket</h3><button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white col-span-2" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white col-span-2" />
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
            <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={create} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Submit Ticket</button>
        </div>
      )}

      <div className="bg-surface-2 rounded-xl border border-gray-800/50">
        <div className="divide-y divide-gray-800/50">
          {tickets.map(t => (
            <Link key={t.id} to={`/helpdesk/tickets/${t.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors block">
              <div className="flex items-center gap-4">
                <div className={`w-1 h-8 rounded-full ${t.priority === 'urgent' ? 'bg-red-400' : t.priority === 'high' ? 'bg-amber-400' : t.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-600'}`} />
                <div>
                  <p className="text-white text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-gray-500">{t.created_by} · {new Date(t.created_at).toLocaleDateString()} {t.category ? `· ${t.category}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${statusColors[t.status] || ''}`}>{t.status}</span>
              </div>
            </Link>
          ))}
          {tickets.length === 0 && <p className="p-8 text-center text-gray-500">No tickets yet</p>}
        </div>
      </div>
    </div>
  );
}

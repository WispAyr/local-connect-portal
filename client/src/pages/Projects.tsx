import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { FolderKanban, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400', briefed: 'bg-purple-500/10 text-purple-400',
  'in-progress': 'bg-blue-500/10 text-blue-400', review: 'bg-amber-500/10 text-amber-400',
  revision: 'bg-orange-500/10 text-orange-400', delivered: 'bg-emerald-500/10 text-emerald-400',
  completed: 'bg-green-500/10 text-green-400', archived: 'bg-gray-500/10 text-gray-500',
};

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => { api.get('/projects').then(setProjects); }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'in-progress', 'review', 'delivered', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${filter === s ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-white/5'}`}>
            {s === 'all' ? 'All' : s.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`}
            className="flex items-center justify-between bg-surface-2 border border-gray-800/50 rounded-lg p-4 hover:border-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <FolderKanban size={18} className="text-gray-500" />
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-sm text-gray-500">{p.client_name} · {p.category || 'General'}{p.due_date ? ` · Due ${p.due_date}` : ''}</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status] || 'bg-gray-500/10 text-gray-400'}`}>{p.status}</span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-12">No projects found</p>}
      </div>
    </div>
  );
}

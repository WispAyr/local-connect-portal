import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { FolderKanban, Image, Receipt, Monitor, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const moduleIcons: Record<string, any> = {
  projects: FolderKanban, assets: Image, screens: Monitor,
};

export default function Dashboard() {
  const { user, client } = useAuth();
  const [stats, setStats] = useState({ projects: 0, assets: 0, invoicesDue: 0 });
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    api.get('/projects?status=in-progress').then(p => { setProjects(p.slice(0, 5)); setStats(s => ({ ...s, projects: p.length })); });
    api.get('/assets').then(a => setStats(s => ({ ...s, assets: a.length })));
    api.get('/payments/invoices').then(inv => setStats(s => ({ ...s, invoicesDue: inv.filter((i: any) => i.status === 'sent').length })));
  }, []);

  const modules = client ? JSON.parse(client.modules || '[]') : [];
  const productLines = client ? JSON.parse(client.product_lines || '[]') : [];

  const cards = [
    { label: 'Active Projects', value: stats.projects, icon: FolderKanban, to: '/projects', color: 'text-blue-400' },
    { label: 'Assets', value: stats.assets, icon: Image, to: '/assets', color: 'text-emerald-400' },
    { label: 'Invoices Due', value: stats.invoicesDue, icon: Receipt, to: '/invoices', color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="text-gray-500 mb-8">{client?.name || 'Admin Dashboard'}</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="bg-surface-2 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <c.icon size={20} className={c.color} />
              <ArrowRight size={16} className="text-gray-600" />
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Products / External Links */}
      {modules.includes('screens') && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Products</h2>
          <a href="https://screens.local-connect.uk" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-3 bg-surface-2 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-colors">
            <Monitor size={24} className="text-cyan-400" />
            <div>
              <div className="font-medium">Digital Screens</div>
              <div className="text-sm text-gray-500">Manage your screen content</div>
            </div>
            <ArrowRight size={16} className="text-gray-600 ml-4" />
          </a>
        </div>
      )}

      {/* Recent projects */}
      {projects.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Active Projects</h2>
          <div className="space-y-2">
            {projects.map((p: any) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center justify-between bg-surface-2 border border-gray-800/50 rounded-lg p-4 hover:border-gray-700/50 transition-colors">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">{p.category} · {p.client_name}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

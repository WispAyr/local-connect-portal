import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import { Car, MapPin, Shield, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

export default function ParkingDashboard() {
  const { client } = useAuth();
  const [stats, setStats] = useState<any>({ entriesToday: 0, activePlates: 0, violations: 0, totalSites: 0 });
  const [sites, setSites] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/parking/stats${cid}`).then(setStats);
    api.get(`/modules/parking/sites${cid}`).then(setSites);
    api.get(`/modules/parking/activity${cid}&limit=10`).then(setActivity).catch(() => {
      api.get(`/modules/parking/activity${cid ? cid + '&' : '?'}limit=10`).then(setActivity);
    });
  }, [client]);

  const statCards = [
    { label: 'Entries Today', value: stats.entriesToday, icon: Car, color: 'text-blue-400' },
    { label: 'Active Plates', value: stats.activePlates, icon: Shield, color: 'text-emerald-400' },
    { label: 'Violations', value: stats.violations, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Sites', value: stats.totalSites, icon: MapPin, color: 'text-purple-400' },
  ];

  const typeColors: Record<string, string> = {
    entry: 'text-emerald-400 bg-emerald-400/10',
    exit: 'text-blue-400 bg-blue-400/10',
    violation: 'text-red-400 bg-red-400/10',
    payment: 'text-amber-400 bg-amber-400/10',
    alert: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Car Park Management</h1>
          <p className="text-gray-500 mt-1">Monitor sites, whitelists, and activity</p>
        </div>
        <Link to="/parking/whitelists" className="px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          Manage Whitelists
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map(c => (
          <div key={c.label} className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <c.icon size={20} className={c.color + ' mb-3'} />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sites */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Sites</h2>
          <div className="space-y-2">
            {sites.map(s => (
              <Link key={s.id} to={`/parking/sites/${s.id}`}
                className="flex items-center justify-between bg-surface-2 border border-gray-800/50 rounded-lg p-4 hover:border-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-purple-400" />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.code} · {s.total_spaces} spaces</div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-600" />
              </Link>
            ))}
            {sites.length === 0 && <p className="text-gray-600 text-sm">No sites configured</p>}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</h2>
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-surface-2 border border-gray-800/50 rounded-lg p-3">
                <Activity size={16} className="text-gray-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[a.type] || 'text-gray-400 bg-gray-400/10'}`}>{a.type}</span>
                    <span className="font-mono text-sm">{a.plate || '—'}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.camera} · {new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <p className="text-gray-600 text-sm">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

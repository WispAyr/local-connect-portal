import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import { Radio, Calendar, CheckCircle, AlertTriangle, Wrench, Plus } from 'lucide-react';

export default function RadioDashboard() {
  const { client } = useAuth();
  const [stats, setStats] = useState<any>({ total: 0, available: 0, assigned: 0, maintenance: 0, events: 0 });
  const [radios, setRadios] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/radio/stats${cid}`).then(setStats);
    api.get(`/modules/radio/radios${cid}`).then(setRadios);
    api.get(`/modules/radio/events${cid}`).then(setEvents);
  }, [client]);

  const statCards = [
    { label: 'Total Radios', value: stats.total, icon: Radio, color: 'text-blue-400' },
    { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Assigned', value: stats.assigned, icon: Radio, color: 'text-amber-400' },
    { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-red-400' },
  ];

  const statusColors: Record<string, string> = {
    available: 'text-emerald-400 bg-emerald-400/10',
    assigned: 'text-amber-400 bg-amber-400/10',
    maintenance: 'text-red-400 bg-red-400/10',
    retired: 'text-gray-400 bg-gray-400/10',
    planning: 'text-blue-400 bg-blue-400/10',
    active: 'text-emerald-400 bg-emerald-400/10',
    completed: 'text-gray-400 bg-gray-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Radio Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Fleet overview and event assignments</p>
        </div>
        <div className="flex gap-2">
          <Link to="/radio/inventory" className="btn-primary flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
            <Plus size={16} /> Add Radio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-surface-2 rounded-xl p-5 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={20} className={s.color} />
              <span className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface-2 rounded-xl border border-gray-800/50">
          <div className="p-5 border-b border-gray-800/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Radios</h2>
            <Link to="/radio/inventory" className="text-accent text-sm hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800/50">
            {radios.slice(0, 8).map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{r.callsign || r.serial_number || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{r.make} {r.model} · {r.frequency_band}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status] || 'text-gray-400'}`}>{r.status}</span>
              </div>
            ))}
            {radios.length === 0 && <p className="p-4 text-sm text-gray-500">No radios yet</p>}
          </div>
        </div>

        <div className="bg-surface-2 rounded-xl border border-gray-800/50">
          <div className="p-5 border-b border-gray-800/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Events</h2>
            <Link to="/radio/events" className="text-accent text-sm hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800/50">
            {events.slice(0, 8).map(e => (
              <Link key={e.id} to={`/radio/events/${e.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors block">
                <div>
                  <p className="text-sm text-white font-medium">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.date || 'No date'} · {e.location || 'No location'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[e.status] || 'text-gray-400'}`}>{e.status}</span>
              </Link>
            ))}
            {events.length === 0 && <p className="p-4 text-sm text-gray-500">No events yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

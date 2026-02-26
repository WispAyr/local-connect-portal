import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';
import { Truck, Plus, CheckCircle, MapPin } from 'lucide-react';

export default function CRUDashboard() {
  const { client } = useAuth();
  const [stats, setStats] = useState<any>({ total: 0, available: 0, deployed: 0 });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', registration: '', type: 'van' });

  const load = () => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/cru/stats${cid}`).then(setStats);
    api.get(`/modules/cru/vehicles${cid}`).then(setVehicles);
  };
  useEffect(load, [client]);

  const save = async () => {
    await api.post('/modules/cru/vehicles', { ...form, client_id: client?.id || 'lc-events' });
    setShowForm(false); setForm({ name: '', registration: '', type: 'van' }); load();
  };

  const statusColors: Record<string, string> = {
    available: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    deployed: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    maintenance: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  const typeIcons: Record<string, string> = { van: '🚐', trailer: '🚛', portable: '📦' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">CRU Fleet</h1>
          <p className="text-gray-500 text-sm mt-1">Communications Response Unit vehicles</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Vehicles', value: stats.total, icon: Truck, color: 'text-blue-400' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Deployed', value: stats.deployed, icon: MapPin, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface-2 rounded-xl p-5 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={20} className={s.color} />
              <span className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">New Vehicle</h3>
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Registration" value={form.registration} onChange={e => setForm({...form, registration: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="van">Van</option><option value="trailer">Trailer</option><option value="portable">Portable</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Add Vehicle</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <Link key={v.id} to={`/cru/vehicles/${v.id}`} className="bg-surface-2 rounded-xl border border-gray-800/50 p-5 hover:border-gray-700/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeIcons[v.type] || '🚐'}</span>
                <div>
                  <p className="text-white font-semibold">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.registration || 'No reg'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[v.status] || 'text-gray-400'}`}>{v.status}</span>
            </div>
            <p className="text-xs text-gray-500 capitalize">{v.type}</p>
          </Link>
        ))}
        {vehicles.length === 0 && <p className="text-gray-500 col-span-full text-center py-12">No vehicles yet. Add your first CRU vehicle above.</p>}
      </div>
    </div>
  );
}

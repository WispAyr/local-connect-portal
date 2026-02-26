import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Truck, Plus, Trash2, MapPin, Calendar } from 'lucide-react';

export default function VehicleDetail() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<any>(null);
  const [showCapForm, setShowCapForm] = useState(false);
  const [showDepForm, setShowDepForm] = useState(false);
  const [capForm, setCapForm] = useState({ category: 'comms', name: '', description: '', quantity: 1 });
  const [depForm, setDepForm] = useState({ event_name: '', location: '', deploy_date: '', return_date: '' });

  const load = () => { if (id) api.get(`/modules/cru/vehicles/${id}/full`).then(setVehicle); };
  useEffect(load, [id]);

  const addCap = async () => {
    await api.post(`/modules/cru/vehicles/${id}/capabilities`, capForm);
    setShowCapForm(false); setCapForm({ category: 'comms', name: '', description: '', quantity: 1 }); load();
  };

  const addDep = async () => {
    await api.post('/modules/cru/deployments', { ...depForm, vehicle_id: id });
    setShowDepForm(false); setDepForm({ event_name: '', location: '', deploy_date: '', return_date: '' }); load();
  };

  const delCap = async (capId: string) => {
    await api.get(`/modules/cru/capabilities/${capId}`).catch(() => null);
    // Use DELETE method - workaround: re-fetch
    await fetch(`/api/modules/cru/capabilities/${capId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    load();
  };

  if (!vehicle) return <div className="text-gray-500">Loading...</div>;

  const catColors: Record<string, string> = {
    power: 'text-amber-400 bg-amber-400/10', comms: 'text-blue-400 bg-blue-400/10',
    video: 'text-purple-400 bg-purple-400/10', network: 'text-emerald-400 bg-emerald-400/10',
    infrastructure: 'text-gray-400 bg-gray-400/10',
  };
  const depStatusColors: Record<string, string> = {
    planned: 'text-blue-400 bg-blue-400/10', deployed: 'text-amber-400 bg-amber-400/10', returned: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Truck size={28} className="text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{vehicle.name}</h1>
          <p className="text-gray-500 text-sm">{vehicle.registration || 'No registration'} · {vehicle.type} · <span className="capitalize">{vehicle.status}</span></p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-surface-2 rounded-xl border border-gray-800/50 mb-6">
        <div className="p-5 border-b border-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Capabilities</h2>
          <button onClick={() => setShowCapForm(!showCapForm)} className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs"><Plus size={14} /> Add</button>
        </div>
        {showCapForm && (
          <div className="p-5 border-b border-gray-800/50 bg-surface-1/50">
            <div className="grid grid-cols-4 gap-3">
              <select value={capForm.category} onChange={e => setCapForm({...capForm, category: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
                <option value="power">Power</option><option value="comms">Comms</option><option value="video">Video</option><option value="network">Network</option><option value="infrastructure">Infrastructure</option>
              </select>
              <input placeholder="Name" value={capForm.name} onChange={e => setCapForm({...capForm, name: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
              <input placeholder="Description" value={capForm.description} onChange={e => setCapForm({...capForm, description: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
              <div className="flex gap-2">
                <input type="number" placeholder="Qty" value={capForm.quantity} onChange={e => setCapForm({...capForm, quantity: parseInt(e.target.value) || 1})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white w-20" />
                <button onClick={addCap} className="px-3 py-2 bg-accent text-white rounded-lg text-sm">Add</button>
              </div>
            </div>
          </div>
        )}
        <div className="divide-y divide-gray-800/50">
          {(vehicle.capabilities || []).map((c: any) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs ${catColors[c.category] || ''}`}>{c.category}</span>
                <span className="text-white text-sm">{c.name}</span>
                {c.description && <span className="text-gray-500 text-xs">— {c.description}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">×{c.quantity}</span>
                <button onClick={() => delCap(c.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {(!vehicle.capabilities || vehicle.capabilities.length === 0) && <p className="p-4 text-sm text-gray-500">No capabilities listed</p>}
        </div>
      </div>

      {/* Deployments */}
      <div className="bg-surface-2 rounded-xl border border-gray-800/50">
        <div className="p-5 border-b border-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Deployment History</h2>
          <button onClick={() => setShowDepForm(!showDepForm)} className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs"><Plus size={14} /> Deploy</button>
        </div>
        {showDepForm && (
          <div className="p-5 border-b border-gray-800/50 bg-surface-1/50">
            <div className="grid grid-cols-4 gap-3">
              <input placeholder="Event Name" value={depForm.event_name} onChange={e => setDepForm({...depForm, event_name: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
              <input placeholder="Location" value={depForm.location} onChange={e => setDepForm({...depForm, location: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
              <input type="date" value={depForm.deploy_date} onChange={e => setDepForm({...depForm, deploy_date: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
              <div className="flex gap-2">
                <input type="date" value={depForm.return_date} onChange={e => setDepForm({...depForm, return_date: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white flex-1" />
                <button onClick={addDep} className="px-3 py-2 bg-accent text-white rounded-lg text-sm">Deploy</button>
              </div>
            </div>
          </div>
        )}
        <div className="divide-y divide-gray-800/50">
          {(vehicle.deployments || []).map((d: any) => (
            <div key={d.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-500" />
                <div>
                  <p className="text-white text-sm">{d.event_name}</p>
                  <p className="text-xs text-gray-500">{d.location} · {d.deploy_date} → {d.return_date || 'TBD'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${depStatusColors[d.status] || ''}`}>{d.status}</span>
            </div>
          ))}
          {(!vehicle.deployments || vehicle.deployments.length === 0) && <p className="p-4 text-sm text-gray-500">No deployments yet</p>}
        </div>
      </div>
    </div>
  );
}

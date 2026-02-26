import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Radio, Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function RadioInventory() {
  const { client } = useAuth();
  const [radios, setRadios] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ callsign: '', make: '', model: '', serial_number: '', frequency_band: 'VHF', notes: '' });

  const load = () => {
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/radio/radios${cid}`).then(setRadios);
  };
  useEffect(load, [client]);

  const save = async () => {
    if (editing) {
      await api.put(`/modules/radio/radios/${editing.id}`, { ...form, status: editing.status });
    } else {
      await api.post('/modules/radio/radios', { ...form, client_id: client?.id || 'lc-events' });
    }
    setShowForm(false); setEditing(null);
    setForm({ callsign: '', make: '', model: '', serial_number: '', frequency_band: 'VHF', notes: '' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this radio?')) return;
    await api.post(`/modules/radio/radios/${id}`, {});
    load();
  };

  const startEdit = (r: any) => {
    setEditing(r);
    setForm({ callsign: r.callsign || '', make: r.make || '', model: r.model || '', serial_number: r.serial_number || '', frequency_band: r.frequency_band || 'VHF', notes: r.notes || '' });
    setShowForm(true);
  };

  const statusColors: Record<string, string> = {
    available: 'text-emerald-400 bg-emerald-400/10',
    assigned: 'text-amber-400 bg-amber-400/10',
    maintenance: 'text-red-400 bg-red-400/10',
    retired: 'text-gray-400 bg-gray-400/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Radio Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">{radios.length} radios in fleet</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ callsign: '', make: '', model: '', serial_number: '', frequency_band: 'VHF', notes: '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
          <Plus size={16} /> Add Radio
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">{editing ? 'Edit Radio' : 'New Radio'}</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <input placeholder="Callsign" value={form.callsign} onChange={e => setForm({...form, callsign: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="Serial Number" value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={form.frequency_band} onChange={e => setForm({...form, frequency_band: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="VHF">VHF</option><option value="UHF">UHF</option><option value="HF">HF</option><option value="PMR446">PMR446</option>
            </select>
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={save} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/80">{editing ? 'Update' : 'Add Radio'}</button>
        </div>
      )}

      <div className="bg-surface-2 rounded-xl border border-gray-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800/50 text-gray-500 text-xs uppercase">
            <th className="p-4 text-left">Callsign</th><th className="p-4 text-left">Make/Model</th><th className="p-4 text-left">Serial</th><th className="p-4 text-left">Band</th><th className="p-4 text-left">Status</th><th className="p-4"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {radios.map(r => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="p-4 text-white font-medium">{r.callsign || '—'}</td>
                <td className="p-4 text-gray-400">{r.make} {r.model}</td>
                <td className="p-4 text-gray-400 font-mono text-xs">{r.serial_number}</td>
                <td className="p-4"><span className="text-xs px-2 py-0.5 rounded bg-blue-400/10 text-blue-400">{r.frequency_band}</span></td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status] || ''}`}>{r.status}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(r)} className="text-gray-500 hover:text-white mr-2"><Edit2 size={14} /></button>
                  <button onClick={() => del(r.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {radios.length === 0 && <p className="p-8 text-center text-gray-500">No radios in inventory. Add your first radio above.</p>}
      </div>
    </div>
  );
}

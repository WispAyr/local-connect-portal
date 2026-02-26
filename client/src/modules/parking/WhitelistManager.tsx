import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { ArrowLeft, Search, Plus, Upload, Download, Trash2, X } from 'lucide-react';

export default function WhitelistManager() {
  const { id } = useParams();
  const { client } = useAuth();
  const [whitelists, setWhitelists] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [activeWl, setActiveWl] = useState<string | null>(id || null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ plate: '', name: '', vehicle_make: '', vehicle_color: '', notes: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const cid = client?.id ? `?client_id=${client.id}` : '';

  useEffect(() => {
    api.get(`/modules/parking/whitelists${cid}`).then(wl => {
      setWhitelists(wl);
      if (!activeWl && wl.length > 0) setActiveWl(wl[0].id);
    });
  }, [client]);

  useEffect(() => {
    if (activeWl) {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      api.get(`/modules/parking/whitelists/${activeWl}/entries${q}`).then(setEntries);
    }
  }, [activeWl, search]);

  const addEntry = async () => {
    if (!form.plate || !activeWl) return;
    await api.post(`/modules/parking/whitelists/${activeWl}/entries`, form);
    setForm({ plate: '', name: '', vehicle_make: '', vehicle_color: '', notes: '' });
    setShowAdd(false);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/modules/parking/whitelists/${activeWl}/entries${q}`).then(setEntries);
  };

  const removeEntry = async (entryId: string) => {
    if (!activeWl) return;
    await api.get(`/modules/parking/whitelists/${activeWl}/entries/${entryId}`).catch(() => null);
    // Use fetch directly for DELETE
    const token = localStorage.getItem('token');
    await fetch(`/api/modules/parking/whitelists/${activeWl}/entries/${entryId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const importCSV = () => fileRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWl) return;
    const csv = await file.text();
    await api.post(`/modules/parking/whitelists/${activeWl}/import`, { csv });
    api.get(`/modules/parking/whitelists/${activeWl}/entries`).then(setEntries);
  };

  const exportCSV = () => {
    if (!activeWl) return;
    window.open(`/api/modules/parking/whitelists/${activeWl}/export`, '_blank');
  };

  return (
    <div>
      <Link to="/parking" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Parking
      </Link>

      <h1 className="text-2xl font-bold mb-6">Whitelist Manager</h1>

      {/* Whitelist tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {whitelists.map(w => (
          <button key={w.id} onClick={() => setActiveWl(w.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeWl === w.id ? 'bg-accent text-black font-medium' : 'bg-surface-2 text-gray-400 hover:text-white border border-gray-800/50'}`}>
            {w.name} ({w.entry_count})
          </button>
        ))}
      </div>

      {activeWl && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plates or names..."
                className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-gray-800/50 rounded-lg text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90">
              <Plus size={16} /> Add
            </button>
            <button onClick={importCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-gray-800/50 rounded-lg text-sm text-gray-400 hover:text-white">
              <Upload size={16} /> Import
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-gray-800/50 rounded-lg text-sm text-gray-400 hover:text-white">
              <Download size={16} /> Export
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Add Entry</h3>
                <button onClick={() => setShowAdd(false)}><X size={18} className="text-gray-500" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="Plate *"
                  className="px-3 py-2 bg-[#07080a] border border-gray-800/50 rounded-lg text-sm" />
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name"
                  className="px-3 py-2 bg-[#07080a] border border-gray-800/50 rounded-lg text-sm" />
                <input value={form.vehicle_make} onChange={e => setForm({ ...form, vehicle_make: e.target.value })} placeholder="Make"
                  className="px-3 py-2 bg-[#07080a] border border-gray-800/50 rounded-lg text-sm" />
                <input value={form.vehicle_color} onChange={e => setForm({ ...form, vehicle_color: e.target.value })} placeholder="Colour"
                  className="px-3 py-2 bg-[#07080a] border border-gray-800/50 rounded-lg text-sm" />
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes"
                  className="px-3 py-2 bg-[#07080a] border border-gray-800/50 rounded-lg text-sm col-span-2" />
              </div>
              <button onClick={addEntry} className="mt-3 px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90">Save Entry</button>
            </div>
          )}

          {/* Entries table */}
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Plate</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Vehicle</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Notes</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-medium">{e.plate}</td>
                    <td className="px-4 py-3 text-gray-400">{e.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{[e.vehicle_color, e.vehicle_make].filter(Boolean).join(' ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{e.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeEntry(e.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

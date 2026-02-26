import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Radio, CheckCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function RadioEvent() {
  const { id } = useParams();
  const { client } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [radios, setRadios] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ radio_id: '', assigned_to: '', condition_out: 'good' });

  const load = () => {
    if (!id) return;
    const cid = client?.id ? `?client_id=${client.id}` : '';
    api.get(`/modules/radio/events`).then(evts => { const e = evts.find((x: any) => x.id === id); setEvent(e); });
    api.get(`/modules/radio/events/${id}/assignments`).then(setAssignments);
    api.get(`/modules/radio/radios${cid}`).then(setRadios);
  };
  useEffect(load, [id, client]);

  const checkout = async () => {
    await api.post(`/modules/radio/radios/${checkoutForm.radio_id}/checkout`, { event_id: id, assigned_to: checkoutForm.assigned_to, condition_out: checkoutForm.condition_out });
    setShowCheckout(false);
    setCheckoutForm({ radio_id: '', assigned_to: '', condition_out: 'good' });
    load();
  };

  const checkin = async (radioId: string) => {
    const condition = prompt('Condition on return? (good/fair/damaged)') || 'good';
    await api.post(`/modules/radio/radios/${radioId}/checkin`, { condition_in: condition });
    load();
  };

  if (!event) return <div className="text-gray-500">Loading...</div>;

  const availableRadios = radios.filter(r => r.status === 'available');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{event.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{event.date || 'No date'} · {event.location || 'No location'} · <span className="capitalize">{event.status}</span></p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowCheckout(!showCheckout)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
          <ArrowDownCircle size={16} /> Check Out Radio
        </button>
      </div>

      {showCheckout && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Check Out Radio</h3>
          <div className="grid grid-cols-3 gap-4">
            <select value={checkoutForm.radio_id} onChange={e => setCheckoutForm({...checkoutForm, radio_id: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Select radio...</option>
              {availableRadios.map(r => <option key={r.id} value={r.id}>{r.callsign || r.serial_number} ({r.make} {r.model})</option>)}
            </select>
            <input placeholder="Assigned to" value={checkoutForm.assigned_to} onChange={e => setCheckoutForm({...checkoutForm, assigned_to: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={checkoutForm.condition_out} onChange={e => setCheckoutForm({...checkoutForm, condition_out: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
            </select>
          </div>
          <button onClick={checkout} disabled={!checkoutForm.radio_id} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 disabled:opacity-50">Check Out</button>
        </div>
      )}

      <div className="bg-surface-2 rounded-xl border border-gray-800/50">
        <div className="p-5 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold text-white">Assignments ({assignments.length})</h2>
        </div>
        <div className="divide-y divide-gray-800/50">
          {assignments.map(a => (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Radio size={18} className="text-blue-400" />
                <div>
                  <p className="text-sm text-white font-medium">{a.callsign || a.serial_number} — {a.make} {a.model}</p>
                  <p className="text-xs text-gray-500">Assigned to: {a.assigned_to || 'N/A'} · Out: {a.condition_out}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.checked_in_at ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={14} /> Returned ({a.condition_in})</span>
                ) : (
                  <button onClick={() => checkin(a.radio_id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-400/20">
                    <ArrowUpCircle size={14} /> Check In
                  </button>
                )}
              </div>
            </div>
          ))}
          {assignments.length === 0 && <p className="p-6 text-center text-gray-500">No radios assigned to this event yet</p>}
        </div>
      </div>
    </div>
  );
}

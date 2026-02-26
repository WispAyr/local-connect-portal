import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Send, User, Shield, Bot } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [message, setMessage] = useState('');

  const load = () => { if (id) api.get(`/modules/helpdesk/tickets/${id}`).then(setTicket); };
  useEffect(load, [id]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    await api.post(`/modules/helpdesk/tickets/${id}/messages`, { author: user?.name || 'Unknown', author_role: user?.role === 'admin' || user?.role === 'staff' ? 'staff' : 'client', message });
    setMessage(''); load();
  };

  const setStatus = async (status: string) => {
    await api.put(`/modules/helpdesk/tickets/${id}/status`, { status });
    load();
  };

  if (!ticket) return <div className="text-gray-500">Loading...</div>;

  const roleIcons: Record<string, any> = { client: User, staff: Shield, system: Bot };
  const roleColors: Record<string, string> = { client: 'bg-blue-400/10 border-blue-400/20', staff: 'bg-purple-400/10 border-purple-400/20', system: 'bg-gray-400/10 border-gray-400/20' };
  const statuses = ['open', 'in-progress', 'waiting', 'resolved', 'closed'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
        <p className="text-gray-500 text-sm mt-1">Priority: <span className="capitalize">{ticket.priority}</span> · Created by {ticket.created_by} · {new Date(ticket.created_at).toLocaleString()}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs capitalize ${ticket.status === s ? 'bg-accent text-white' : 'bg-surface-2 text-gray-400 hover:text-white border border-gray-800'}`}>{s}</button>
        ))}
      </div>

      {ticket.description && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-5 mb-6">
          <p className="text-sm text-gray-300">{ticket.description}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {(ticket.messages || []).map((m: any) => {
          const Icon = roleIcons[m.author_role] || User;
          return (
            <div key={m.id} className={`rounded-xl border p-4 ${roleColors[m.author_role] || roleColors.client}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">{m.author} ({m.author_role})</span>
                <span className="text-xs text-gray-600">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-white">{m.message}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a reply..."
          className="flex-1 bg-surface-2 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white" />
        <button onClick={sendMessage} className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/80"><Send size={18} /></button>
      </div>
    </div>
  );
}

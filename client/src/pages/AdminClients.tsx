import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Building2, Plus, Users, ChevronRight } from 'lucide-react';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => { api.get('/clients').then(setClients); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="space-y-3">
        {clients.map(c => (
          <div key={c.id} className="bg-surface-2 border border-gray-800/50 rounded-xl p-5 flex items-center justify-between hover:border-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-3 rounded-lg flex items-center justify-center">
                {c.logo_url ? <img src={c.logo_url} alt="" className="w-8 h-8 rounded" /> : <Building2 size={18} className="text-gray-500" />}
              </div>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">
                  {JSON.parse(c.product_lines || '[]').join(', ')} · {c.plan} · {JSON.parse(c.modules || '[]').length} modules
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

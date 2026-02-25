import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Receipt, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10' },
  sent: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  paid: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  overdue: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  cancelled: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  useEffect(() => { api.get('/payments/invoices').then(setInvoices); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <div className="space-y-3">
        {invoices.map(inv => {
          const cfg = statusConfig[inv.status] || statusConfig.draft;
          const Icon = cfg.icon;
          return (
            <div key={inv.id} className="bg-surface-2 border border-gray-800/50 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${cfg.bg}`}><Icon size={20} className={cfg.color} /></div>
                <div>
                  <div className="font-medium">{inv.title}</div>
                  <div className="text-sm text-gray-500">{inv.client_name}{inv.due_date ? ` · Due ${inv.due_date}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-lg">£{(inv.amount / 100).toFixed(2)}</div>
                  <div className={`text-xs ${cfg.color}`}>{inv.status}</div>
                </div>
                {inv.stripe_payment_link && inv.status !== 'paid' && (
                  <a href={inv.stripe_payment_link} target="_blank" rel="noreferrer"
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
                    Pay <ExternalLink size={14} />
                  </a>
                )}
                {inv.status === 'paid' && inv.paid_at && (
                  <span className="text-xs text-gray-500">Paid {new Date(inv.paid_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          );
        })}
        {invoices.length === 0 && <p className="text-gray-500 text-center py-12">No invoices</p>}
      </div>
    </div>
  );
}

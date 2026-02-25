import { Receipt, ExternalLink, CheckCircle } from 'lucide-react';

interface Props { invoice: any; }

export default function InvoiceCard({ invoice }: Props) {
  const isPaid = invoice.status === 'paid';
  return (
    <div className={`border rounded-xl p-4 ${isPaid ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPaid ? <CheckCircle size={16} className="text-emerald-400" /> : <Receipt size={16} className="text-amber-400" />}
          <span className="font-medium text-sm">{invoice.title}</span>
        </div>
        <span className="font-bold">£{(invoice.amount / 100).toFixed(2)}</span>
      </div>
      {!isPaid && invoice.stripe_payment_link && (
        <a href={invoice.stripe_payment_link} target="_blank" rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300">
          Pay now <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

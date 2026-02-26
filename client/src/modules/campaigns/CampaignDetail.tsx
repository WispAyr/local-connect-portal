import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Megaphone, Plus, Check, X, Clock, FileText } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ title: '', type: 'social', due_date: '' });

  const load = () => { if (id) api.get(`/modules/campaigns/${id}/full`).then(setCampaign); };
  useEffect(load, [id]);

  const addItem = async () => {
    await api.post(`/modules/campaigns/${id}/items`, itemForm);
    setShowItemForm(false); setItemForm({ title: '', type: 'social', due_date: '' }); load();
  };

  const approve = async (itemId: string) => {
    const notes = prompt('Approval notes (optional)') || '';
    await api.post(`/modules/campaigns/${id}/items/${itemId}/approve`, { notes });
    load();
  };

  const reject = async (itemId: string) => {
    const notes = prompt('Rejection reason') || '';
    await api.post(`/modules/campaigns/${id}/items/${itemId}/reject`, { notes });
    load();
  };

  if (!campaign) return <div className="text-gray-500">Loading...</div>;

  const itemStatusColors: Record<string, string> = {
    draft: 'text-gray-400 bg-gray-400/10', review: 'text-amber-400 bg-amber-400/10',
    approved: 'text-emerald-400 bg-emerald-400/10', rejected: 'text-red-400 bg-red-400/10',
    published: 'text-blue-400 bg-blue-400/10',
  };
  const typeIcons: Record<string, string> = { social: '📱', print: '🖨️', video: '🎬', email: '📧', signage: '🪧', other: '📄' };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Megaphone size={28} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <p className="text-gray-500 text-sm">{campaign.description || 'No description'} · <span className="capitalize">{campaign.status}</span></p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowItemForm(!showItemForm)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showItemForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">New Campaign Item</h3>
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Title" value={itemForm.title} onChange={e => setItemForm({...itemForm, title: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={itemForm.type} onChange={e => setItemForm({...itemForm, type: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="social">Social</option><option value="print">Print</option><option value="video">Video</option>
              <option value="email">Email</option><option value="signage">Signage</option><option value="other">Other</option>
            </select>
            <input type="date" value={itemForm.due_date} onChange={e => setItemForm({...itemForm, due_date: e.target.value})} className="bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={addItem} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm">Add Item</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(campaign.items || []).map((item: any) => (
          <div key={item.id} className="bg-surface-2 rounded-xl border border-gray-800/50 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>{typeIcons[item.type] || '📄'}</span>
                <h3 className="text-white font-medium text-sm">{item.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${itemStatusColors[item.status] || ''}`}>{item.status}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {item.type} {item.due_date ? `· Due ${item.due_date}` : ''}
            </p>
            {item.reviewer_notes && <p className="text-xs text-gray-400 mb-3 italic">"{item.reviewer_notes}"</p>}
            {item.status === 'review' && (
              <div className="flex gap-2">
                <button onClick={() => approve(item.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-400/20"><Check size={12} /> Approve</button>
                <button onClick={() => reject(item.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-xs hover:bg-red-400/20"><X size={12} /> Reject</button>
              </div>
            )}
          </div>
        ))}
        {(!campaign.items || campaign.items.length === 0) && <p className="text-gray-500 col-span-full text-center py-8">No items yet</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { BookOpen, Search, Plus, X, Eye } from 'lucide-react';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: '', is_published: true });
  const [viewing, setViewing] = useState<any>(null);

  const load = () => {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    api.get(`/modules/helpdesk/kb${q}`).then(setArticles);
  };
  useEffect(load, [query]);

  const create = async () => {
    await api.post('/modules/helpdesk/kb', form);
    setShowForm(false); setForm({ title: '', content: '', category: '', is_published: true }); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-1">{articles.length} articles</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 text-sm"><Plus size={16} /> New Article</button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search articles..." className="w-full bg-surface-2 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white" />
      </div>

      {showForm && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="flex justify-between mb-4"><h3 className="text-white font-semibold">New Article</h3><button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button></div>
          <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <textarea placeholder="Content (Markdown supported)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={8} className="w-full bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-surface-1 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mb-3" />
          <button onClick={create} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Publish</button>
        </div>
      )}

      {viewing && (
        <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="flex justify-between mb-4"><h2 className="text-white text-lg font-bold">{viewing.title}</h2><button onClick={() => setViewing(null)}><X size={18} className="text-gray-400" /></button></div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{viewing.content}</p>
        </div>
      )}

      <div className="space-y-3">
        {articles.map(a => (
          <div key={a.id} onClick={() => setViewing(a)} className="bg-surface-2 rounded-xl border border-gray-800/50 p-5 hover:border-gray-700/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{a.category || 'General'} · {a.view_count} views</p>
              </div>
              <Eye size={16} className="text-gray-500" />
            </div>
          </div>
        ))}
        {articles.length === 0 && <p className="text-center text-gray-500 py-12">No articles found</p>}
      </div>
    </div>
  );
}

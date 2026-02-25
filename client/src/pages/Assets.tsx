import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Download, Film, ImageIcon, FileText, Search } from 'lucide-react';

function AssetIcon({ mime }: { mime?: string }) {
  if (mime?.startsWith('video/')) return <Film size={20} className="text-purple-400" />;
  if (mime?.startsWith('image/')) return <ImageIcon size={20} className="text-blue-400" />;
  return <FileText size={20} className="text-gray-400" />;
}

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { api.get('/assets').then(setAssets); }, []);

  const filtered = assets.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assets</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-gray-800/50 rounded-lg text-sm text-white focus:outline-none focus:border-accent" />
        </div>
        <div className="flex gap-2">
          {['all', 'deliverable', 'draft', 'brand-asset', 'reference'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm ${typeFilter === t ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-white/5'}`}>
              {t === 'all' ? 'All' : t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <div key={a.id} className="bg-surface-2 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-colors">
            {a.mime_type?.startsWith('image/') ? (
              <div className="aspect-video bg-surface-3 rounded-lg mb-3 overflow-hidden">
                <img src={`/uploads/${a.file_path}`} alt={a.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-surface-3 rounded-lg mb-3 flex items-center justify-center">
                <AssetIcon mime={a.mime_type} />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{a.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{a.type} · {a.file_size ? `${(a.file_size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}</div>
              </div>
              <a href={`/api/assets/${a.id}/download`} className="text-gray-400 hover:text-white ml-2 shrink-0"><Download size={16} /></a>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-500 text-center py-12">No assets found</p>}
    </div>
  );
}

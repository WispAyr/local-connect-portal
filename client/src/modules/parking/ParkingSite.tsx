import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft, MapPin, Car, Shield, Activity } from 'lucide-react';

export default function ParkingSite() {
  const { id } = useParams();
  const [site, setSite] = useState<any>(null);

  useEffect(() => {
    api.get(`/modules/parking/sites/${id}`).then(setSite);
  }, [id]);

  if (!site) return <div className="text-gray-500">Loading...</div>;

  const statMap: Record<string, number> = {};
  (site.stats || []).forEach((s: any) => { statMap[s.type] = s.count; });

  return (
    <div>
      <Link to="/parking" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Parking
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{site.name}</h1>
          <p className="text-gray-500 mt-1">{site.code} · {site.address}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${site.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {site.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <Car size={18} className="text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{site.total_spaces}</div>
          <div className="text-sm text-gray-500">Total Spaces</div>
        </div>
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <Activity size={18} className="text-emerald-400 mb-2" />
          <div className="text-2xl font-bold">{statMap.entry || 0}</div>
          <div className="text-sm text-gray-500">Entries Today</div>
        </div>
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <Activity size={18} className="text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{statMap.exit || 0}</div>
          <div className="text-sm text-gray-500">Exits Today</div>
        </div>
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <Shield size={18} className="text-red-400 mb-2" />
          <div className="text-2xl font-bold">{statMap.violation || 0}</div>
          <div className="text-sm text-gray-500">Violations Today</div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-8 mb-8 text-center">
        <MapPin size={32} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Map view — {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}</p>
        <p className="text-gray-600 text-xs mt-1">Map integration coming soon</p>
      </div>

      {/* Whitelists */}
      <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Whitelists</h2>
      <div className="space-y-2">
        {(site.whitelists || []).map((w: any) => (
          <Link key={w.id} to={`/parking/whitelists/${w.id}`}
            className="flex items-center justify-between bg-surface-2 border border-gray-800/50 rounded-lg p-4 hover:border-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-400" />
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="text-sm text-gray-500">{w.description}</div>
              </div>
            </div>
          </Link>
        ))}
        {(!site.whitelists || site.whitelists.length === 0) && <p className="text-gray-600 text-sm">No whitelists for this site</p>}
      </div>
    </div>
  );
}

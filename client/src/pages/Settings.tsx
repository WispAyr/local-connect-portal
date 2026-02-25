import { useAuth } from '../auth/AuthContext';
import { User, Building2, Palette } from 'lucide-react';

export default function Settings() {
  const { user, client } = useAuth();
  const branding = client ? JSON.parse(client.branding || '{}') : {};

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Account */}
        <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <User size={18} className="text-gray-400" />
            <h3 className="font-medium">Account</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{user?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="capitalize">{user?.role}</dd></div>
          </dl>
        </div>

        {/* Organisation */}
        {client && (
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={18} className="text-gray-400" />
              <h3 className="font-medium">Organisation</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{client.name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Slug</dt><dd>{client.slug}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Product Lines</dt><dd>{JSON.parse(client.product_lines || '[]').join(', ')}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Modules</dt><dd>{JSON.parse(client.modules || '[]').join(', ')}</dd></div>
            </dl>
          </div>
        )}

        {/* Branding */}
        {client && (
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={18} className="text-gray-400" />
              <h3 className="font-medium">Branding</h3>
            </div>
            <p className="text-sm text-gray-500">Branding customisation coming soon. Contact your admin to update colours and themes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

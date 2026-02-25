import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Clock, MessageSquare, Upload, Download, CreditCard, FileText, Film, ImageIcon } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400', 'in-progress': 'bg-blue-500/10 text-blue-400',
  review: 'bg-amber-500/10 text-amber-400', delivered: 'bg-emerald-500/10 text-emerald-400',
  completed: 'bg-green-500/10 text-green-400',
};

function AssetIcon({ mime }: { mime?: string }) {
  if (mime?.startsWith('video/')) return <Film size={16} className="text-purple-400" />;
  if (mime?.startsWith('image/')) return <ImageIcon size={16} className="text-blue-400" />;
  return <FileText size={16} className="text-gray-400" />;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.get(`/projects/${id}`).then(setProject).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const addComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/projects/${id}/activity`, { type: 'comment', content: comment });
    setComment('');
    load();
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!project) return <div className="text-gray-400">Project not found</div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-gray-500">{project.client_name} · {project.category || 'General'}</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full ${statusColors[project.status] || 'bg-gray-500/10 text-gray-400'}`}>{project.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brief */}
          {project.brief && (
            <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Brief</h3>
              <p className="text-gray-300">{project.brief}</p>
            </div>
          )}

          {/* Invoice CTA */}
          {project.invoice && project.invoice.status !== 'paid' && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-amber-400" />
                <div>
                  <div className="font-medium text-amber-400">Payment Required</div>
                  <div className="text-sm text-gray-400">£{(project.invoice.amount / 100).toFixed(2)} — {project.invoice.title}</div>
                </div>
              </div>
              {project.invoice.stripe_payment_link && (
                <a href={project.invoice.stripe_payment_link} target="_blank" rel="noreferrer"
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-medium hover:opacity-90">Pay Now</a>
              )}
            </div>
          )}

          {/* Activity / Timeline */}
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Activity</h3>
            <div className="space-y-4">
              {project.activity?.map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1">
                    {a.type === 'comment' ? <MessageSquare size={14} className="text-gray-500" /> :
                     a.type === 'file_upload' ? <Upload size={14} className="text-blue-400" /> :
                     <Clock size={14} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm"><span className="font-medium text-gray-300">{a.user_name || 'System'}</span>{' '}
                      <span className="text-gray-500">{a.type === 'comment' ? '' : `(${a.type.replace('_', ' ')})`}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{a.content}</p>
                    <span className="text-xs text-gray-600">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {!project.activity?.length && <p className="text-gray-500 text-sm">No activity yet</p>}
            </div>

            {/* Comment box */}
            <div className="mt-4 flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
                onKeyDown={e => e.key === 'Enter' && addComment()}
                className="flex-1 px-3 py-2 bg-surface-3 border border-gray-800/50 rounded-lg text-sm text-white focus:outline-none focus:border-accent" />
              <button onClick={addComment} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">Send</button>
            </div>
          </div>
        </div>

        {/* Right: Files */}
        <div className="space-y-4">
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Files & Deliverables</h3>
            <div className="space-y-2">
              {project.assets?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-surface-3 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <AssetIcon mime={a.mime_type} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.type} · {(a.file_size / 1024 / 1024).toFixed(1)}MB</div>
                    </div>
                  </div>
                  <a href={`/api/assets/${a.id}/download`} className="text-gray-400 hover:text-white"><Download size={16} /></a>
                </div>
              ))}
              {!project.assets?.length && <p className="text-gray-500 text-sm">No files yet</p>}
            </div>
          </div>

          {/* Project info */}
          <div className="bg-surface-2 border border-gray-800/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Priority</dt><dd>{project.priority}</dd></div>
              {project.due_date && <div className="flex justify-between"><dt className="text-gray-500">Due</dt><dd>{project.due_date}</dd></div>}
              {project.budget && <div className="flex justify-between"><dt className="text-gray-500">Budget</dt><dd>£{project.budget.toFixed(2)}</dd></div>}
              {project.assigned_to && <div className="flex justify-between"><dt className="text-gray-500">Assigned</dt><dd>{project.assigned_to}</dd></div>}
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd>{new Date(project.created_at).toLocaleDateString()}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

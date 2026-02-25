import { Clock, MessageSquare, Upload, CreditCard, RotateCcw, Package } from 'lucide-react';

const typeIcons: Record<string, any> = {
  comment: MessageSquare, status_change: Clock, file_upload: Upload,
  revision_request: RotateCcw, delivery: Package, payment: CreditCard,
};

interface Props { activity: any[]; }

export default function ProjectTimeline({ activity }: Props) {
  return (
    <div className="space-y-3">
      {activity.map((a: any) => {
        const Icon = typeIcons[a.type] || Clock;
        return (
          <div key={a.id} className="flex gap-3">
            <div className="mt-0.5"><Icon size={14} className="text-gray-500" /></div>
            <div>
              <div className="text-sm"><span className="font-medium text-gray-300">{a.user_name || 'System'}</span></div>
              <p className="text-sm text-gray-400">{a.content}</p>
              <span className="text-xs text-gray-600">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

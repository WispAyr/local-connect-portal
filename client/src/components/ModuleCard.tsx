import { ArrowRight } from 'lucide-react';

interface Props { name: string; icon?: React.ReactNode; description?: string; to?: string; }

export default function ModuleCard({ name, icon, description, to }: Props) {
  const Wrapper = to ? 'a' : 'div';
  return (
    <Wrapper href={to} className="bg-surface-2 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-colors block">
      <div className="flex items-center justify-between mb-2">
        {icon || <div className="w-8 h-8 bg-accent/10 rounded-lg" />}
        <ArrowRight size={16} className="text-gray-600" />
      </div>
      <div className="font-medium mt-2">{name}</div>
      {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
    </Wrapper>
  );
}

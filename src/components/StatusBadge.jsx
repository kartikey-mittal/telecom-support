import { getStatusColor, capitalize } from '../lib/utils';

export default function StatusBadge({ status, size = 'sm' }) {
  const color = getStatusColor(status);
  const sizeClasses = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {capitalize(status) || 'Unknown'}
    </span>
  );
}

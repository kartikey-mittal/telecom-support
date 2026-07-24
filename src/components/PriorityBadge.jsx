import { getPriorityColor } from '../lib/utils';

export default function PriorityBadge({ priority }) {
  const color = getPriorityColor(priority);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {priority || 'Not set'}
    </span>
  );
}

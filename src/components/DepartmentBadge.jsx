import { getDepartmentColor } from '../lib/utils';

export default function DepartmentBadge({ department }) {
  const color = getDepartmentColor(department);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {department || 'Unassigned'}
    </span>
  );
}

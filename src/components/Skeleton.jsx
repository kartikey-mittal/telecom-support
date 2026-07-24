export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="h-5 bg-gray-100 rounded-lg w-1/3 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="border-b border-gray-100 p-4">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100 rounded w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-50 p-4">
          <div className="flex gap-4 items-center">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-32" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
            <div className="h-5 bg-gray-100 rounded-full w-24" />
            <div className="h-5 bg-gray-100 rounded-full w-16" />
            <div className="h-3 bg-gray-100 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
        <div className="space-y-2.5 flex-1 max-w-[70%]">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-20 bg-gray-100 rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-3 items-start flex-row-reverse">
        <div className="w-8 h-8 bg-teal-100 rounded-full flex-shrink-0" />
        <div className="space-y-2.5 flex-1 flex flex-col items-end max-w-[70%] ml-auto">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-12 bg-gray-100 rounded-2xl w-full" />
        </div>
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
        <div className="space-y-2.5 flex-1 max-w-[70%]">
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="h-28 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" />
          <div className="h-7 bg-gray-100 rounded w-16 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

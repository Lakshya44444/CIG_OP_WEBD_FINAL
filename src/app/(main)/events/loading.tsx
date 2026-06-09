export default function EventsLoading() {
  return (
    <div className="page-container py-8 space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-gray-200" />
      <div className="h-10 w-full max-w-sm rounded-lg bg-gray-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-40 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-100" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

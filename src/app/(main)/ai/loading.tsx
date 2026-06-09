export default function AILoading() {
  return (
    <div className="page-container py-8 max-w-5xl space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-32 rounded-lg bg-gray-200" />
          <div className="h-4 w-56 rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className="h-10 w-64 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
            <div className="aspect-square bg-gray-200" />
            <div className="p-2.5 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-100" />
              <div className="h-8 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

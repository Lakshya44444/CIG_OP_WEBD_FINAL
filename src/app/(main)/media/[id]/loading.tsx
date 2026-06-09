export default function MediaLoading() {
  return (
    <div className="page-container py-6 max-w-5xl animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-gray-200 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-gray-200 aspect-video w-full" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-100" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="h-10 w-full rounded-lg bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200" />
                <div className="h-7 flex-1 rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

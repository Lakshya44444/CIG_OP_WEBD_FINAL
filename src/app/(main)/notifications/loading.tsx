export default function NotificationsLoading() {
  return (
    <div className="page-container py-8 max-w-2xl space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200" />
        <div className="h-7 w-36 rounded-lg bg-gray-200" />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

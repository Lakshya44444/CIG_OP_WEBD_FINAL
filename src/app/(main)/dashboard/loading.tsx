export default function DashboardLoading() {
  return (
    <div className="page-container py-8 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-gray-200" />
          <div className="h-4 w-64 rounded-lg bg-gray-100" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-gray-200" />
            <div className="h-7 w-16 rounded-lg bg-gray-200" />
            <div className="h-4 w-24 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="page-container py-8 space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200" />
        <div className="h-7 w-40 rounded-lg bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-gray-100" />
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

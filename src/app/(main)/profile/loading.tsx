export default function ProfileLoading() {
  return (
    <div className="page-container py-8 space-y-6 animate-pulse">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-7 w-44 rounded-lg bg-gray-200" />
            <div className="h-4 w-28 rounded-lg bg-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-gray-100" />)}
        </div>
      </div>
      <div className="h-10 w-72 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-200" />)}
      </div>
    </div>
  );
}

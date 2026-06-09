export default function SearchLoading() {
  return (
    <div className="page-container py-8 max-w-4xl space-y-4 animate-pulse">
      <div className="h-7 w-32 rounded-lg bg-gray-200" />
      <div className="h-12 rounded-xl bg-gray-200 max-w-lg" />
      <div className="flex gap-2 mt-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-7 w-20 rounded-full bg-gray-200" />)}
      </div>
    </div>
  );
}

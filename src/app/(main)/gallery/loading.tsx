export default function GalleryLoading() {
  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div className="h-7 w-28 rounded-lg bg-gray-200" />
        <div className="h-9 w-20 rounded-lg bg-gray-200" />
      </div>
      <div className="masonry-grid">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="masonry-item rounded-xl bg-gray-200 animate-pulse"
            style={{ height: `${150 + (i % 3) * 80}px` }} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="h-full w-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="mb-12">
          <div className="text-6xl font-bold mb-2">
            <span className="text-white">Captify</span>
            <span className="text-cyan-400 animate-pulse">.io</span>
          </div>
        </div>
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-cyan-400 mx-auto"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-cyan-400/30 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

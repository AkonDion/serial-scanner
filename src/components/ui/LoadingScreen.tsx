const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="relative max-w-md w-full mx-4">
        <div className="relative bg-black rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />

          {/* Content */}
          <div className="relative flex flex-col items-center justify-center py-8">
            {/* Loading spinner */}
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />

            {/* Loading text */}
            <div className="mt-4 text-sm text-white/70">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

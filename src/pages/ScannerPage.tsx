import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import useScanner from "@hooks/useScanner";
import { toast } from "sonner";

export default function ScannerPage() {
  console.log('ScannerPage rendered');
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const index = searchParams.get("index");

  const {
    videoRef,
    canvasRef,
    isScanning,
    progress,
    error,
    startScanning,
    stopScanning,
  } = useScanner({
    onSuccess: (serial) => {
      console.log('Serial number detected:', serial);
      navigate(`/deals?serial=${serial}&index=${index}`);
    },
    onError: (error) => {
      console.error('Scanner error:', error);
      toast.error("Failed to detect serial number");
    },
  });

  useEffect(() => {
    console.log('ScannerPage mounted, starting scanner...');
    startScanning();
    
    return () => {
      console.log('ScannerPage unmounting, stopping scanner...');
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  return (
    // Remove any background colors from the root container
    <div className="fixed inset-0 z-50">
      {/* Video container with higher z-index */}
      <div className="absolute inset-0 z-10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)", // Mirror the video for front camera if needed
            WebkitTransform: "scaleX(-1)",
          }}
        />
      </div>

      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 z-20">
        {/* Semi-transparent background */}
        <div className="absolute inset-0 bg-black/80" />

        {/* Cutout container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[70%] h-16">
            {/* Transparent cutout area - mix-blend-mode ensures transparency */}
            <div className="absolute inset-0 rounded-full mix-blend-screen">
              {/* Create a "hole" in the overlay */}
              <div
                className="absolute inset-0 rounded-full ring-1 ring-indigo-500/50"
                style={{
                  background: "transparent",
                  mixBlendMode: "screen",
                  maskImage:
                    "radial-gradient(circle at center, black 98%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(circle at center, black 98%, transparent 100%)",
                }}
              />
            </div>

            {/* Scanning animation */}
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
                animate={{
                  x: ["-200%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* UI Elements with highest z-index */}
      <div className="relative z-30">
        {/* Status */}
        <div className="absolute inset-x-0 bottom-0 p-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 p-4 max-w-md mx-auto"
          >
            <p className="text-sm text-center text-gray-300">
              {error
                ? error.message
                : isScanning
                ? "Scanning..."
                : "Initializing camera..."}
            </p>
            {isScanning && progress > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Cancel Button */}
        <motion.button
          onClick={() => navigate("/deals")}
          className="absolute top-4 right-4 px-6 py-2.5 bg-black/50 backdrop-blur-sm
                   rounded-lg border border-white/10 text-gray-300 text-sm font-medium
                   hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Cancel
        </motion.button>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

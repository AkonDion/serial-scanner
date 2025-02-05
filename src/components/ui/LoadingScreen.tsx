import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
    >
      <div className="relative max-w-md w-full mx-4">
        {/* Container with solid background */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="relative bg-black rounded-2xl p-6 border border-white/10
                     shadow-lg shadow-black/20"
          style={{
            willChange: "transform, opacity",
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />

          {/* Content */}
          <div className="relative flex flex-col items-center justify-center py-8">
            {/* Loading spinner - simplified animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.8,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                perspective: 1000,
              }}
            />

            {/* Loading text - simplified animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-4 text-sm text-white/70"
            >
              Loading...
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;

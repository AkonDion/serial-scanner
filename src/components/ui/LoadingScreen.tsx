import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50"
    >
      <div className="relative max-w-md w-full mx-4">
        {/* Container with solid background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative bg-black rounded-2xl p-6 border border-white/10
                     shadow-lg shadow-black/20"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />

          {/* Content */}
          <div className="relative flex flex-col items-center justify-center py-8">
            {/* Loading spinner */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
            />

            {/* Loading text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
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

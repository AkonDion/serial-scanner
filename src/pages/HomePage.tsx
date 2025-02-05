import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] max-w-md mx-auto relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="w-full space-y-8 text-center px-6"
        style={{
          willChange: "transform, opacity",
        }}
      >
        <div className="space-y-4 backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 animate-border-glow">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent">
            Serial Scanner
          </h1>
          <p className="text-sm text-zinc-400/90 sm:text-base">
            Scan and record serial numbers seamlessly with your Zoho CRM deals
          </p>
        </div>

        <motion.div
          className="relative group"
          whileHover="hover"
          style={{
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Shimmer effect container */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 animate-shimmer" />

          {/* Button with glass effect */}
          <motion.button
            onClick={() => navigate("/deals")}
            className="relative w-full px-6 py-3.5 bg-white/10
                     text-white/90 rounded-lg font-medium
                     transition-all duration-200
                     hover:bg-white/[0.15] hover:border-white/30
                     active:bg-white/20
                     border border-white/10
                     sm:w-auto sm:px-8"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              duration: 0.2,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Start Scanning
          </motion.button>

          {/* Glow effect */}
          <div className="absolute inset-0 -z-10 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;

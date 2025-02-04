import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] max-w-md mx-auto relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full space-y-8 text-center px-6"
      >
        <div className="space-y-4 backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 animate-border-glow">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent">
            Serial Scanner
          </h1>
          <p className="text-sm text-zinc-400/90 sm:text-base">
            Scan and record serial numbers seamlessly with your Zoho CRM deals
          </p>
        </div>

        <motion.div className="relative group" whileHover="hover">
          {/* Shimmer effect container */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 animate-shimmer" />

          {/* Button with glass effect */}
          <motion.button
            onClick={() => navigate("/deals")}
            className="relative w-full px-6 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20
                     text-white rounded-lg font-medium overflow-hidden
                     transition-all duration-300 hover:bg-white/20 hover:border-white/30
                     active:scale-[0.98] sm:w-auto sm:px-8"
            variants={{
              hover: {
                scale: 1.02,
                transition: { duration: 0.2 },
              },
            }}
          >
            <span className="relative z-10 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
              Start Scanning
            </span>
          </motion.button>

          {/* Glow effect */}
          <div className="absolute inset-0 -z-10 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;

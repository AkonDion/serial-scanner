import { ReactNode } from "react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="relative min-h-screen isolate">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="relative z-10"
        style={{
          willChange: "opacity",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </main>
  );
}

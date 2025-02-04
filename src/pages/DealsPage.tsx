import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { zohoSDK } from "../services/zohoSDK";
import { toast } from "sonner";
import type { Deal } from "../types/zoho";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
      ease: "easeOut",
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const DealsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serial = params.get("serial");
    const index = params.get("index");

    if (serial && index && selectedDeal) {
      const updatedDeal = {
        ...selectedDeal,
        [`Serial_${index}`]: serial,
      };
      setSelectedDeal(updatedDeal);
      window.history.replaceState({}, "", "/deals");
    }
  }, [location.search, selectedDeal]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const dealsData = await zohoSDK.getDeals();
        setDeals(dealsData);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Failed to fetch deals");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleScan = (index: number) => {
    navigate(`/scanner?index=${index}`);
  };

  const handleSubmit = async () => {
    if (!selectedDeal) return;

    setSubmitting(true);
    try {
      await zohoSDK.updateDeal(selectedDeal.id, {
        Serial_1: selectedDeal.Serial_1,
        Serial_2: selectedDeal.Serial_2,
        Serial_3: selectedDeal.Serial_3,
        Serial_4: selectedDeal.Serial_4,
      });

      toast.success("Serial numbers updated successfully");
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update deal");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const allSerialsScanned =
    selectedDeal &&
    [1, 2, 3, 4].every(
      (index) =>
        !selectedDeal[`Model_${index}` as keyof Deal] ||
        selectedDeal[`Serial_${index}` as keyof Deal]
    );

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-md mx-auto space-y-6 relative px-4 pt-4"
      >
        <motion.div
          variants={containerVariants}
          className="relative space-y-6 bg-black rounded-2xl p-6 border border-white/10
                     shadow-lg shadow-black/20"
        >
          {/* Gradient overlay for container */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <motion.h1
                variants={itemVariants}
                className="text-xl font-medium bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent"
              >
                Scan Serials
              </motion.h1>
              <motion.button
                variants={itemVariants}
                onClick={() => navigate("/")}
                className="text-sm text-zinc-400 hover:text-white transition-all hover:scale-105"
              >
                Cancel
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-zinc-400"
                >
                  <div className="animate-pulse">Loading deals...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  variants={containerVariants}
                  className="space-y-6 mt-6"
                >
                  <motion.select
                    variants={itemVariants}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg 
                             border border-white/10 text-white appearance-none
                             focus:outline-none focus:ring-2 focus:ring-white/20
                             transition-all hover:bg-white/10"
                    value={selectedDeal?.id || ""}
                    onChange={(e) =>
                      setSelectedDeal(
                        deals.find((d) => d.id === e.target.value) || null
                      )
                    }
                  >
                    <option value="">Select a deal</option>
                    {deals.map((deal) => (
                      <option
                        key={deal.id}
                        value={deal.id}
                        className="bg-zinc-900"
                      >
                        {deal.Deal_Name}
                      </option>
                    ))}
                  </motion.select>

                  {selectedDeal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3, 4].map((index) => {
                        const modelKey = `Model_${index}` as keyof Deal;
                        const serialKey = `Serial_${index}` as keyof Deal;
                        const model = selectedDeal[modelKey];

                        if (!model) return null;

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group p-4 bg-white/5 backdrop-blur-sm rounded-lg
                                     border border-white/10 hover:bg-white/10
                                     transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white/90">
                                  {typeof model === "string"
                                    ? model
                                    : model.name}
                                </div>
                                <div className="text-sm text-zinc-400">
                                  {selectedDeal[serialKey]?.toString() ||
                                    "No serial number"}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative px-4 py-2 bg-white/10 backdrop-blur-sm
                                         rounded-lg text-sm font-medium overflow-hidden
                                         transition-all hover:bg-white/20 group-hover:border-white/20"
                                onClick={() => handleScan(index)}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 animate-shimmer" />
                                <span className="relative z-10">Scan</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}

                      {allSerialsScanned && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="relative w-full py-3 bg-white/10 backdrop-blur-sm
                                   border border-white/20 rounded-lg font-medium overflow-hidden
                                   transition-all hover:bg-white/20 hover:border-white/30
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   group"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 animate-shimmer" />
                          <span className="relative z-10 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                            {submitting ? "Updating..." : "Submit"}
                          </span>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default DealsPage;

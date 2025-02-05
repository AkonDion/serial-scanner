import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { zohoSDK } from "../services/zohoSDK";
import { toast } from "sonner";
import type { Deal } from "../types/zoho";

// Enhanced animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
      scale: { duration: 0.4 },
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
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
  const initialLoadRef = useRef(true);
  const scannerStateProcessedRef = useRef(false);
  const scannedSerialsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const initializeDealsPage = async () => {
      if (!initialLoadRef.current) return;

      try {
        setLoading(true);
        const dealsData = await zohoSDK.getDeals();
        setDeals(dealsData);
        initialLoadRef.current = false;

        // Process scanner state after deals are loaded
        const state = location.state as {
          serial: string;
          index: string;
        } | null;

        if (
          state?.serial &&
          state?.index &&
          !scannerStateProcessedRef.current
        ) {
          const dealId = sessionStorage.getItem("selectedDealId");
          if (dealId) {
            const deal = dealsData.find((d) => d.id === dealId);
            if (deal) {
              // Update only the specific serial number field
              const serialKey = `Serial_${state.index}` as keyof Deal;
              const updatedDeal = {
                ...deal,
                [serialKey]: state.serial,
              };

              setSelectedDeal(updatedDeal);
              setDeals((prevDeals) =>
                prevDeals.map((d) => (d.id === dealId ? updatedDeal : d))
              );
              scannerStateProcessedRef.current = true;
            }
          }
          // Clear the navigation state
          window.history.replaceState(null, "", "/deals");
        }
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

    initializeDealsPage();
  }, [location.state]);

  const handleDealSelect = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (deal) {
      // Reset scanned serials when selecting a new deal
      scannedSerialsRef.current = {};
      sessionStorage.removeItem(`scannedSerials_${dealId}`);

      // Initialize scanned serials with any existing ones from the deal
      const existingSerials: Record<string, string> = {};
      [1, 2, 3, 4].forEach((index) => {
        const serialKey = `Serial_${index}` as keyof Deal;
        if (deal[serialKey]) {
          existingSerials[serialKey] = deal[serialKey] as string;
        }
      });

      if (Object.keys(existingSerials).length > 0) {
        scannedSerialsRef.current = existingSerials;
        sessionStorage.setItem(
          `scannedSerials_${dealId}`,
          JSON.stringify(existingSerials)
        );
      }
    }

    setSelectedDeal(deal || null);
    if (dealId) {
      sessionStorage.setItem("selectedDealId", dealId);
    } else {
      sessionStorage.removeItem("selectedDealId");
    }
  };

  const handleScan = (index: number) => {
    if (selectedDeal) {
      sessionStorage.setItem("selectedDealId", selectedDeal.id);
      navigate(`/scanner?index=${index}`);
    }
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
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-md mx-auto space-y-6 relative px-4 pt-4"
      style={{
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        perspective: 1000,
      }}
    >
      <motion.div
        variants={containerVariants}
        className="relative space-y-6 bg-black rounded-2xl p-6 border border-white/10
                   shadow-lg shadow-black/20"
        style={{
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Gradient overlay */}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")}
              className="text-sm text-zinc-400 hover:text-white transition-all"
            >
              Cancel
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-center py-8 text-zinc-400"
              >
                <div className="animate-pulse">Loading deals...</div>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                className="space-y-6 mt-6"
              >
                <motion.div
                  variants={itemVariants}
                  className="relative"
                  style={{ willChange: "transform" }}
                >
                  <motion.select
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg 
                             border border-white/10 text-white appearance-none
                             focus:outline-none focus:ring-2 focus:ring-white/20
                             transition-all hover:bg-white/10"
                    value={selectedDeal?.id || ""}
                    onChange={(e) => handleDealSelect(e.target.value)}
                    style={{ willChange: "transform" }}
                  >
                    <option value="" className="bg-zinc-900">
                      Select a deal
                    </option>
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
                </motion.div>

                <AnimatePresence>
                  {selectedDeal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        transition: {
                          height: {
                            duration: 0.3,
                            ease: [0.23, 1, 0.32, 1],
                          },
                        },
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        transition: {
                          height: {
                            duration: 0.2,
                            ease: [0.32, 0, 0.67, 0],
                          },
                        },
                      }}
                      className="space-y-3 overflow-hidden"
                    >
                      {[1, 2, 3, 4].map((index) => {
                        const modelKey = `Model_${index}` as keyof Deal;
                        const serialKey = `Serial_${index}` as keyof Deal;
                        const model = selectedDeal[modelKey];

                        if (!model) return null;

                        return (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            initial="initial"
                            animate="animate"
                            className="group p-4 bg-white/5 backdrop-blur-sm rounded-lg
                                     border border-white/10 hover:bg-white/10
                                     transition-all duration-300"
                            style={{ willChange: "transform, opacity" }}
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
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                  duration: 0.2,
                                  ease: [0.23, 1, 0.32, 1],
                                }}
                                className="relative px-4 py-2 bg-white/10
                                         rounded-lg text-sm font-medium text-white/90
                                         transition-all duration-200
                                         hover:bg-white/[0.15] active:bg-white/20
                                         border border-white/10 hover:border-white/20"
                                onClick={() => handleScan(index)}
                                style={{
                                  willChange: "transform",
                                  backfaceVisibility: "hidden",
                                  WebkitTapHighlightColor: "transparent",
                                }}
                              >
                                <span>Scan</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}

                      {allSerialsScanned && (
                        <motion.button
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full py-3 bg-white/10
                                   border border-white/20 rounded-lg font-medium
                                   transition-all duration-200
                                   hover:bg-white/[0.15] hover:border-white/30
                                   active:bg-white/20
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleSubmit}
                          disabled={submitting}
                          style={{
                            willChange: "transform",
                            backfaceVisibility: "hidden",
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          <span className="text-white/90">
                            {submitting ? "Updating..." : "Submit"}
                          </span>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DealsPage;

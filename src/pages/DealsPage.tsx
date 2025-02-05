import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useDealContext } from "../context/DealContext";
import { PullToRefresh } from "../components/ui/PullToRefresh";

const DealsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    deals,
    selectedDeal,
    loading,
    loadDeals,
    refreshDeals,
    selectDeal,
    addScannedSerial,
    submitDeal,
    getSerialNumber,
    clearSelectedDeal,
  } = useDealContext();

  // Initial load
  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Handle scanner return
  useEffect(() => {
    if (!location.state?.fromScanner) return;

    const { dealId, modelIndex, serial } = location.state;
    console.log("Processing scanner return:", { dealId, modelIndex, serial });

    addScannedSerial(dealId, modelIndex, serial);

    // Clear the location state
    window.history.replaceState({}, document.title, location.pathname);
  }, [location.state, addScannedSerial]);

  const handleDealSelect = (dealId: string) => {
    selectDeal(dealId);
  };

  const handleScan = (index: number) => {
    if (!selectedDeal) return;
    navigate("/scanner", {
      state: { dealId: selectedDeal.id, modelIndex: index },
    });
  };

  const handleSubmit = async () => {
    if (!selectedDeal) return;

    try {
      await submitDeal(selectedDeal);
      clearSelectedDeal();
      toast.success("Deal updated successfully");
      navigate("/");
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal");
    }
  };

  const allSerialsScanned =
    selectedDeal &&
    [1, 2, 3, 4].every((index) => {
      const modelKey = `Model_${index}` as keyof typeof selectedDeal;
      const serialKey = `Serial_${index}`;
      return (
        !selectedDeal[modelKey] ||
        getSerialNumber(selectedDeal.id, serialKey) !== "No serial number"
      );
    });

  const handleCancel = () => {
    clearSelectedDeal();
    navigate("/");
  };

  return (
    <PullToRefresh onRefresh={refreshDeals}>
      <div className="max-w-md mx-auto space-y-6 relative px-4 pt-4">
        <div className="relative space-y-6 bg-black rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-medium bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                Scan Serials
              </h1>
              <button
                onClick={handleCancel}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-zinc-400">
                <div>Loading deals...</div>
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg 
                             border border-white/10 text-white appearance-none
                             focus:outline-none focus:ring-2 focus:ring-white/20
                             hover:bg-white/10"
                    value={selectedDeal?.id || ""}
                    onChange={(e) => handleDealSelect(e.target.value)}
                  >
                    <option value="" className="bg-zinc-900">
                      Select a project
                    </option>
                    {deals.map((deal) => (
                      <option
                        key={deal.id}
                        value={deal.id}
                        className="bg-zinc-900"
                      >
                        {deal.Street || "No street address"}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedDeal && (
                  <div className="py-8 px-4">
                    <blockquote className="space-y-2">
                      <p className="text-sm text-zinc-400/80 italic">
                        "Give me six hours to chop down a tree, and I will spend
                        the first four sharpening the axe."
                      </p>
                      <footer className="text-xs text-zinc-500">
                        - Abraham Lincoln
                      </footer>
                    </blockquote>
                  </div>
                )}

                {selectedDeal && (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((index) => {
                      const modelKey =
                        `Model_${index}` as keyof typeof selectedDeal;
                      const serialKey = `Serial_${index}`;
                      const model = selectedDeal[modelKey];

                      if (!model) return null;

                      return (
                        <div
                          key={index}
                          className="group p-4 bg-white/5 backdrop-blur-sm rounded-lg
                                   border border-white/10 hover:bg-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white/90">
                                {typeof model === "string" ? model : model.name}
                              </div>
                              <div className="text-sm text-zinc-400">
                                {getSerialNumber(selectedDeal.id, serialKey)}
                              </div>
                            </div>
                            <button
                              className="relative px-4 py-2 bg-white/10
                                       rounded-lg text-sm font-medium text-white/90
                                       hover:bg-white/[0.15] active:bg-white/20
                                       border border-white/10 hover:border-white/20"
                              onClick={() => handleScan(index)}
                            >
                              <span>Scan</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {allSerialsScanned && (
                      <button
                        className="relative w-full py-3 bg-white/10
                                 border border-white/20 rounded-lg font-medium
                                 hover:bg-white/[0.15] hover:border-white/30
                                 active:bg-white/20"
                        onClick={handleSubmit}
                      >
                        <span className="text-white/90">Submit</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default DealsPage;

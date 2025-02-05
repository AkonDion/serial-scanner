import React, { createContext, useContext, useState, useCallback } from "react";
import { zohoSDK } from "../services/zohoSDK";
import { toast } from "sonner";
import type { Deal } from "../types/zoho";

interface DealContextType {
  deals: Deal[];
  selectedDeal: Deal | null;
  loading: boolean;
  loadDeals: () => Promise<void>;
  selectDeal: (dealId: string) => void;
  addScannedSerial: (
    dealId: string,
    modelIndex: number,
    serial: string
  ) => void;
  submitDeal: (deal: Deal) => Promise<void>;
  getSerialNumber: (dealId: string, serialKey: string) => string;
  clearSelectedDeal: () => void;
}

const DealContext = createContext<DealContextType | null>(null);

export const useDealContext = () => {
  const context = useContext(DealContext);
  if (!context) {
    throw new Error("useDealContext must be used within a DealProvider");
  }
  return context;
};

export const DealProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  // Get scanned serials for a deal
  const getScannedSerials = (dealId: string) => {
    const stored = localStorage.getItem(`scanned_serials_${dealId}`);
    return stored ? JSON.parse(stored) : {};
  };

  // Save a scanned serial
  const saveScannedSerial = (
    dealId: string,
    modelIndex: number,
    serial: string
  ) => {
    const serials = getScannedSerials(dealId);
    serials[`Serial_${modelIndex}`] = serial;
    localStorage.setItem(`scanned_serials_${dealId}`, JSON.stringify(serials));
  };

  // Clear scanned serials for a deal
  const clearScannedSerials = (dealId: string) => {
    localStorage.removeItem(`scanned_serials_${dealId}`);
  };

  const loadDeals = useCallback(async () => {
    try {
      const fetchedDeals = await zohoSDK.getDeals();
      console.log("Fetched deals:", fetchedDeals);
      setDeals(fetchedDeals);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
      setLoading(false);
    }
  }, []);

  const selectDeal = useCallback(
    (dealId: string) => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return;

      // Merge any scanned serials with the deal data
      const scannedSerials = getScannedSerials(dealId);
      const mergedDeal = {
        ...deal,
        ...scannedSerials,
      };

      console.log("Deal selected:", {
        dealId,
        scannedSerials,
        mergedDeal,
      });

      setSelectedDeal(mergedDeal);
    },
    [deals]
  );

  const addScannedSerial = useCallback(
    (dealId: string, modelIndex: number, serial: string) => {
      // Save the scanned serial
      saveScannedSerial(dealId, modelIndex, serial);

      // Update the selected deal if it matches
      setSelectedDeal((current) => {
        if (current?.id !== dealId) return current;

        const scannedSerials = getScannedSerials(dealId);
        return {
          ...current,
          ...scannedSerials,
        };
      });
    },
    []
  );

  const submitDeal = useCallback(
    async (deal: Deal) => {
      try {
        // Get all scanned serials
        const scannedSerials = getScannedSerials(deal.id);

        // Create a clean object for submission
        const dealToSubmit = {
          ...scannedSerials, // Include scanned serials
        };

        console.log("Submitting deal to Zoho:", {
          id: deal.id,
          updates: dealToSubmit,
        });

        await zohoSDK.updateDeal(deal.id, dealToSubmit);

        // Clear scanned serials after successful submit
        clearScannedSerials(deal.id);

        // Refresh deals
        await loadDeals();
      } catch (error) {
        console.error("Error submitting deal:", error);
        throw error; // Re-throw to handle in the component
      }
    },
    [loadDeals]
  );

  const getSerialNumber = useCallback(
    (dealId: string, serialKey: string) => {
      // Check for scanned serials first
      const scannedSerials = getScannedSerials(dealId);
      const deal = deals.find((d) => d.id === dealId);

      const serialValue =
        scannedSerials[serialKey] ||
        deal?.[serialKey as keyof Deal]?.toString() ||
        "No serial number";

      console.log("Getting serial number:", {
        dealId,
        serialKey,
        value: serialValue,
      });

      return serialValue;
    },
    [deals]
  );

  const clearSelectedDeal = useCallback(() => {
    if (selectedDeal) {
      clearScannedSerials(selectedDeal.id);
      setSelectedDeal(null);
    }
  }, [selectedDeal]);

  const value = {
    deals,
    selectedDeal,
    loading,
    loadDeals,
    selectDeal,
    addScannedSerial,
    submitDeal,
    getSerialNumber,
    clearSelectedDeal,
  };

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
};

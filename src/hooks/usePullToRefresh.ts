import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

interface PullToRefreshOptions {
  threshold?: number;
  maxPullDistance?: number;
}

export const usePullToRefresh = ({
  threshold = 150,
  maxPullDistance = 200,
}: PullToRefreshOptions = {}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      if (touch) {
        (e.target as any).dataset.startY = touch.pageY;
      }
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const startY = parseInt((e.target as any).dataset.startY || "0");

      if (window.scrollY === 0 && touch && startY) {
        const currentY = touch.pageY;
        const distance = Math.max(0, currentY - startY);

        // Apply resistance to the pull
        const dampedDistance = Math.min(maxPullDistance, distance * 0.5);
        setPullDistance(dampedDistance);

        // Prevent default scrolling when pulling
        if (distance > 0) {
          e.preventDefault();
        }
      }
    },
    [maxPullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      // Immediately refresh without delay
      window.location.reload();
    }
    setPullDistance(0);
    setIsRefreshing(false);
  }, [pullDistance, threshold]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
  };
};

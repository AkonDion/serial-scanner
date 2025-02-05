import ReactPullToRefresh from "react-pull-to-refresh";
import { useLocation } from "react-router-dom";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
}) => {
  const location = useLocation();

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      // Default behavior is to reload the page
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen relative">
      <ReactPullToRefresh
        onRefresh={handleRefresh}
        style={{
          textAlign: "initial",
          backgroundColor: "transparent",
        }}
        distanceToRefresh={70}
        resistance={2.5}
      >
        {children}
      </ReactPullToRefresh>
    </div>
  );
};

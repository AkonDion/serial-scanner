import ReactPullToRefresh from "react-pull-to-refresh";
import { useLocation } from "react-router-dom";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const location = useLocation();

  const handleRefresh = () => {
    return new Promise<void>((resolve) => {
      window.location.reload();
      resolve();
    });
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

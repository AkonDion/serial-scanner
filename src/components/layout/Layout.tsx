import { ReactNode } from "react";
import { PullToRefresh } from "@components/ui/PullToRefresh";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isScanner = location.pathname === "/scanner";

  return (
    <main className="relative min-h-screen isolate">
      <div className="relative z-10">
        {isScanner ? children : <PullToRefresh>{children}</PullToRefresh>}
      </div>
    </main>
  );
}

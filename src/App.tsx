import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import Layout from "@components/layout/Layout";
import { Toaster } from "@components/ui/Toaster";
import LoadingScreen from "@components/ui/LoadingScreen";
import HomePage from "@pages/HomePage";
import DealsPage from "@pages/DealsPage";
import ScannerPage from "@pages/ScannerPage";

function App() {
  return (
    <Router>
      <div className="app-container min-h-screen bg-black text-white">
        <Layout>
          <Suspense fallback={<LoadingScreen />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/scanner" element={<ScannerPage />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Layout>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { DealProvider } from "./context/DealContext";
import HomePage from "./pages/HomePage";
import DealsPage from "./pages/DealsPage";
import ScannerPage from "./pages/ScannerPage";

function App() {
  return (
    <DealProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </Router>
    </DealProvider>
  );
}

export default App;

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { zohoSDK } from "../services/zohoSDK";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize SDK and start prefetching deals
    zohoSDK.init().catch(console.error);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] max-w-md mx-auto relative px-6">
      <div className="w-full space-y-8 text-center">
        <div className="space-y-4 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl text-white">
            Serial Scanner
          </h1>
          <p className="text-sm text-zinc-400/90 sm:text-base">
            Scan and record serial numbers seamlessly with your Zoho CRM deals
          </p>
        </div>

        <button
          onClick={() => navigate("/deals")}
          className="w-full px-6 py-3.5 bg-white/10
                   text-white/90 rounded-lg font-medium
                   hover:bg-white/[0.15]
                   active:bg-white/20
                   border border-white/10
                   sm:w-auto sm:px-8"
        >
          Start Scanning
        </button>
      </div>
    </div>
  );
};

export default HomePage;

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
        },
      }}
    />
  );
}

export default Toaster;

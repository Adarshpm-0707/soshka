import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "./components/Reusable/Toast";

function App() {
  return (
    <>
      {/* Skip-to-content link for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#ff2a85] focus:text-white focus:font-bold focus:text-sm focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Route Wiring */}
      <main id="main-content">
        <AppRoutes />
      </main>

      {/* Global Toast Notification System */}
      <ToastContainer />
    </>
  );
}

export default App;

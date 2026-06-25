import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from './components/Reusable/Toast';

function App() {
  return (
    <>
      {/* Route Wiring */}
      <AppRoutes />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </>
  );
}

export default App;

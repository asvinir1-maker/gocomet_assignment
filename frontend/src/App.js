import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import ShipmentDetail from "./pages/ShipmentDetail";
import CustomerOrderDetail from "./pages/CustomerOrderDetail";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-white" data-testid="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/shipment/:id" element={<ShipmentDetail />} />
            <Route path="/order/:orderNo" element={<CustomerOrderDetail />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;

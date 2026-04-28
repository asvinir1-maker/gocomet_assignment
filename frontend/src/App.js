import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import ShipmentDetail from "./pages/ShipmentDetail";
import CustomerOrderDetail from "./pages/CustomerOrderDetail";
import Dashboard from "./pages/Dashboard";
import ReverseSearch from "./pages/ReverseSearch";
import Integrations from "./pages/Integrations";
import OrdersAndPOs from "./pages/OrdersAndPOs";
import Templates from "./pages/Templates";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-white" data-testid="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reverse-search" element={<ReverseSearch />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/orders-pos" element={<OrdersAndPOs />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/shipment/:id" element={<ShipmentDetail />} />
            <Route path="/order/:orderNo" element={<CustomerOrderDetail />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;

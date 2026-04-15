import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";

// Public pages
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CreateStore from "./pages/CreateStore";

// Store front (public vitrina)
import StoreFront from "./pages/store/StoreFront";
import StoreProductDetail from "./pages/store/StoreProductDetail";
import StoreCart from "./pages/store/StoreCart";
import StoreCheckout from "./pages/store/StoreCheckout";
import StoreOrderSuccess from "./pages/store/StoreOrderSuccess";
import StoreOrderStatus from "./pages/store/StoreOrderStatus";
import StoreLogin from "./pages/store/StoreLogin";
import StoreRegister from "./pages/store/StoreRegister";
import StoreAccount from "./pages/store/StoreAccount";

// Store owner dashboard
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/admin/Dashboard";
import DashboardOrders from "./pages/admin/Orders";
import DashboardOrderDetail from "./pages/admin/OrderDetail";
import DashboardProducts from "./pages/admin/Products";
import DashboardCategories from "./pages/admin/Categories";
import DashboardFinancial from "./pages/admin/Financial";
import StoreSettings from "./pages/dashboard/StoreSettings";
import DashboardCustomers from "./pages/admin/Customers";

// Platform admin
import PlatformAdmin from "./pages/platform/PlatformAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CustomerAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-store" element={<CreateStore />} />

            {/* Store vitrina (public) */}
            <Route path="/store/:slug" element={<StoreFront />} />
            <Route path="/store/:slug/products/:productSlug" element={<StoreProductDetail />} />
            <Route path="/store/:slug/cart" element={<StoreCart />} />
            <Route path="/store/:slug/checkout" element={<StoreCheckout />} />
            <Route path="/store/:slug/order-success" element={<StoreOrderSuccess />} />
            <Route path="/store/:slug/order/:orderNumber" element={<StoreOrderStatus />} />
            <Route path="/store/:slug/login" element={<StoreLogin />} />
            <Route path="/store/:slug/register" element={<StoreRegister />} />
            <Route path="/store/:slug/account" element={<StoreAccount />} />

            {/* Store owner dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="orders" element={<DashboardOrders />} />
              <Route path="orders/:id" element={<DashboardOrderDetail />} />
              <Route path="customers" element={<DashboardCustomers />} />
              <Route path="products" element={<DashboardProducts />} />
              <Route path="categories" element={<DashboardCategories />} />
              <Route path="financial" element={<DashboardFinancial />} />
              <Route path="settings" element={<StoreSettings />} />
            </Route>

            {/* Platform admin */}
            <Route path="/platform" element={<PlatformAdmin />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </CustomerAuthProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import LoginPage from "./components/login";
import SignUp from "./components/signup";
import Navbar from "./components/navbar";
import OpeningStock from "./views/opening/opening";
import SellPage from "./views/selling/selling";
import SellerDashboard from "./views/dashboard";
import BorrowerSettlement from "./views/tagade";
import SupplierDashboard from "./views/supplier/supplierList";
import SupplierDetails from "./views/supplier/supplierDetails";
import ExpensePage from "./views/expense";
import ProtectedRoute from "./components/protectedRoute";

function Layout({ children }) {
  const location = useLocation();

  // don’t show navbar on login/signup pages
  const hideNavbar = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen w-screen bg-gray-100">
      {!hideNavbar && (
        <div className="sticky top-0 z-50 shadow bg-white">
          <Navbar />
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function App() {
  return (
    <div className="flex items-center justify-center min-w-screen min-h-screen bg-gray-100">
      <Router>
        <div className="min-w-screen min-h-screen bg-gray-100">
          <Layout>
            <Routes>
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/opening"
                element={
                  <ProtectedRoute>
                    <OpeningStock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/selling"
                element={
                  <ProtectedRoute>
                    <SellPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tagade"
                element={
                  <ProtectedRoute>
                    <BorrowerSettlement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier"
                element={
                  <ProtectedRoute>
                    <SupplierDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers/:name"
                element={
                  <ProtectedRoute>
                    <SupplierDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expense"
                element={
                  <ProtectedRoute>
                    <ExpensePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </div>
      </Router>
    </div>
  );
}

export default App;

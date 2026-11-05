import { Outlet, Link } from "react-router-dom";
import { Store, ShoppingCart, User, Shield } from "lucide-react";

export default function CustomerLayout() {
  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="customer-brand">
          <div className="brand-logo customer">
            <Store size={22} />
          </div>
          <div>
            <h3>Smart Market</h3>
            <span className="customer-subtext">Quick Checkout & Cart</span>
          </div>
        </div>

        <nav className="customer-nav">
          <Link to="/customer" className="customer-nav-link active">Store</Link>
          <Link to="/admin" className="switch-to-admin-link">
            <Shield size={16} />
            <span>Admin Portal</span>
          </Link>
        </nav>
      </header>

      <main className="customer-content">
        <Outlet />
      </main>
    </div>
  );
}

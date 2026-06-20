import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          🎓 UniFind
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/recommendations" className={isActive("/recommendations")}>
                Recommendations
              </Link>
              <Link to="/universities" className={isActive("/universities")}>
                Universities
              </Link>
              <Link to="/scholarships" className={isActive("/scholarships")}>
                Scholarships
              </Link>
              <Link to="/favourites" className={isActive("/favourites")}>
                ❤️ Favourites
              </Link>
              <Link to="/profile" className={isActive("/profile")}>
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-100 transition text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive("/login")}>Login</Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

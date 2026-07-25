import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linkBase = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActive = "bg-gray-600 text-white shadow-sm";
const linkInactive = "text-gray-600 hover:bg-gray-100 hover:text-gray-700";

function navClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${isActive ? linkActive : linkInactive}`;
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-600 text-sm font-bold text-white shadow-sm">
              HH
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Hardware Hub
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {user?.role === "admin" ? (
              <>
                <NavLink to="/admin/hardware" className={navClass}>
                  Hardware
                </NavLink>
                <NavLink to="/admin/users" className={navClass}>
                  Users
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Hardware
                </NavLink>
                <NavLink to="/rentals/me" className={navClass}>
                  My Rentals
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">
                {user?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
          {user?.role === "admin" ? (
            <>
              <NavLink to="/admin/hardware" className={navClass}>
                Hardware
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                Users
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={navClass}>
                Hardware
              </NavLink>
              <NavLink to="/rentals/me" className={navClass}>
                Rentals
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

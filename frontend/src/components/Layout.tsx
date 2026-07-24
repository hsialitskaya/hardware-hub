import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linkBase = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActive = "bg-indigo-600 text-white shadow-sm";
const linkInactive = "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700";

function navClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${isActive ? linkActive : linkInactive}`;
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
              HH
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Hardware Hub
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/dashboard" className={navClass}>
              Sprzęt
            </NavLink>
            <NavLink to="/rentals/me" className={navClass}>
              Moje wypożyczenia
            </NavLink>
            <NavLink to="/search" className={navClass}>
              Wyszukiwarka AI
            </NavLink>
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin/hardware" className={navClass}>
                  Zarządzaj sprzętem
                </NavLink>
                <NavLink to="/admin/users" className={navClass}>
                  Użytkownicy
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.email}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role === "admin" ? "Administrator" : "Użytkownik"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              Wyloguj
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          <NavLink to="/dashboard" className={navClass}>
            Sprzęt
          </NavLink>
          <NavLink to="/rentals/me" className={navClass}>
            Wypożyczenia
          </NavLink>
          <NavLink to="/search" className={navClass}>
            AI
          </NavLink>
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin/hardware" className={navClass}>
                Sprzęt (admin)
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                Użytkownicy
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

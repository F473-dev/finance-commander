import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, Receipt, 
  Target, CreditCard, PiggyBank, Settings, LogOut, Menu, X 
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Akun' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { to: '/debts', icon: Receipt, label: 'Hutang/Piutang' },
  { to: '/budgets', icon: Target, label: 'Budget' },
  { to: '/savings', icon: PiggyBank, label: 'Tabungan' },
  { to: '/installments', icon: CreditCard, label: 'Cicilan' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card fixed h-full z-30">
        <div className="p-4 border-b border-border">
          <h1 className="text-base font-semibold tracking-tight">
            FinanceFlow <span className="text-primary">PRO</span>
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-surface-hover w-full transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="text-sm font-semibold">
          FinanceFlow <span className="text-primary">PRO</span>
        </h1>
        <button onClick={() => setMobileNav(!mobileNav)} className="text-foreground">
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileNav && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileNav(false)}
        >
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            transition={{ ease: [0.23, 1, 0.32, 1] }}
            className="w-60 h-full bg-card border-r border-border p-2 pt-16"
            onClick={e => e.stopPropagation()}
          >
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNav(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive w-full"
              >
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="p-4 lg:p-6 max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex justify-around py-1.5">
          {NAV_ITEMS.slice(0, 5).map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center py-1 px-2 text-[10px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon size={18} />
                <span className="mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

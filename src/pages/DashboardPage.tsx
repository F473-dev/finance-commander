import { useAuth } from '@/hooks/useAuth';
import { getAccounts, getTransactions, getDebtTransactions, getTotalDebt, getTotalReceivable, getBudgets, getCategories } from '@/lib/store';
import { formatCurrency, getCurrentPeriod } from '@/lib/format';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const accounts = getAccounts(user.id);
  const transactions = getTransactions(user.id);
  const period = getCurrentPeriod();
  const categories = getCategories(user.id);
  const budgets = getBudgets(user.id);

  const totalReal = accounts.reduce((s, a) => s + a.balanceReal, 0);
  const totalNet = accounts.reduce((s, a) => s + a.balanceNet, 0);
  const totalDebt = getTotalDebt(user.id);
  const totalReceivable = getTotalReceivable(user.id);

  const monthTx = transactions.filter(t => t.date.startsWith(period));
  const totalIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  // Expense by category for pie chart
  const expenseByCategory = monthTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Lainnya';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // Monthly data for bar chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mTx = transactions.filter(t => t.date.startsWith(p));
    monthlyData.push({
      month: d.toLocaleDateString('id-ID', { month: 'short' }),
      income: mTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
      expense: mTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    });
  }

  // Budget warnings
  const budgetWarnings = budgets.filter(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    if (!cat || b.period !== period) return false;
    const spent = monthTx.filter(t => t.categoryId === b.categoryId && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return spent >= b.amount * 0.8;
  });

  const debtRatio = totalReal > 0 ? (totalDebt / totalReal) * 100 : 0;

  const stats = [
    { label: 'Saldo Real', value: totalReal, color: 'text-primary', desc: 'Cash on hand' },
    { label: 'Saldo Asli', value: totalNet, color: 'text-blue', desc: 'Net worth' },
    { label: 'Total Hutang', value: totalDebt, color: 'text-destructive', desc: 'Liabilities' },
    { label: 'Total Piutang', value: totalReceivable, color: 'text-amber', desc: 'Receivables' },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Halo, {user.name} 👋</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="glass-surface rounded-xl p-4"
          >
            <p className="label-caps">{s.label}</p>
            <h2 className={`stat-value mt-1 ${s.color}`}>{formatCurrency(s.value)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Debt ratio warning */}
      {debtRatio > 50 && (
        <div className="glass-surface rounded-xl p-3 border-destructive/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-destructive" />
          <p className="text-xs text-destructive">Debt ratio: {debtRatio.toFixed(0)}% — Hutang melebihi 50% saldo real</p>
        </div>
      )}

      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-surface rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-primary" />
            <p className="label-caps">Pemasukan</p>
          </div>
          <p className="stat-value text-primary">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] text-muted-foreground">Bulan ini</p>
        </div>
        <div className="glass-surface rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={14} className="text-destructive" />
            <p className="label-caps">Pengeluaran</p>
          </div>
          <p className="stat-value text-destructive">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] text-muted-foreground">Bulan ini</p>
        </div>
      </div>

      {/* Budget warnings */}
      {budgetWarnings.length > 0 && (
        <div className="glass-surface rounded-xl p-4 space-y-2">
          <p className="label-caps flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber" />
            Peringatan Budget
          </p>
          {budgetWarnings.map(b => {
            const cat = categories.find(c => c.id === b.categoryId);
            const spent = monthTx.filter(t => t.categoryId === b.categoryId && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
            return (
              <div key={b.id} className="flex justify-between items-center text-xs">
                <span className="text-foreground">{cat?.name}</span>
                <span className={spent >= b.amount ? 'text-destructive' : 'text-amber'}>
                  {formatCurrency(spent)} / {formatCurrency(b.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass-surface rounded-xl p-4">
          <p className="label-caps mb-3">Pemasukan vs Pengeluaran (6 Bulan)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-surface rounded-xl p-4">
          <p className="label-caps mb-3">Pengeluaran per Kategori</p>
          <div className="h-48">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Belum ada data pengeluaran
              </div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account balances */}
      {accounts.length > 0 && (
        <div className="glass-surface rounded-xl p-4">
          <p className="label-caps mb-3">Saldo per Akun</p>
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: acc.color + '20', color: acc.color }}>
                    {acc.icon || '💰'}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{acc.type}</p>
                  </div>
                </div>
                <p className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(acc.balanceReal)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="glass-surface rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ArrowUpRight size={20} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Mulai kelola keuangan Anda</p>
          <p className="text-xs text-muted-foreground mt-1">Buat akun pertama Anda di menu Akun</p>
        </div>
      )}
    </div>
  );
}

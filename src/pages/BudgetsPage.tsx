import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getBudgets, saveBudget, deleteBudget, getCategories, getTransactions } from '@/lib/store';
import { Budget } from '@/lib/types';
import { formatCurrency, getCurrentPeriod } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetsPage() {
  const { user } = useAuth();
  const period = getCurrentPeriod();
  const [budgets, setBudgets] = useState(() => getBudgets(user!.id));
  const categories = getCategories(user!.id).filter(c => c.type === 'EXPENSE');
  const transactions = getTransactions(user!.id).filter(t => t.date.startsWith(period) && t.type === 'EXPENSE');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: 0 });

  const refresh = () => setBudgets(getBudgets(user!.id));

  const handleSave = () => {
    if (!form.categoryId || form.amount <= 0) return;
    const budget: Budget = { id: crypto.randomUUID(), userId: user!.id, categoryId: form.categoryId, amount: form.amount, period };
    saveBudget(budget);
    refresh();
    setShowForm(false);
    setForm({ categoryId: '', amount: 0 });
  };

  const currentBudgets = budgets.filter(b => b.period === period);

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Budget Bulanan</h1>
          <p className="text-xs text-muted-foreground">Periode: {period}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-surface rounded-xl p-4 space-y-3 overflow-hidden">
            <p className="text-sm font-medium">Budget Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-1">Kategori</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Pilih</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-caps block mb-1">Jumlah Budget</label>
                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium">Simpan</button>
              <button onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-xs">Batal</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {currentBudgets.map(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          const spent = transactions.filter(t => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
          const pct = Math.min((spent / b.amount) * 100, 100);
          const remaining = b.amount - spent;
          const daysInMonth = new Date(Number(period.split('-')[0]), Number(period.split('-')[1]), 0).getDate();
          const today = new Date().getDate();
          const daysLeft = daysInMonth - today;
          const burnRate = today > 0 ? spent / today : 0;
          const daysUntilOut = burnRate > 0 ? Math.floor(remaining / burnRate) : Infinity;

          return (
            <div key={b.id} className="glass-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{cat?.name || 'Unknown'}</p>
                <button onClick={() => { deleteBudget(b.id); refresh(); }} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Terpakai: {formatCurrency(spent)}</span>
                <span>Budget: {formatCurrency(b.amount)}</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-amber' : 'bg-primary'}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Sisa: {formatCurrency(Math.max(remaining, 0))}</span>
                <span>
                  {burnRate > 0
                    ? `Burn rate: ${formatCurrency(burnRate)}/hari • ${daysUntilOut > daysLeft ? '✓ Aman' : `⚠ Habis dalam ${daysUntilOut} hari`}`
                    : 'Belum ada pengeluaran'}
                </span>
              </div>
            </div>
          );
        })}
        {currentBudgets.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada budget untuk bulan ini</p>
          </div>
        )}
      </div>
    </div>
  );
}

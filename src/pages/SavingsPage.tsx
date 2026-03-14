import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSavingsGoals, saveSavingsGoal, deleteSavingsGoal } from '@/lib/store';
import { SavingsGoal } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Plus, Trash2, PiggyBank } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(() => getSavingsGoals(user!.id));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '' });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState(0);

  const refresh = () => setGoals(getSavingsGoals(user!.id));

  const handleSave = () => {
    if (!form.name.trim() || form.targetAmount <= 0) return;
    const goal: SavingsGoal = { id: crypto.randomUUID(), userId: user!.id, ...form };
    saveSavingsGoal(goal);
    refresh();
    setShowForm(false);
    setForm({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '' });
  };

  const handleAddSaving = (goal: SavingsGoal) => {
    if (addAmount <= 0) return;
    saveSavingsGoal({ ...goal, currentAmount: goal.currentAmount + addAmount });
    setAddingTo(null);
    setAddAmount(0);
    refresh();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Target Tabungan</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-surface rounded-xl p-4 space-y-3 overflow-hidden">
            <p className="text-sm font-medium">Target Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-caps block mb-1">Nama Target</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Contoh: Beli HP" />
              </div>
              <div>
                <label className="label-caps block mb-1">Target</label>
                <input type="number" value={form.targetAmount || ''} onChange={e => setForm({ ...form, targetAmount: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-caps block mb-1">Tanggal Target</label>
                <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
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
        {goals.map(g => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
          const remaining = g.targetAmount - g.currentAmount;
          return (
            <div key={g.id} className="glass-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PiggyBank size={16} className="text-primary" />
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                </div>
                <button onClick={() => { deleteSavingsGoal(g.id); refresh(); }} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{formatCurrency(g.currentAmount)}</span>
                <span>{formatCurrency(g.targetAmount)}</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Sisa: {formatCurrency(Math.max(remaining, 0))}</span>
                {g.targetDate && <span>Target: {formatDate(g.targetDate)}</span>}
              </div>
              <div className="mt-2">
                {addingTo === g.id ? (
                  <div className="flex gap-2">
                    <input type="number" value={addAmount || ''} onChange={e => setAddAmount(Number(e.target.value))} className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Jumlah" />
                    <button onClick={() => handleAddSaving(g)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs">Tambah</button>
                    <button onClick={() => setAddingTo(null)} className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-xs">Batal</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingTo(g.id)} className="text-xs text-primary hover:underline">+ Tambah tabungan</button>
                )}
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada target tabungan</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getInstallments, saveInstallment, deleteInstallment } from '@/lib/store';
import { Installment } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Plus, Trash2, CreditCard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallmentsPage() {
  const { user } = useAuth();
  const [installments, setInstallments] = useState(() => getInstallments(user!.id));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', totalAmount: 0, months: 12, monthlyPayment: 0, dueDay: 1, startDate: new Date().toISOString().split('T')[0] });

  const refresh = () => setInstallments(getInstallments(user!.id));

  const handleSave = () => {
    if (!form.name.trim() || form.totalAmount <= 0 || form.months <= 0) return;
    const monthly = form.monthlyPayment || Math.ceil(form.totalAmount / form.months);
    const inst: Installment = {
      id: crypto.randomUUID(),
      userId: user!.id,
      name: form.name,
      totalAmount: form.totalAmount,
      months: form.months,
      monthlyPayment: monthly,
      dueDay: form.dueDay,
      paidMonths: 0,
      startDate: form.startDate,
    };
    saveInstallment(inst);
    refresh();
    setShowForm(false);
    setForm({ name: '', totalAmount: 0, months: 12, monthlyPayment: 0, dueDay: 1, startDate: new Date().toISOString().split('T')[0] });
  };

  const handlePay = (inst: Installment) => {
    if (inst.paidMonths < inst.months) {
      saveInstallment({ ...inst, paidMonths: inst.paidMonths + 1 });
      refresh();
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Cicilan</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-surface rounded-xl p-4 space-y-3 overflow-hidden">
            <p className="text-sm font-medium">Cicilan Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-caps block mb-1">Nama</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Contoh: Cicilan HP" />
              </div>
              <div>
                <label className="label-caps block mb-1">Total</label>
                <input type="number" value={form.totalAmount || ''} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-caps block mb-1">Lama (bulan)</label>
                <input type="number" value={form.months} onChange={e => setForm({ ...form, months: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-caps block mb-1">Bayar/bulan</label>
                <input type="number" value={form.monthlyPayment || ''} onChange={e => setForm({ ...form, monthlyPayment: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Auto" />
              </div>
              <div>
                <label className="label-caps block mb-1">Jatuh Tempo (tgl)</label>
                <input type="number" min={1} max={31} value={form.dueDay} onChange={e => setForm({ ...form, dueDay: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
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
        {installments.map(inst => {
          const pct = (inst.paidMonths / inst.months) * 100;
          const remaining = inst.totalAmount - (inst.paidMonths * inst.monthlyPayment);
          const isDone = inst.paidMonths >= inst.months;
          return (
            <div key={inst.id} className="glass-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className={isDone ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="text-sm font-medium text-foreground">{inst.name}</p>
                  {isDone && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">LUNAS</span>}
                </div>
                <button onClick={() => { deleteInstallment(inst.id); refresh(); }} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{inst.paidMonths}/{inst.months} bulan</span>
                <span>{formatCurrency(inst.monthlyPayment)}/bln</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Sisa: {formatCurrency(Math.max(remaining, 0))}</span>
                <span>Jatuh tempo: Tanggal {inst.dueDay}</span>
              </div>
              {!isDone && (
                <button onClick={() => handlePay(inst)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                  <Check size={12} /> Bayar bulan ini
                </button>
              )}
            </div>
          );
        })}
        {installments.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada cicilan</p>
          </div>
        )}
      </div>
    </div>
  );
}

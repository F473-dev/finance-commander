import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDebtTransactions, saveDebtTransaction, getTotalDebt, getTotalReceivable, getAccounts } from '@/lib/store';
import { DebtTransaction, DebtType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowDownRight, ArrowUpLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEBT_TYPES: { value: DebtType; label: string; desc: string; icon: typeof ArrowDownLeft }[] = [
  { value: 'PINJAM_UANG', label: 'Pinjam Uang', desc: '+Real, +Hutang', icon: ArrowDownLeft },
  { value: 'BAYAR_HUTANG', label: 'Bayar Hutang', desc: '-Real, -Hutang', icon: ArrowUpRight },
  { value: 'KASIH_PINJAM', label: 'Kasih Pinjam', desc: '-Real, +Piutang', icon: ArrowUpLeft },
  { value: 'TERIMA_PIUTANG', label: 'Terima Piutang', desc: '+Real, -Piutang', icon: ArrowDownRight },
];

export default function DebtsPage() {
  const { user } = useAuth();
  const [debts, setDebts] = useState(() => getDebtTransactions(user!.id));
  const accounts = getAccounts(user!.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'PINJAM_UANG' as DebtType,
    accountId: accounts[0]?.id || '',
    personName: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const refresh = () => setDebts(getDebtTransactions(user!.id));
  const totalDebt = getTotalDebt(user!.id);
  const totalReceivable = getTotalReceivable(user!.id);

  const handleSave = () => {
    if (!form.accountId || !form.personName.trim() || form.amount <= 0) return;
    const dt: DebtTransaction = {
      id: crypto.randomUUID(),
      userId: user!.id,
      ...form,
    };
    saveDebtTransaction(dt);
    refresh();
    setShowForm(false);
    setForm({ type: 'PINJAM_UANG', accountId: accounts[0]?.id || '', personName: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Hutang & Piutang</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-surface rounded-xl p-4">
          <p className="label-caps">Total Hutang</p>
          <p className="stat-value text-destructive mt-1">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="glass-surface rounded-xl p-4">
          <p className="label-caps">Total Piutang</p>
          <p className="stat-value text-amber mt-1">{formatCurrency(totalReceivable)}</p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-surface rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-medium">Tambah Hutang/Piutang</p>
            <div className="grid grid-cols-2 gap-2">
              {DEBT_TYPES.map(dt => (
                <button
                  key={dt.value}
                  onClick={() => setForm({ ...form, type: dt.value })}
                  className={`p-2.5 rounded-lg border text-left text-xs ${
                    form.type === dt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  <dt.icon size={14} className="mb-1" />
                  <p className="font-medium text-foreground">{dt.label}</p>
                  <p className="text-[10px] opacity-70">{dt.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-1">Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="label-caps block mb-1">Akun</label>
                <select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Pilih akun</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-caps block mb-1">Nama Orang</label>
                <input value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nama" />
              </div>
              <div>
                <label className="label-caps block mb-1">Jumlah</label>
                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="col-span-2">
                <label className="label-caps block mb-1">Keterangan</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Opsional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium">Simpan</button>
              <button onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-xs">Batal</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-1.5">
        {debts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(dt => {
          const acc = accounts.find(a => a.id === dt.accountId);
          const typeInfo = DEBT_TYPES.find(t => t.value === dt.type)!;
          const isDebt = dt.type === 'PINJAM_UANG' || dt.type === 'BAYAR_HUTANG';
          return (
            <div key={dt.id} className="glass-surface rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDebt ? 'bg-destructive/10' : 'bg-amber/10'}`}>
                  <typeInfo.icon size={14} className={isDebt ? 'text-destructive' : 'text-amber'} />
                </div>
                <div>
                  <p className="text-sm text-foreground">{typeInfo.label} — {dt.personName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(dt.date)} • {acc?.name} {dt.description ? `• ${dt.description}` : ''}</p>
                </div>
              </div>
              <p className={`text-sm font-medium tabular-nums ${isDebt ? 'text-destructive' : 'text-amber'}`}>
                {formatCurrency(dt.amount)}
              </p>
            </div>
          );
        })}
        {debts.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada data hutang/piutang</p>
          </div>
        )}
      </div>
    </div>
  );
}

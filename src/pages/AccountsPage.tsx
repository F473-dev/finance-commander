import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAccounts, saveAccount, deleteAccount } from '@/lib/store';
import { Account, AccountType } from '@/lib/types';
import { formatCurrency, ACCOUNT_COLORS, ACCOUNT_ICONS } from '@/lib/format';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'KAS', label: 'Kas' },
  { value: 'DOMPET', label: 'Dompet' },
  { value: 'BANK', label: 'Bank' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'TABUNGAN', label: 'Tabungan' },
  { value: 'MODAL', label: 'Modal Usaha' },
];

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(() => getAccounts(user!.id));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', type: 'KAS' as AccountType, balanceReal: 0, balanceNet: 0, color: ACCOUNT_COLORS[0] });

  const refresh = () => setAccounts(getAccounts(user!.id));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const account: Account = {
      id: editing?.id || crypto.randomUUID(),
      userId: user!.id,
      name: form.name,
      type: form.type,
      balanceReal: form.balanceReal,
      balanceNet: form.balanceNet,
      color: form.color,
      icon: ACCOUNT_ICONS[form.type] || '💰',
    };
    saveAccount(account);
    refresh();
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', type: 'KAS', balanceReal: 0, balanceNet: 0, color: ACCOUNT_COLORS[0] });
  };

  const handleEdit = (acc: Account) => {
    setEditing(acc);
    setForm({ name: acc.name, type: acc.type, balanceReal: acc.balanceReal, balanceNet: acc.balanceNet, color: acc.color });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus akun ini?')) {
      deleteAccount(id);
      refresh();
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Akun Saldo</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', type: 'KAS', balanceReal: 0, balanceNet: 0, color: ACCOUNT_COLORS[0] }); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-surface rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-medium">{editing ? 'Edit Akun' : 'Akun Baru'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-1">Nama Akun</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoh: BCA"
                />
              </div>
              <div>
                <label className="label-caps block mb-1">Tipe</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as AccountType })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-caps block mb-1">Saldo Real</label>
                <input
                  type="number"
                  value={form.balanceReal}
                  onChange={e => setForm({ ...form, balanceReal: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="label-caps block mb-1">Saldo Asli</label>
                <input
                  type="number"
                  value={form.balanceNet}
                  onChange={e => setForm({ ...form, balanceNet: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="label-caps block mb-1">Warna</label>
              <div className="flex gap-2">
                {ACCOUNT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-6 h-6 rounded-full border-2 ${form.color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium">
                Simpan
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-xs">
                Batal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {accounts.map(acc => (
          <motion.div
            key={acc.id}
            layout
            className="glass-surface rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ background: acc.color + '20' }}
              >
                {acc.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{acc.name}</p>
                <p className="text-[10px] text-muted-foreground">{acc.type}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold tabular-nums text-primary">{formatCurrency(acc.balanceReal)}</p>
                <p className="text-[10px] text-muted-foreground">Asli: {formatCurrency(acc.balanceNet)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {accounts.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada akun. Buat akun pertama Anda!</p>
          </div>
        )}
      </div>
    </div>
  );
}

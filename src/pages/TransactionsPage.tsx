import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTransactions, saveTransaction, deleteTransaction, getAccounts, getCategories } from '@/lib/store';
import { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Plus, Trash2, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState(() => getTransactions(user!.id));
  const accounts = getAccounts(user!.id);
  const categories = getCategories(user!.id);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [form, setForm] = useState({
    type: 'EXPENSE' as TransactionType,
    accountId: accounts[0]?.id || '',
    categoryId: '',
    subCategoryId: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const refresh = () => setTransactions(getTransactions(user!.id));

  const filteredCategories = categories.filter(c => c.type === form.type);
  const selectedCategory = categories.find(c => c.id === form.categoryId);

  const handleSave = () => {
    if (!form.accountId || !form.categoryId || form.amount <= 0) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      userId: user!.id,
      ...form,
    };
    saveTransaction(tx);
    refresh();
    setShowForm(false);
    setForm({ type: 'EXPENSE', accountId: accounts[0]?.id || '', categoryId: '', subCategoryId: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      deleteTransaction(id);
      refresh();
    }
  };

  const filtered = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .filter(t => filterAccount === 'ALL' || t.accountId === filterAccount)
    .filter(t => filterCategory === 'ALL' || t.categoryId === filterCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Transaksi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="ALL">Semua Jenis</option>
          <option value="INCOME">Pemasukan</option>
          <option value="EXPENSE">Pengeluaran</option>
        </select>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="ALL">Semua Akun</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="ALL">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
            <p className="text-sm font-medium">Transaksi Baru</p>
            {/* Type toggle */}
            <div className="flex gap-1 bg-background rounded-lg p-0.5">
              {(['INCOME', 'EXPENSE'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, categoryId: '', subCategoryId: '' })}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    form.type === t
                      ? t === 'INCOME' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
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
                <label className="label-caps block mb-1">Kategori</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value, subCategoryId: '' })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Pilih kategori</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {selectedCategory && selectedCategory.subCategories.length > 0 && (
                <div>
                  <label className="label-caps block mb-1">Sub Kategori</label>
                  <select value={form.subCategoryId} onChange={e => setForm({ ...form, subCategoryId: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Pilih sub</option>
                    {selectedCategory.subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label-caps block mb-1">Jumlah</label>
                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
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
        {filtered.map(tx => {
          const acc = accounts.find(a => a.id === tx.accountId);
          const cat = categories.find(c => c.id === tx.categoryId);
          const sub = cat?.subCategories.find(s => s.id === tx.subCategoryId);
          return (
            <motion.div key={tx.id} layout className="glass-surface rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {tx.type === 'INCOME' ? <TrendingUp size={14} className="text-primary" /> : <TrendingDown size={14} className="text-destructive" />}
                </div>
                <div>
                  <p className="text-sm text-foreground">{cat?.name}{sub ? ` › ${sub.name}` : ''}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(tx.date)} • {acc?.name} {tx.description ? `• ${tx.description}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium tabular-nums ${tx.type === 'INCOME' ? 'text-primary' : 'text-destructive'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <button onClick={() => handleDelete(tx.id)} className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-surface rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
}

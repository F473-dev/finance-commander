import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCategories, saveCategory, deleteCategory, exportAllData, importData } from '@/lib/store';
import { Category, SubCategory } from '@/lib/types';
import { Plus, Trash2, Download, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState(() => getCategories(user!.id));
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newSubName, setNewSubName] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);

  const refresh = () => setCategories(getCategories(user!.id));

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const cat: Category = { id: crypto.randomUUID(), userId: user!.id, name: newCatName, type: newCatType, subCategories: [] };
    saveCategory(cat);
    refresh();
    setNewCatName('');
    setShowAddCat(false);
  };

  const handleAddSub = (cat: Category) => {
    if (!newSubName.trim()) return;
    const sub: SubCategory = { id: crypto.randomUUID(), name: newSubName };
    saveCategory({ ...cat, subCategories: [...cat.subCategories, sub] });
    refresh();
    setNewSubName('');
    setAddingSubTo(null);
  };

  const handleExportJSON = () => {
    const data = exportAllData(user!.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = exportAllData(user!.id);
    const rows = [['Date', 'Type', 'Amount', 'Description', 'Category']];
    data.transactions.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      rows.push([t.date, t.type, String(t.amount), t.description, cat?.name || '']);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        importData(user!.id, data);
        refresh();
        alert('Data berhasil diimpor!');
      } catch {
        alert('File tidak valid');
      }
    };
    input.click();
  };

  const incomeCategories = categories.filter(c => c.type === 'INCOME');
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  return (
    <div className="space-y-6 pb-20 lg:pb-4">
      <h1 className="text-lg font-semibold tracking-tight">Pengaturan</h1>

      {/* Profile */}
      <div className="glass-surface rounded-xl p-4">
        <p className="label-caps mb-2">Profil</p>
        <p className="text-sm text-foreground">{user?.name}</p>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      {/* Export/Import */}
      <div className="glass-surface rounded-xl p-4 space-y-3">
        <p className="label-caps">Export & Import</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs">
            <Download size={14} /> Export JSON
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleImport} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs">
            <Upload size={14} /> Import
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="glass-surface rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label-caps">Kategori</p>
          <button onClick={() => setShowAddCat(true)} className="flex items-center gap-1 text-primary text-xs">
            <Plus size={12} /> Tambah
          </button>
        </div>

        <AnimatePresence>
          {showAddCat && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              <div className="flex gap-2">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nama kategori" />
                <select value={newCatType} onChange={e => setNewCatType(e.target.value as any)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs">
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
                <button onClick={handleAddCategory} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs">Simpan</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {[{ title: 'Pemasukan', cats: incomeCategories }, { title: 'Pengeluaran', cats: expenseCategories }].map(group => (
          <div key={group.title}>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.title}</p>
            <div className="space-y-1">
              {group.cats.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-hover">
                    <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="flex items-center gap-1.5 text-sm text-foreground">
                      {cat.subCategories.length > 0 ? (expandedCat === cat.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
                      {cat.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAddingSubTo(addingSubTo === cat.id ? null : cat.id)} className="p-1 text-muted-foreground hover:text-primary">
                        <Plus size={10} />
                      </button>
                      {!cat.isDefault && (
                        <button onClick={() => { deleteCategory(cat.id); refresh(); }} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  {addingSubTo === cat.id && (
                    <div className="flex gap-2 ml-6 mt-1">
                      <input value={newSubName} onChange={e => setNewSubName(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Sub kategori baru" />
                      <button onClick={() => handleAddSub(cat)} className="bg-primary text-primary-foreground px-2 py-1 rounded-lg text-[10px]">Tambah</button>
                    </div>
                  )}
                  {expandedCat === cat.id && cat.subCategories.length > 0 && (
                    <div className="ml-6 space-y-0.5">
                      {cat.subCategories.map(sub => (
                        <p key={sub.id} className="text-xs text-muted-foreground py-0.5">• {sub.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full bg-destructive/10 text-destructive py-2.5 rounded-lg text-sm font-medium">
        Keluar
      </button>
    </div>
  );
}

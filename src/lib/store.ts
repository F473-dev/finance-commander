import { Account, Budget, Category, DebtTransaction, DebtType, Installment, SavingsGoal, Transaction, User } from './types';

const STORAGE_PREFIX = 'ffpro_';

function getKey(key: string) { return STORAGE_PREFIX + key; }

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, data: unknown) {
  localStorage.setItem(getKey(key), JSON.stringify(data));
}

// Auth
export function getUsers(): User[] { return load('users', []); }
export function saveUsers(users: User[]) { save('users', users); }
export function getCurrentUser(): User | null { return load('currentUser', null); }
export function setCurrentUser(user: User | null) { save('currentUser', user); }

export function register(email: string, name: string, password: string): User | string {
  const users = getUsers();
  if (users.find(u => u.email === email)) return 'Email sudah terdaftar';
  const user: User = { id: crypto.randomUUID(), email, name, passwordHash: btoa(password) };
  users.push(user);
  saveUsers(users);
  initDefaultCategories(user.id);
  return user;
}

export function login(email: string, password: string): User | string {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.passwordHash === btoa(password));
  if (!user) return 'Email atau password salah';
  setCurrentUser(user);
  return user;
}

export function logout() { setCurrentUser(null); }

// Accounts
export function getAccounts(userId: string): Account[] {
  return load<Account[]>('accounts', []).filter(a => a.userId === userId);
}
export function saveAccount(account: Account) {
  const all = load<Account[]>('accounts', []);
  const idx = all.findIndex(a => a.id === account.id);
  if (idx >= 0) all[idx] = account; else all.push(account);
  save('accounts', all);
}
export function deleteAccount(id: string) {
  save('accounts', load<Account[]>('accounts', []).filter(a => a.id !== id));
}

// Transactions
export function getTransactions(userId: string): Transaction[] {
  return load<Transaction[]>('transactions', []).filter(t => t.userId === userId);
}
export function saveTransaction(tx: Transaction) {
  const all = load<Transaction[]>('transactions', []);
  const idx = all.findIndex(t => t.id === tx.id);
  if (idx >= 0) all[idx] = tx; else all.push(tx);
  save('transactions', all);

  // Update account balance
  const accounts = load<Account[]>('accounts', []);
  const acc = accounts.find(a => a.id === tx.accountId);
  if (acc) {
    if (idx < 0) { // new transaction
      if (tx.type === 'INCOME') {
        acc.balanceReal += tx.amount;
        acc.balanceNet += tx.amount;
      } else {
        acc.balanceReal -= tx.amount;
        acc.balanceNet -= tx.amount;
      }
      save('accounts', accounts);
    }
  }
}
export function deleteTransaction(id: string) {
  const all = load<Transaction[]>('transactions', []);
  const tx = all.find(t => t.id === id);
  if (tx) {
    const accounts = load<Account[]>('accounts', []);
    const acc = accounts.find(a => a.id === tx.accountId);
    if (acc) {
      if (tx.type === 'INCOME') {
        acc.balanceReal -= tx.amount;
        acc.balanceNet -= tx.amount;
      } else {
        acc.balanceReal += tx.amount;
        acc.balanceNet += tx.amount;
      }
      save('accounts', accounts);
    }
  }
  save('transactions', all.filter(t => t.id !== id));
}

// Debt Transactions
export function getDebtTransactions(userId: string): DebtTransaction[] {
  return load<DebtTransaction[]>('debts', []).filter(d => d.userId === userId);
}
export function saveDebtTransaction(dt: DebtTransaction) {
  const all = load<DebtTransaction[]>('debts', []);
  all.push(dt);
  save('debts', all);

  const accounts = load<Account[]>('accounts', []);
  const acc = accounts.find(a => a.id === dt.accountId);
  if (!acc) return;

  switch (dt.type as DebtType) {
    case 'PINJAM_UANG':
      acc.balanceReal += dt.amount;
      // balanceNet stays same
      break;
    case 'BAYAR_HUTANG':
      acc.balanceReal -= dt.amount;
      acc.balanceNet -= 0; // net was never affected
      break;
    case 'KASIH_PINJAM':
      acc.balanceReal -= dt.amount;
      // balanceNet stays same (cash -> receivable)
      break;
    case 'TERIMA_PIUTANG':
      acc.balanceReal += dt.amount;
      // balanceNet stays same
      break;
  }
  save('accounts', accounts);
}
export function deleteDebtTransaction(id: string) {
  save('debts', load<DebtTransaction[]>('debts', []).filter(d => d.id !== id));
}

export function getTotalDebt(userId: string): number {
  const debts = getDebtTransactions(userId);
  const pinjam = debts.filter(d => d.type === 'PINJAM_UANG').reduce((s, d) => s + d.amount, 0);
  const bayar = debts.filter(d => d.type === 'BAYAR_HUTANG').reduce((s, d) => s + d.amount, 0);
  return pinjam - bayar;
}

export function getTotalReceivable(userId: string): number {
  const debts = getDebtTransactions(userId);
  const kasih = debts.filter(d => d.type === 'KASIH_PINJAM').reduce((s, d) => s + d.amount, 0);
  const terima = debts.filter(d => d.type === 'TERIMA_PIUTANG').reduce((s, d) => s + d.amount, 0);
  return kasih - terima;
}

// Categories
export function getCategories(userId: string): Category[] {
  return load<Category[]>('categories', []).filter(c => c.userId === userId);
}
export function saveCategory(cat: Category) {
  const all = load<Category[]>('categories', []);
  const idx = all.findIndex(c => c.id === cat.id);
  if (idx >= 0) all[idx] = cat; else all.push(cat);
  save('categories', all);
}
export function deleteCategory(id: string) {
  save('categories', load<Category[]>('categories', []).filter(c => c.id !== id));
}

function initDefaultCategories(userId: string) {
  const defaults: Omit<Category, 'id'>[] = [
    { userId, name: 'Gaji', type: 'INCOME', subCategories: [], isDefault: true },
    { userId, name: 'Uang Jualan', type: 'INCOME', subCategories: [], isDefault: true },
    { userId, name: 'Jasa Servis', type: 'INCOME', subCategories: [
      { id: crypto.randomUUID(), name: 'Ganti LCD' },
      { id: crypto.randomUUID(), name: 'Ganti Baterai' },
      { id: crypto.randomUUID(), name: 'Flash' },
      { id: crypto.randomUUID(), name: 'Service Mesin' },
    ], isDefault: true },
    { userId, name: 'Kendaraan', type: 'EXPENSE', subCategories: [
      { id: crypto.randomUUID(), name: 'Bensin' },
      { id: crypto.randomUUID(), name: 'Ganti Oli' },
      { id: crypto.randomUUID(), name: 'Service' },
    ], isDefault: true },
    { userId, name: 'Uang Jajan', type: 'EXPENSE', subCategories: [
      { id: crypto.randomUUID(), name: 'Makanan' },
      { id: crypto.randomUUID(), name: 'Minuman' },
      { id: crypto.randomUUID(), name: 'Rokok' },
    ], isDefault: true },
    { userId, name: 'Uang Makan', type: 'EXPENSE', subCategories: [], isDefault: true },
    { userId, name: 'Belanja', type: 'EXPENSE', subCategories: [], isDefault: true },
    { userId, name: 'Listrik', type: 'EXPENSE', subCategories: [], isDefault: true },
    { userId, name: 'Internet', type: 'EXPENSE', subCategories: [], isDefault: true },
  ];
  defaults.forEach(d => saveCategory({ ...d, id: crypto.randomUUID() }));
}

// Budgets
export function getBudgets(userId: string): Budget[] {
  return load<Budget[]>('budgets', []).filter(b => b.userId === userId);
}
export function saveBudget(budget: Budget) {
  const all = load<Budget[]>('budgets', []);
  const idx = all.findIndex(b => b.id === budget.id);
  if (idx >= 0) all[idx] = budget; else all.push(budget);
  save('budgets', all);
}
export function deleteBudget(id: string) {
  save('budgets', load<Budget[]>('budgets', []).filter(b => b.id !== id));
}

// Savings Goals
export function getSavingsGoals(userId: string): SavingsGoal[] {
  return load<SavingsGoal[]>('savingsGoals', []).filter(g => g.userId === userId);
}
export function saveSavingsGoal(goal: SavingsGoal) {
  const all = load<SavingsGoal[]>('savingsGoals', []);
  const idx = all.findIndex(g => g.id === goal.id);
  if (idx >= 0) all[idx] = goal; else all.push(goal);
  save('savingsGoals', all);
}
export function deleteSavingsGoal(id: string) {
  save('savingsGoals', load<SavingsGoal[]>('savingsGoals', []).filter(g => g.id !== id));
}

// Installments
export function getInstallments(userId: string): Installment[] {
  return load<Installment[]>('installments', []).filter(i => i.userId === userId);
}
export function saveInstallment(inst: Installment) {
  const all = load<Installment[]>('installments', []);
  const idx = all.findIndex(i => i.id === inst.id);
  if (idx >= 0) all[idx] = inst; else all.push(inst);
  save('installments', all);
}
export function deleteInstallment(id: string) {
  save('installments', load<Installment[]>('installments', []).filter(i => i.id !== id));
}

// Export/Import
export function exportAllData(userId: string) {
  return {
    accounts: getAccounts(userId),
    transactions: getTransactions(userId),
    debts: getDebtTransactions(userId),
    categories: getCategories(userId),
    budgets: getBudgets(userId),
    savingsGoals: getSavingsGoals(userId),
    installments: getInstallments(userId),
  };
}

export function importData(userId: string, data: ReturnType<typeof exportAllData>) {
  data.accounts.forEach(a => saveAccount({ ...a, userId }));
  data.transactions.forEach(t => {
    const all = load<Transaction[]>('transactions', []);
    all.push({ ...t, userId });
    save('transactions', all);
  });
  data.debts.forEach(d => {
    const all = load<DebtTransaction[]>('debts', []);
    all.push({ ...d, userId });
    save('debts', all);
  });
  data.categories.forEach(c => saveCategory({ ...c, userId }));
  data.budgets.forEach(b => saveBudget({ ...b, userId }));
  data.savingsGoals.forEach(g => saveSavingsGoal({ ...g, userId }));
  data.installments.forEach(i => saveInstallment({ ...i, userId }));
}

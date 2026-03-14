export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type AccountType = 'KAS' | 'DOMPET' | 'BANK' | 'EWALLET' | 'TABUNGAN' | 'MODAL';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balanceReal: number;
  balanceNet: number;
  color: string;
  icon: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type DebtType = 'PINJAM_UANG' | 'BAYAR_HUTANG' | 'KASIH_PINJAM' | 'TERIMA_PIUTANG';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  categoryId: string;
  subCategoryId?: string;
  amount: number;
  description: string;
  date: string;
  attachmentUrl?: string;
}

export interface DebtTransaction {
  id: string;
  userId: string;
  accountId: string;
  type: DebtType;
  personName: string;
  amount: number;
  description: string;
  date: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  subCategories: SubCategory[];
  isDefault?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface Installment {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  months: number;
  monthlyPayment: number;
  dueDay: number;
  paidMonths: number;
  startDate: string;
}

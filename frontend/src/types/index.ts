export interface User {
  email: string;
  name: string;
}

export interface SplitInput {
  userEmail: string;
  paidAmount: number;
  owedAmount: number;
}

export interface ExpenseRequest {
  title: string;
  description: string;
  amount: number;
  emails?: string[];
  split: SplitInput[];
}

export interface Split {
  id?: number;
  user: User;
  paidAmount: number;
  owedAmount: number;
}

export interface Expense {
  expenseId: string;
  title: string;
  description: string;
  amount: number;
  splits: Split[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Group {
  groupId: string;
  title: string;
  members: User[];
  expenses: Expense[];
  direct?: boolean;
  isDirect?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIndividualRequest {
  email2: string;
}

export interface Transaction {
  transactionId: string;
  groupId: string;
  fromUser: User;
  toUser: User;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  jwtToken: string;
}

export interface CreateGroupRequest {
  title: string;
  emails: string[];
}

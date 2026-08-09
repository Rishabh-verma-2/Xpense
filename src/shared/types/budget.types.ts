export interface Budget {
  id: string;
  categoryId: string | null; // null = overall monthly budget
  amount: number;
  month: string; // YYYY-MM
  notifyAt70: boolean;
  notifyAt90: boolean;
  notifyAt100: boolean;
  carryForward: boolean;
  createdAt: string;
  updatedAt: string;
}

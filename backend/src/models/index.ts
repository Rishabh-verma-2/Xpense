// ─── Model barrel export ──────────────────────────────────────────────────────
// Import from here instead of individual files:
//   import { User, Transaction, Category } from '../models';

export { User }          from './User';
export { Category }      from './Category';
export { Transaction }   from './Transaction';
export { Budget }        from './Budget';
export { Goal }          from './Goal';
export { RefreshToken }  from './RefreshToken';

// Type re-exports
export type { IUser }         from './User';
export type { ICategory }     from './Category';
export type { ITransaction }  from './Transaction';
export type { IBudget }       from './Budget';
export type { IGoal }         from './Goal';
export type { IRefreshToken } from './RefreshToken';

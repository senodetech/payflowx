import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export interface UserState {
  id: string;
  email: string;
  role: string;
  merchantId: string;
}

export interface AppState {
  user: UserState | null;
  accessToken: string | null;
  balances: any[];
  payments: any[];
  keys: any[];
  webhooks: any[];
  webhookLogs: any[];
  isLoading: boolean;
}

const initialState: AppState = {
  user: null,
  accessToken: null,
  balances: [],
  payments: [],
  keys: [],
  webhooks: [],
  webhookLogs: [],
  isLoading: false,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },
    setAuth(user: UserState, accessToken: string) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('merchantId', user.merchantId);
      patchState(store, { user, accessToken });
    },
    clearAuth() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('merchantId');
      patchState(store, { ...initialState });
    },
    setBalances(balances: any[]) {
      patchState(store, { balances });
    },
    setPayments(payments: any[]) {
      patchState(store, { payments });
    },
    setKeys(keys: any[]) {
      patchState(store, { keys });
    },
    setWebhooks(webhooks: any[]) {
      patchState(store, { webhooks });
    },
    setWebhookLogs(webhookLogs: any[]) {
      patchState(store, { webhookLogs });
    },
    // Hydrate state from localStorage on init
    hydrate() {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      const merchantId = localStorage.getItem('merchantId');
      
      if (token && role && merchantId) {
        patchState(store, {
          accessToken: token,
          user: {
            id: '',
            email: '',
            role,
            merchantId,
          },
        });
      }
    }
  }))
);

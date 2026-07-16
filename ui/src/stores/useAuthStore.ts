import { useSyncExternalStore } from "react";

import { setApiAccessToken } from "@/api/session";
import type { LoginResponse } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: LoginResponse["user_profile"] | null;
  roles: LoginResponse["roles"];
  pages: LoginResponse["pages"];
};

type AuthStore = AuthState & {
  setAuth: (data: LoginResponse) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
};

type PersistedAuthState = Partial<
  Pick<AuthState, "accessToken" | "refreshToken" | "roles" | "pages">
>;

const STORAGE_KEY = "auth-storage";

const emptyAuthState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  roles: [],
  pages: [],
};

const listeners = new Set<() => void>();

function readPersistedAuthState(): PersistedAuthState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as { state?: PersistedAuthState };
    return parsedValue.state ?? {};
  } catch {
    return {};
  }
}

function writePersistedAuthState(state: AuthState) {
  if (typeof window === "undefined") {
    return;
  }

  const persistedState: PersistedAuthState = {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    roles: state.roles,
    pages: state.pages,
  };

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state: persistedState, version: 0 }),
  );
}

function removePersistedAuthState() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: Partial<AuthState>) {
  storeState = { ...storeState, ...nextState };
  writePersistedAuthState(storeState);
  emitChange();
}

const persistedState = readPersistedAuthState();

let storeState: AuthStore = {
  ...emptyAuthState,
  ...persistedState,
  setAuth: (data) => {
    setApiAccessToken(data.access_token);

    setState({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user_profile,
      roles: data.roles,
      pages: data.pages,
    });
  },
  setAccessToken: (token) => {
    setApiAccessToken(token);
    setState({ accessToken: token });
  },
  clearAuth: () => {
    setApiAccessToken(null);
    removePersistedAuthState();

    storeState = {
      ...storeState,
      ...emptyAuthState,
    };

    emitChange();
  },
};

setApiAccessToken(storeState.accessToken);

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(storeState),
    () => selector(storeState),
  );
}

useAuthStore.getState = () => storeState;

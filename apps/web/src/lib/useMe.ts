import { useEffect, useState } from "react";
import { gqlFetch } from "./graphql";
import { getAccessToken, refreshAccessToken } from "./auth";

export interface MeUser {
  id: string;
  email: string;
  displayName: string | null;
  emailVerifiedAt: string | null;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
}

const ME_QUERY = `
  query Me {
    me {
      id
      email
      displayName
      emailVerifiedAt
      firstname
      lastname
      phone
    }
  }
`;

let cache: { user: MeUser | null } | null = null;
let inflight: Promise<MeUser | null> | null = null;
const subscribers = new Set<() => void>();

async function fetchMe(): Promise<MeUser | null> {
  if (!getAccessToken()) {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) return null;
  }
  try {
    const data = await gqlFetch<{ me: MeUser | null }>(ME_QUERY);
    return data.me;
  } catch {
    return null;
  }
}

function loadOnce(): Promise<MeUser | null> {
  if (cache) return Promise.resolve(cache.user);
  if (!inflight) {
    inflight = fetchMe().then((user) => {
      cache = { user };
      inflight = null;
      subscribers.forEach((fn) => fn());
      return user;
    });
  }
  return inflight;
}

export function invalidateMe(): void {
  cache = null;
  inflight = null;
}

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(cache?.user ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      setUser(cache?.user ?? null);
      setLoading(false);
    };
    subscribers.add(sync);
    loadOnce().then(sync);
    return () => {
      cancelled = true;
      subscribers.delete(sync);
    };
  }, []);

  const refetch = async () => {
    invalidateMe();
    const next = await loadOnce();
    setUser(next);
    return next;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isVerified: !!user?.emailVerifiedAt,
    refetch,
  };
}

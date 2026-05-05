import { useEffect, useState, useRef } from "react";
import { gqlFetch } from "./graphql";
import { getAccessToken, refreshAccessToken } from "./auth";

type EntityType = "COMMUNITY" | "HUB";

const MY_PERMISSIONS = `
  query MyPermissions($entityId: ID!, $entityType: RoleEntityType!) {
    myPermissions(entityId: $entityId, entityType: $entityType)
  }
`;

// Module-level cache keyed by "entityType:entityId"
const cache = new Map<string, string[]>();

function cacheKey(entityId: string, entityType: EntityType) {
  return `${entityType}:${entityId}`;
}

export function invalidatePermissions(
  entityId: string,
  entityType: EntityType,
) {
  cache.delete(cacheKey(entityId, entityType));
}

export function usePermissions(
  entityId: string | null | undefined,
  entityType: EntityType = "COMMUNITY",
) {
  const [permissions, setPermissions] = useState<string[]>(() => {
    if (!entityId) return [];
    return cache.get(cacheKey(entityId, entityType)) ?? [];
  });
  const [loading, setLoading] = useState(
    !entityId ? false : !cache.has(cacheKey(entityId ?? "", entityType)),
  );
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!entityId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const key = cacheKey(entityId, entityType);
    if (cache.has(key)) {
      setPermissions(cache.get(key)!);
      setLoading(false);
      return;
    }

    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    let cancelled = false;
    const fetchPermissions = async () => {
      if (!getAccessToken()) {
        await refreshAccessToken();
      }
      return gqlFetch<{ myPermissions: string[] }>(MY_PERMISSIONS, {
        entityId,
        entityType,
      });
    };

    fetchPermissions()
      .then((data) => {
        if (cancelled) return;
        cache.set(key, data.myPermissions);
        setPermissions(data.myPermissions);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPermissions([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityId, entityType]);

  const can = (permission: string): boolean => permissions.includes(permission);

  return { permissions, loading, can };
}

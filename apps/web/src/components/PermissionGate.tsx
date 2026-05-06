import { ReactNode } from "react";
import { usePermissions } from "@/lib/usePermissions";

/**
 * Renders children only when the current user holds the given permission
 * on the specified entity. Renders nothing (not a spinner) while loading —
 * use the `fallback` prop for a disabled/locked state when needed.
 */
export function PermissionGate({
  entityId,
  entityType = "COMMUNITY",
  permission,
  fallback = null,
  children,
}: {
  entityId: string;
  entityType?: "COMMUNITY" | "HUB";
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, loading } = usePermissions(entityId, entityType);
  if (loading) return null;
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

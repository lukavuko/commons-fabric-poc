import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import {
  Alert,
  Button,
  FormField,
  Input,
  StateBadge,
  Tag,
  VerifiedBadge,
} from "@/components";
import { gqlFetch } from "@/lib/graphql";
import { useMe, invalidateMe } from "@/lib/useMe";
import { logout, resendVerification } from "@/lib/auth";

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const YOU_QUERY = `
  query YouPage {
    me {
      id
      email
      displayName
      firstname
      lastname
      phone
      postalCode
      city
      emailVerifiedAt
      subscriptions {
        community { id name city province }
        isActive
      }
      userRoles {
        entityType
        entityId
        role { name }
      }
    }
  }
`;

const COMMUNITY_NAME_QUERY = `
  query CommunityName($id: ID!) {
    community(id: $id) { id name city province }
  }
`;

const UPDATE_ME = `
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id displayName firstname lastname phone postalCode city
    }
  }
`;

const DELETE_ME = `
  mutation DeleteMe {
    deleteMe
  }
`;

const UNSUBSCRIBE = `
  mutation Unsubscribe($communityId: ID!) {
    unsubscribeFromCommunity(communityId: $communityId)
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type CommunityStub = {
  id: string;
  name: string;
  city: string;
  province: string;
};

type UserRole = {
  entityType: string;
  entityId: string;
  role: { name: string };
};

type Subscription = {
  community: CommunityStub;
  isActive: boolean;
};

type YouData = {
  id: string;
  email: string;
  displayName: string | null;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
  postalCode: string | null;
  city: string | null;
  emailVerifiedAt: string | null;
  subscriptions: Subscription[];
  userRoles: UserRole[];
};

type Tab = "account" | "communities";

// ─── Tab nav ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "communities", label: "My Communities" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function You() {
  const navigate = useNavigate();
  const me = useMe();

  const [data, setData] = useState<YouData | null>(null);
  const [communityMap, setCommunityMap] = useState<
    Record<string, CommunityStub>
  >({});
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [loadError, setLoadError] = useState("");

  // Profile form
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    firstname: "",
    lastname: "",
    postalCode: "",
    city: "",
    phone: "",
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Email verification
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySent, setVerifySent] = useState(false);

  // Account
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Subscriptions
  const [unsubBusy, setUnsubBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!me.loading && !me.isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [me.loading, me.isAuthenticated, navigate]);

  useEffect(() => {
    if (!me.isAuthenticated) return;
    gqlFetch<{ me: YouData }>(YOU_QUERY)
      .then(async (d) => {
        const user = d.me;
        setData(user);
        setProfileForm({
          displayName: user.displayName ?? "",
          firstname: user.firstname ?? "",
          lastname: user.lastname ?? "",
          postalCode: user.postalCode ?? "",
          city: user.city ?? "",
          phone: user.phone ?? "",
        });

        // Fetch community names for roles not in subscriptions
        const knownIds = new Set(user.subscriptions.map((s) => s.community.id));
        const roleIds = [
          ...new Set(
            user.userRoles
              .filter(
                (r) =>
                  r.entityType === "COMMUNITY" && !knownIds.has(r.entityId),
              )
              .map((r) => r.entityId),
          ),
        ];
        if (roleIds.length > 0) {
          const results = await Promise.all(
            roleIds.map((id) =>
              gqlFetch<{ community: CommunityStub | null }>(
                COMMUNITY_NAME_QUERY,
                { id },
              )
                .then((r) => r.community)
                .catch(() => null),
            ),
          );
          const map: Record<string, CommunityStub> = {};
          for (const c of results) {
            if (c) map[c.id] = c;
          }
          setCommunityMap(map);
        }
      })
      .catch(() => setLoadError("Could not load profile."));
  }, [me.isAuthenticated]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);
    setProfileBusy(true);
    try {
      await gqlFetch(UPDATE_ME, {
        input: {
          displayName: profileForm.displayName.trim() || null,
          firstname: profileForm.firstname.trim() || null,
          lastname: profileForm.lastname.trim() || null,
          postalCode: profileForm.postalCode.trim() || null,
          city: profileForm.city.trim() || null,
          phone: profileForm.phone.trim() || null,
        },
      });
      invalidateMe();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setProfileBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!data) return;
    setVerifyError("");
    setVerifySent(false);
    setVerifyBusy(true);
    try {
      await resendVerification(data.email);
      setVerifySent(true);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    invalidateMe();
    navigate("/");
  };

  const handleDeleteMe = async () => {
    setDeleteError("");
    setDeleteBusy(true);
    try {
      await gqlFetch(DELETE_ME);
      await logout();
      invalidateMe();
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
      setDeleteBusy(false);
    }
  };

  const handleUnsubscribe = async (communityId: string) => {
    setUnsubBusy(communityId);
    try {
      await gqlFetch(UNSUBSCRIBE, { communityId });
      setData((d) =>
        d
          ? {
              ...d,
              subscriptions: d.subscriptions.map((s) =>
                s.community.id === communityId ? { ...s, isActive: false } : s,
              ),
            }
          : d,
      );
    } finally {
      setUnsubBusy(null);
    }
  };

  if (me.loading || !data) {
    if (loadError) {
      return (
        <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
          <SiteNav />
          <main className="py-10">
            <Alert tone="danger">{loadError}</Alert>
          </main>
        </div>
      );
    }
    return null;
  }

  const activeSubs = data.subscriptions.filter((s) => s.isActive);

  const roleEntries = data.userRoles.filter(
    (r) => r.entityType === "COMMUNITY",
  );
  const roleByCommunity: Record<
    string,
    { community: CommunityStub; roles: string[] }
  > = {};
  for (const r of roleEntries) {
    const community =
      data.subscriptions.find((s) => s.community.id === r.entityId)
        ?.community ?? communityMap[r.entityId];
    if (!community) continue;
    if (!roleByCommunity[r.entityId]) {
      roleByCommunity[r.entityId] = { community, roles: [] };
    }
    roleByCommunity[r.entityId].roles.push(r.role.name);
  }

  const initials = (
    data.firstname?.[0] ??
    data.displayName?.[0] ??
    data.email[0] ??
    "?"
  ).toUpperCase();

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />
      <main className="flex-1 pb-16">
        <h1 className="font-display text-4xl font-medium text-ink mb-8 tracking-tight">
          {data.firstname ?? data.displayName ?? "You"}
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tab sidebar */}
          <nav
            aria-label="Settings sections"
            className="md:w-48 shrink-0 flex md:flex-col gap-1"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-3 py-2.5 rounded-cf-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-[rgba(80,101,72,0.12)] text-sage-deep"
                    : "text-ink-muted hover:text-ink hover:bg-[rgba(47,53,44,0.04)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {/* ── Account ── */}
            {activeTab === "account" && (
              <div className="flex flex-col gap-8 max-w-lg">
                {/* Avatar + signed-in-as */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full bg-[rgba(80,101,72,0.16)] flex items-center justify-center text-sage-deep font-display text-xl font-medium shrink-0"
                    aria-hidden
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Signed in as</p>
                    <p className="text-sm font-medium text-ink">{data.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="ml-auto text-xs shrink-0"
                  >
                    Sign out
                  </Button>
                </div>

                {/* Edit form */}
                <form
                  onSubmit={handleProfileSave}
                  className="flex flex-col gap-5"
                >
                  <FormField
                    label="Display name"
                    hint="Optional non-unique display name — you can change this later or leave it blank"
                  >
                    {({ id }) => (
                      <Input
                        id={id}
                        value={profileForm.displayName}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            displayName: e.target.value,
                          }))
                        }
                        placeholder="Your handle or nickname"
                      />
                    )}
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="First name">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={profileForm.firstname}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              firstname: e.target.value,
                            }))
                          }
                          placeholder="Jane"
                        />
                      )}
                    </FormField>
                    <FormField label="Last name">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={profileForm.lastname}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              lastname: e.target.value,
                            }))
                          }
                          placeholder="Smith"
                        />
                      )}
                    </FormField>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                      Location{" "}
                      <span className="text-ink-subtle font-normal normal-case tracking-normal">
                        — for finding communities near you
                      </span>
                    </p>
                    <div className="grid grid-cols-[1fr_2fr] gap-4">
                      <FormField label="Postal code">
                        {({ id }) => (
                          <Input
                            id={id}
                            value={profileForm.postalCode}
                            onChange={(e) =>
                              setProfileForm((f) => ({
                                ...f,
                                postalCode: e.target.value,
                              }))
                            }
                            placeholder="M4E 1A1"
                          />
                        )}
                      </FormField>
                      <FormField label="City">
                        {({ id }) => (
                          <Input
                            id={id}
                            value={profileForm.city}
                            onChange={(e) =>
                              setProfileForm((f) => ({
                                ...f,
                                city: e.target.value,
                              }))
                            }
                            placeholder="Toronto"
                          />
                        )}
                      </FormField>
                    </div>
                  </div>

                  {profileError && <Alert tone="danger">{profileError}</Alert>}
                  {profileSaved && <Alert tone="success">Changes saved.</Alert>}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileBusy}>
                      {profileBusy ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </form>

                {/* CONTACT */}
                <section className="flex flex-col gap-4 pt-6 border-t border-[var(--cf-hairline)]">
                  <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                    Contact
                  </h2>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Email</p>
                      <p className="text-sm text-ink">{data.email}</p>
                    </div>
                    {data.emailVerifiedAt ? (
                      <VerifiedBadge />
                    ) : verifySent ? (
                      <StateBadge label="Email sent" tone="sage" />
                    ) : (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Button
                          variant="secondary"
                          onClick={handleResendVerification}
                          disabled={verifyBusy}
                        >
                          {verifyBusy ? "Sending…" : "Verify email"}
                        </Button>
                        {verifyError && (
                          <p className="text-xs text-[color:var(--cf-danger)]">
                            {verifyError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 opacity-40 pointer-events-none">
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Phone</p>
                      <p className="text-sm text-ink">{data.phone ?? "–"}</p>
                    </div>
                    <StateBadge label="Coming soon" tone="clay" />
                  </div>
                </section>

                {/* SECURITY */}
                <section className="flex flex-col gap-3">
                  <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                    Security
                  </h2>
                  <div>
                    <Button variant="secondary" disabled title="Coming soon">
                      Change password
                    </Button>
                  </div>
                </section>

                {/* DANGER ZONE */}
                <section className="flex flex-col gap-3 pt-6 border-t border-[var(--cf-hairline)]">
                  <h2 className="text-xs font-semibold text-[color:var(--cf-danger)] uppercase tracking-widest">
                    Danger zone
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Permanently deletes your account and all associated data.
                    This cannot be undone.
                  </p>
                  {!deleteConfirm ? (
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => setDeleteConfirm(true)}
                        className="text-[color:var(--cf-danger)] shadow-[inset_0_0_0_1px_var(--cf-danger)] hover:bg-[rgba(181,80,63,0.06)]"
                      >
                        Delete my account
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Alert tone="danger">
                        Are you sure? This will delete your account,
                        subscriptions, and roles.
                      </Alert>
                      {deleteError && (
                        <Alert tone="danger">{deleteError}</Alert>
                      )}
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={handleDeleteMe}
                          disabled={deleteBusy}
                          className="text-[color:var(--cf-danger)] shadow-[inset_0_0_0_1px_var(--cf-danger)] hover:bg-[rgba(181,80,63,0.06)]"
                        >
                          {deleteBusy ? "Deleting…" : "Yes, delete my account"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setDeleteConfirm(false)}
                          disabled={deleteBusy}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── My Communities ── */}
            {activeTab === "communities" && (
              <div className="flex flex-col gap-8">
                <section>
                  <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                    Subscribed
                  </h2>
                  {activeSubs.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      Not subscribed to any communities yet.{" "}
                      <Link
                        to="/explore"
                        className="text-sage-deep hover:underline"
                      >
                        Explore
                      </Link>
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {activeSubs.map((sub) => (
                        <li
                          key={sub.community.id}
                          className="flex items-center justify-between gap-4 bg-surface rounded-cf-xl shadow-cf-card px-4 py-3"
                        >
                          <div>
                            <Link
                              to={`/communities/${sub.community.id}`}
                              className="text-sm font-medium text-ink hover:text-sage-deep"
                            >
                              {sub.community.name}
                            </Link>
                            <p className="text-xs text-ink-muted">
                              {sub.community.city}, {sub.community.province}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={() => handleUnsubscribe(sub.community.id)}
                            disabled={unsubBusy === sub.community.id}
                          >
                            {unsubBusy === sub.community.id
                              ? "…"
                              : "Unsubscribe"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {Object.keys(roleByCommunity).length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                      Memberships
                    </h2>
                    <ul className="flex flex-col gap-2">
                      {Object.values(roleByCommunity).map(
                        ({ community, roles }) => (
                          <li
                            key={community.id}
                            className="flex items-center justify-between gap-4 bg-surface rounded-cf-xl shadow-cf-card px-4 py-3"
                          >
                            <div>
                              <Link
                                to={`/communities/${community.id}`}
                                className="text-sm font-medium text-ink hover:text-sage-deep"
                              >
                                {community.name}
                              </Link>
                              <p className="text-xs text-ink-muted">
                                {community.city}, {community.province}
                              </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0 items-center">
                              {roles.map((r) => (
                                <Tag
                                  key={r}
                                  tone={
                                    r === "STEWARD"
                                      ? "sage"
                                      : r === "HUB_MANAGER"
                                        ? "clay"
                                        : "neutral"
                                  }
                                >
                                  {r.toLowerCase().replace("_", " ")}
                                </Tag>
                              ))}
                              {roles.includes("STEWARD") && (
                                <Link
                                  to={`/communities/${community.id}/edit`}
                                  className="text-xs text-sage-deep hover:underline ml-1"
                                >
                                  Manage →
                                </Link>
                              )}
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </section>
                )}

                {activeSubs.length === 0 &&
                  Object.keys(roleByCommunity).length === 0 && (
                    <p className="text-sm text-ink-muted -mt-6">
                      No community memberships yet.
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

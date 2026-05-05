import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import {
  Alert,
  Button,
  FormField,
  Input,
  LinkButton,
  Textarea,
} from "@/components";
import { TagsInput } from "@/components/TagsInput";
import { gqlFetch } from "@/lib/graphql";
import { useMe } from "@/lib/useMe";

const CREATE_COMMUNITY = `
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      id
    }
  }
`;

interface FormState {
  name: string;
  description: string;
  website: string;
  tags: string[];
  contactFirstname: string;
  contactLastname: string;
  contactEmail: string;
  contactNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  website: "",
  tags: [],
  contactFirstname: "",
  contactLastname: "",
  contactEmail: "",
  contactNumber: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
};

export default function CreateCommunity() {
  const navigate = useNavigate();
  const me = useMe();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me.loading && !me.isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [me.loading, me.isAuthenticated, navigate]);

  useEffect(() => {
    if (me.user) {
      setForm((f) => ({
        ...f,
        contactFirstname: me.user!.firstname || f.contactFirstname,
        contactLastname: me.user!.lastname || f.contactLastname,
        contactEmail: me.user!.email || f.contactEmail,
      }));
    }
  }, [me.user]);

  const field =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const input = {
        name: form.name.trim(),
        description: form.description.trim(),
        tags: form.tags,
        contactFirstname: form.contactFirstname.trim(),
        contactLastname: form.contactLastname.trim(),
        contactEmail: form.contactEmail.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
        ...(form.website.trim() ? { website: form.website.trim() } : {}),
        ...(form.contactNumber.trim()
          ? { contactNumber: form.contactNumber.trim() }
          : {}),
        ...(form.postalCode.trim()
          ? { postalCode: form.postalCode.trim() }
          : {}),
      };
      const data = await gqlFetch<{ createCommunity: { id: string } }>(
        CREATE_COMMUNITY,
        { input },
      );
      navigate(`/communities/${data.createCommunity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (me.loading) return null;

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />
      <main className="max-w-[640px] mx-auto w-full py-10">
        <Link
          to="/explore"
          className="text-sm text-ink-muted hover:text-ink mb-6 inline-block"
        >
          ← Explore
        </Link>

        <h1 className="font-display text-4xl font-medium text-ink mb-10 tracking-tight">
          Create a community
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Contact
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.contactFirstname}
                    onChange={field("contactFirstname")}
                    required
                    placeholder="Jane"
                  />
                )}
              </FormField>
              <FormField label="Last name">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.contactLastname}
                    onChange={field("contactLastname")}
                    required
                    placeholder="Smith"
                  />
                )}
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact email">
                {({ id }) => (
                  <Input
                    id={id}
                    type="email"
                    value={form.contactEmail}
                    onChange={field("contactEmail")}
                    required
                    placeholder="you@example.com"
                  />
                )}
              </FormField>
              <FormField label="Phone" hint="Optional">
                {({ id }) => (
                  <Input
                    id={id}
                    type="tel"
                    value={form.contactNumber}
                    onChange={field("contactNumber")}
                    placeholder="+1 416 555 0100"
                  />
                )}
              </FormField>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Community
            </h2>
            <FormField label="Name">
              {({ id }) => (
                <Input
                  id={id}
                  value={form.name}
                  onChange={field("name")}
                  required
                  placeholder="Riverdale Food Bank"
                />
              )}
            </FormField>
            <FormField label="Description">
              {({ id }) => (
                <Textarea
                  id={id}
                  value={form.description}
                  onChange={field("description")}
                  required
                  placeholder="Tell people what your community is about…"
                />
              )}
            </FormField>
            <FormField label="Website" hint="Optional">
              {({ id }) => (
                <Input
                  id={id}
                  type="url"
                  value={form.website}
                  onChange={field("website")}
                  placeholder="https://yoursite.org"
                />
              )}
            </FormField>
            <FormField label="Tags" hint="Press space or Enter to add">
              {({ id }) => (
                <TagsInput
                  id={id}
                  value={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              )}
            </FormField>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Location
            </h2>
            <FormField label="Street address">
              {({ id }) => (
                <Input
                  id={id}
                  value={form.address}
                  onChange={field("address")}
                  required
                  placeholder="123 Main St"
                />
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="City">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.city}
                    onChange={field("city")}
                    required
                    placeholder="Toronto"
                  />
                )}
              </FormField>
              <FormField label="Province / State">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.province}
                    onChange={field("province")}
                    required
                    placeholder="ON"
                  />
                )}
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Postal code" hint="Optional">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.postalCode}
                    onChange={field("postalCode")}
                    placeholder="M4E 1A1"
                  />
                )}
              </FormField>
              <FormField label="Country">
                {({ id }) => (
                  <Input
                    id={id}
                    value={form.country}
                    onChange={field("country")}
                    required
                    placeholder="Canada"
                  />
                )}
              </FormField>
            </div>
          </section>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create community"}
            </Button>
            <LinkButton variant="ghost" to="/explore">
              Cancel
            </LinkButton>
          </div>
        </form>
      </main>
    </div>
  );
}

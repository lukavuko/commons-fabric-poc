import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { usePermissions } from "@/lib/usePermissions";

const COMMUNITY_QUERY = `
  query EditCommunity($id: ID!) {
    community(id: $id) {
      id
      name
      website
      description
      tags
      contactFirstname
      contactLastname
      contactEmail
      contactNumber
      address
      city
      province
      postalCode
      country
    }
  }
`;

const UPDATE_COMMUNITY = `
  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
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

export default function EditCommunity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, loading: permsLoading } = usePermissions(id, "COMMUNITY");
  const [form, setForm] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    gqlFetch<{ community: FormState & { id: string } }>(COMMUNITY_QUERY, { id })
      .then((d) => {
        const c = d.community;
        setForm({
          name: c.name,
          description: c.description,
          website: c.website ?? "",
          tags: (c as unknown as { tags: string[] }).tags ?? [],
          contactFirstname: c.contactFirstname,
          contactLastname: c.contactLastname,
          contactEmail: c.contactEmail,
          contactNumber: c.contactNumber ?? "",
          address: c.address,
          city: c.city,
          province: c.province,
          postalCode: c.postalCode ?? "",
          country: c.country,
        });
      })
      .catch(() => setLoadError("Could not load community."));
  }, [id]);

  const field =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form) return;
    setSubmitError("");
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
        website: form.website.trim() || null,
        contactNumber: form.contactNumber.trim() || null,
        postalCode: form.postalCode.trim() || null,
      };
      await gqlFetch(UPDATE_COMMUNITY, { id, input });
      navigate(`/communities/${id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
        <SiteNav />
        <main className="max-w-[640px] mx-auto w-full py-10">
          <Alert tone="danger">{loadError}</Alert>
        </main>
      </div>
    );
  }

  if (!permsLoading && !can("community:edit")) {
    return (
      <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
        <SiteNav />
        <main className="max-w-[640px] mx-auto w-full py-10">
          <Alert tone="danger">
            You don't have permission to edit this community.
          </Alert>
        </main>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />
      <main className="max-w-[640px] mx-auto w-full py-10">
        <Link
          to={`/communities/${id}`}
          className="text-sm text-ink-muted hover:text-ink mb-6 inline-block"
        >
          ← Community
        </Link>

        <h1 className="font-display text-4xl font-medium text-ink mb-10 tracking-tight">
          Edit community
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Contact
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.contactFirstname}
                    onChange={field("contactFirstname")}
                    required
                  />
                )}
              </FormField>
              <FormField label="Last name">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.contactLastname}
                    onChange={field("contactLastname")}
                    required
                  />
                )}
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact email">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    type="email"
                    value={form.contactEmail}
                    onChange={field("contactEmail")}
                    required
                  />
                )}
              </FormField>
              <FormField label="Phone" hint="Optional">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    type="tel"
                    value={form.contactNumber}
                    onChange={field("contactNumber")}
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
              {({ id: fid }) => (
                <Input
                  id={fid}
                  value={form.name}
                  onChange={field("name")}
                  required
                />
              )}
            </FormField>
            <FormField label="Description">
              {({ id: fid }) => (
                <Textarea
                  id={fid}
                  value={form.description}
                  onChange={field("description")}
                  required
                />
              )}
            </FormField>
            <FormField label="Website" hint="Optional">
              {({ id: fid }) => (
                <Input
                  id={fid}
                  type="url"
                  value={form.website}
                  onChange={field("website")}
                />
              )}
            </FormField>
            <FormField label="Tags" hint="Press space or Enter to add">
              {({ id: fid }) => (
                <TagsInput
                  id={fid}
                  value={form.tags}
                  onChange={(tags) => setForm((f) => (f ? { ...f, tags } : f))}
                />
              )}
            </FormField>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
              Location
            </h2>
            <FormField label="Street address">
              {({ id: fid }) => (
                <Input
                  id={fid}
                  value={form.address}
                  onChange={field("address")}
                  required
                />
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="City">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.city}
                    onChange={field("city")}
                    required
                  />
                )}
              </FormField>
              <FormField label="Province / State">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.province}
                    onChange={field("province")}
                    required
                  />
                )}
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Postal code" hint="Optional">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.postalCode}
                    onChange={field("postalCode")}
                  />
                )}
              </FormField>
              <FormField label="Country">
                {({ id: fid }) => (
                  <Input
                    id={fid}
                    value={form.country}
                    onChange={field("country")}
                    required
                  />
                )}
              </FormField>
            </div>
          </section>

          {submitError && <Alert tone="danger">{submitError}</Alert>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
            <LinkButton variant="ghost" to={`/communities/${id}`}>
              Cancel
            </LinkButton>
          </div>
        </form>
      </main>
    </div>
  );
}

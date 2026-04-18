import Link from 'next/link';
import { gqlFetch } from '@/lib/graphql';

const COMMUNITIES_QUERY = `
  query {
    communities(pagination: { limit: 50 }) {
      id
      name
      city
      province
      description
      tags
      verifiedEmail
      verifiedExternally
      subscriberCount
    }
  }
`;

type Community = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string;
  tags: string[];
  verifiedEmail: boolean;
  verifiedExternally: boolean;
  subscriberCount: number;
};

export default async function HomePage() {
  const data = await gqlFetch<{ communities: Community[] }>(COMMUNITIES_QUERY).catch(() => ({ communities: [] }));
  const communities = data.communities;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Commons Fabric</h1>
          <p className="text-zinc-500 mt-1">Discover and connect with communities near you.</p>
        </div>
        <Link href="/auth" className="px-4 py-2 bg-black text-white rounded text-sm">
          Sign in
        </Link>
      </div>

      {communities.length === 0 ? (
        <p className="text-zinc-400">No communities yet. Be the first to register one.</p>
      ) : (
        <div className="grid gap-4">
          {communities.map(c => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className="block border rounded-lg p-5 hover:border-zinc-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{c.name}</h2>
                  <p className="text-sm text-zinc-500">{c.city}, {c.province}</p>
                </div>
                <span className="text-sm text-zinc-400">{c.subscriberCount} subscribers</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{c.description}</p>
              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.tags.map(tag => (
                    <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

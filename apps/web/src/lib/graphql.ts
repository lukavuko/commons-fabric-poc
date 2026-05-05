const GQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? "/api/graphql";

export class GraphQLClientError extends Error {
  code: string | null;
  constructor(message: string, code: string | null) {
    super(message);
    this.code = code;
  }
}

export async function gqlFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    const err = json.errors[0];
    throw new GraphQLClientError(err.message, err.extensions?.code ?? null);
  }
  return json.data as T;
}

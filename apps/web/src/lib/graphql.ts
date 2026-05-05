import { getAccessToken, refreshAccessToken } from "./auth";

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
  const makeRequest = (token: string | null) =>
    fetch(GQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

  let res = await makeRequest(getAccessToken());
  let json = await readGraphQLResponse(res);

  if (shouldRefresh(res, json)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      res = await makeRequest(refreshedToken);
      json = await readGraphQLResponse(res);
    }
  }

  if (json.errors?.length) {
    const err = json.errors[0];
    throw new GraphQLClientError(err.message, err.extensions?.code ?? null);
  }
  return json.data as T;
}

async function readGraphQLResponse(res: Response): Promise<{
  data?: unknown;
  errors?: { message: string; extensions?: { code?: string } }[];
}> {
  const json = await res.json().catch(() => null);
  if (!json || typeof json !== "object") {
    throw new GraphQLClientError(
      `GraphQL request failed with HTTP ${res.status}`,
      null,
    );
  }
  if (!res.ok && !("errors" in json)) {
    throw new GraphQLClientError(
      `GraphQL request failed with HTTP ${res.status}`,
      null,
    );
  }
  return json as {
    data?: unknown;
    errors?: { message: string; extensions?: { code?: string } }[];
  };
}

function shouldRefresh(
  res: Response,
  json: { errors?: { extensions?: { code?: string } }[] },
) {
  return (
    res.status === 401 ||
    json.errors?.some((err) => err.extensions?.code === "UNAUTHENTICATED")
  );
}

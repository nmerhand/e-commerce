export interface ApiRequestOptions {
  method?: string | undefined;
  body?: unknown;
  signal?: AbortSignal | undefined;
  csrfToken?: string | undefined;
}

const messagesByStatus: Record<number, string> = {
  400: "Vérifiez les informations saisies.",
  401: "Identifiants incorrects ou session expirée. Vérifiez puis réessayez.",
  403: "La requête a été refusée. Rechargez la page et vérifiez vos droits.",
  404: "La ressource demandée est introuvable.",
  409: "La ressource existe déjà ou ne peut pas être modifiée dans cet état.",
  429: "Trop de tentatives. Réessayez dans quelques minutes.",
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  const requestInit: RequestInit = {
    credentials: "include",
    headers,
  };

  if (options.method) requestInit.method = options.method;
  if (options.signal) requestInit.signal = options.signal;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestInit.body = JSON.stringify(options.body);
  }
  if (options.csrfToken) {
    headers.set("x-csrf-token", options.csrfToken);
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    throw new ApiError(
      messagesByStatus[response.status] ?? "Une erreur est survenue.",
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function apiRequestWithCsrf<T>(
  url: string,
  options: Omit<ApiRequestOptions, "csrfToken"> = {},
) {
  const { csrfToken } = await apiRequest<{ csrfToken: string }>(
    "/api/auth/csrf",
    { signal: options.signal },
  );

  return apiRequest<T>(url, { ...options, csrfToken });
}

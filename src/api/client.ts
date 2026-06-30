let currentUserId = '';

export function setCurrentUserId(id: string): void {
  currentUserId = id;
}

export function getCurrentUserId(): string {
  return currentUserId;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly error: string;
  readonly fields?: Record<string, string>;

  constructor(body: ApiError) {
    super(body.message);
    this.status = body.status;
    this.error = body.error;
    this.fields = body.fields;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': currentUserId,
      ...(init?.headers as Record<string, string> | undefined)
    }
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: res.statusText }))) as Record<
      string,
      unknown
    >;

    throw new ApiRequestError({
      status: res.status,
      error: (body['error'] as string) ?? 'ERROR',
      message: (body['message'] as string) ?? res.statusText,
      fields: body['fields'] as Record<string, string> | undefined
    });
  }

  return res.json() as Promise<T>;
}

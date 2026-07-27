import { promptChangeReason } from './change-reason-prompt';
import {
  CHANGE_REASON_FIELD,
  variantPriceChanging,
  variantStockChanging,
} from '../utils/variant-change-reason';

const VARIANT_UID = 'api::product-variant.product-variant';
const VARIANT_PATH = `/content-manager/collection-types/${VARIANT_UID}`;

type VariantSnapshot = {
  how_many_left?: number | null;
  price_for_one?: number | null;
  price_for_bulk?: number | null;
};

const snapshots = new Map<string, VariantSnapshot>();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function pathnameOf(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split('?')[0] ?? url;
  }
}

function parseVariantDocumentId(url: string): string | null {
  const path = pathnameOf(url);
  const match = path.match(
    new RegExp(
      `${escapeRegex(VARIANT_PATH)}/([^/]+)$`,
    ),
  );
  if (!match) return null;

  const id = decodeURIComponent(match[1]);
  if (!id || id === 'create') return null;
  return id;
}

function isVariantCollectionUrl(url: string): boolean {
  return pathnameOf(url).includes(VARIANT_PATH);
}

function isVariantUpdateRequest(url: string, method: string): boolean {
  return (
    method === 'PUT' &&
    isVariantCollectionUrl(url) &&
    parseVariantDocumentId(url) != null
  );
}

function isVariantReadRequest(url: string, method: string): boolean {
  return (
    method === 'GET' &&
    isVariantCollectionUrl(url) &&
    parseVariantDocumentId(url) != null
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Content Manager PUT sends flat fields; GET returns `{ data: fields }`. */
function extractVariantData(json: unknown): VariantSnapshot | null {
  const root = asRecord(json);
  if (!root) return null;

  const record = asRecord(root.data) ?? root;
  if (!('how_many_left' in record || 'price_for_one' in record || 'price_for_bulk' in record)) {
    return null;
  }

  return {
    how_many_left: record.how_many_left as number | null | undefined,
    price_for_one: record.price_for_one as number | null | undefined,
    price_for_bulk: record.price_for_bulk as number | null | undefined,
  };
}

function extractUpdatePayload(body: unknown): Record<string, unknown> {
  const root = asRecord(body);
  if (!root) return {};

  // Prefer nested `data` only when it looks like the document payload.
  const nested = asRecord(root.data);
  if (
    nested &&
    ('how_many_left' in nested ||
      'price_for_one' in nested ||
      'price_for_bulk' in nested ||
      'item_code' in nested)
  ) {
    return nested;
  }

  return root;
}

async function cacheSnapshotFromResponse(
  url: string,
  response: Response,
): Promise<void> {
  const documentId = parseVariantDocumentId(url);
  if (!documentId || !response.ok) return;

  try {
    const json = await response.clone().json();
    const snapshot = extractVariantData(json);
    if (snapshot) snapshots.set(documentId, snapshot);
  } catch {
    // Ignore malformed responses.
  }
}

async function ensureSnapshot(
  documentId: string,
  fetchFn: typeof window.fetch,
  headers?: Headers,
): Promise<VariantSnapshot | null> {
  const cached = snapshots.get(documentId);
  if (cached) return cached;

  const requestHeaders = new Headers();
  const auth = headers?.get('Authorization');
  if (auth) requestHeaders.set('Authorization', auth);

  const response = await fetchFn(
    `${VARIANT_PATH}/${encodeURIComponent(documentId)}`,
    { method: 'GET', headers: requestHeaders, credentials: 'same-origin' },
  );
  if (!response.ok) return null;

  const snapshot = extractVariantData(await response.json());
  if (snapshot) snapshots.set(documentId, snapshot);
  return snapshot;
}

function cancelledResponse() {
  return new Response(
    JSON.stringify({
      error: {
        message:
          'Save cancelled. A reason is required when changing stock or price.',
        name: 'ValidationError',
        status: 400,
      },
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

async function readRequestBody(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<unknown> {
  if (init?.body != null) {
    if (typeof init.body === 'string') {
      return JSON.parse(init.body);
    }
    if (init.body instanceof Blob) {
      return JSON.parse(await init.body.text());
    }
  }

  if (input instanceof Request) {
    return input.clone().json();
  }

  return null;
}

/** Prompt for a reason before saving Size & color stock or price changes. */
export function installRequireChangeReason() {
  if (typeof window === 'undefined') return;
  if ((window as Window & { __tigerRequireChangeReason?: boolean }).__tigerRequireChangeReason) {
    return;
  }
  (window as Window & { __tigerRequireChangeReason?: boolean }).__tigerRequireChangeReason = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = toUrlString(input);
    const method = (
      init?.method ??
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    if (isVariantUpdateRequest(url, method)) {
      try {
        const body = await readRequestBody(input, init);
        const documentId = parseVariantDocumentId(url);
        const data = extractUpdatePayload(body);

        if (documentId) {
          const requestHeaders =
            init?.headers != null
              ? new Headers(init.headers)
              : input instanceof Request
                ? input.headers
                : new Headers();

          const previous =
            (await ensureSnapshot(documentId, originalFetch, requestHeaders)) ??
            {};
          const stock = variantStockChanging(previous, data);
          const price = variantPriceChanging(previous, data);

          if (stock || price) {
            const reason = await promptChangeReason({ stock, price });
            if (!reason) return cancelledResponse();

            const nextBody = {
              ...data,
              [CHANGE_REASON_FIELD]: reason,
            };

            const nextHeaders = new Headers(requestHeaders);
            if (!nextHeaders.has('Content-Type')) {
              nextHeaders.set('Content-Type', 'application/json');
            }
            nextHeaders.set('X-Change-Reason', reason);

            const response = await originalFetch(url, {
              method: 'PUT',
              headers: nextHeaders,
              body: JSON.stringify(nextBody),
              credentials:
                init?.credentials ??
                (input instanceof Request ? input.credentials : 'same-origin'),
              signal: init?.signal ?? (input instanceof Request ? input.signal : undefined),
            });
            await cacheSnapshotFromResponse(url, response);
            return response;
          }
        }
      } catch {
        // Fall through to the original request.
      }
    }

    const response = await originalFetch(input, init);

    if (isVariantReadRequest(url, method)) {
      await cacheSnapshotFromResponse(url, response);
    } else if (isVariantUpdateRequest(url, method) && response.ok) {
      await cacheSnapshotFromResponse(url, response);
    }

    return response;
  };
}

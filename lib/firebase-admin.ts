import { SignJWT, jwtVerify, importPKCS8, importX509 } from "jose";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIREBASE_KEYS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// ── OAuth2 Token ─────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;
let privateKeyPromise: Promise<CryptoKey> | null = null;
let tokenPromise: Promise<string> | null = null;

function getPrivateKey(): Promise<CryptoKey> {
  if (!privateKeyPromise) {
    const pem = PRIVATE_KEY.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
    privateKeyPromise = importPKCS8(pem, "RS256");
  }
  return privateKeyPromise;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    const pk = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/cloud-platform",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(CLIENT_EMAIL)
      .setAudience(TOKEN_URL)
      .setIssuedAt(now)
      .setExpirationTime("55m")
      .sign(pk);

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) throw new Error(`Token error: ${res.status}`);
    const data = await res.json();
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return tokenCache.token;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

// ── Firestore Value Conversion ───────────────────────────────

function toRestValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number")
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val))
    return { arrayValue: { values: val.map(toRestValue) } };
  if (typeof val === "object") {
    const fields: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toRestValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromRestValue(val: Record<string, unknown> | undefined): unknown {
  if (!val) return undefined;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return val.doubleValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) {
    const av = val.arrayValue as { values?: Record<string, unknown>[] };
    return (av.values || []).map(fromRestValue);
  }
  if ("mapValue" in val) {
    const mv = val.mapValue as {
      fields?: Record<string, Record<string, unknown>>;
    };
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(mv.fields || {}))
      result[k] = fromRestValue(v);
    return result;
  }
  return undefined;
}

function fromRestDoc(
  doc: { fields?: Record<string, Record<string, unknown>> } | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  if (!doc?.fields) return {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields))
    result[k] = fromRestValue(v);
  return result;
}

// ── Firestore REST helpers ───────────────────────────────────

const REST_OP_MAP: Record<string, string> = {
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUAL",
  "in": "IN",
  "array-contains": "ARRAY_CONTAINS",
  "array-contains-any": "ARRAY_CONTAINS_ANY",
  "not-in": "NOT_IN",
};

function buildStructuredQuery(
  collection: string,
  where?: { field: string; op: string; value: unknown },
  orderBy?: { field: string; direction: string }
): Record<string, unknown> {
  const q: Record<string, unknown> = {
    from: [{ collectionId: collection }],
  };
  if (where) {
    q.where = {
      fieldFilter: {
        field: { fieldPath: where.field },
        op: REST_OP_MAP[where.op] || where.op,
        value: toRestValue(where.value),
      },
    };
  }
  if (orderBy) {
    q.orderBy = [
      {
        field: { fieldPath: orderBy.field },
        direction: orderBy.direction,
      },
    ];
  }
  return q;
}

async function fsPatch(
  path: string,
  fields: Record<string, Record<string, unknown>>,
  updateMask?: string[]
): Promise<void> {
  const headers = await authHeaders();
  let url = `${FIRESTORE_BASE}/${path}`;
  if (updateMask && updateMask.length > 0) {
    const params = updateMask
      .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
      .join("&");
    url += `?${params}`;
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`PATCH ${path}: ${res.status}`);
}

async function fsPost(
  collection: string,
  fields: Record<string, Record<string, unknown>>
): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${FIRESTORE_BASE}/${collection}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`POST ${collection}: ${res.status}`);
  const data = (await res.json()) as { name?: string };
  const name = data.name || "";
  return name.split("/").pop() || "";
}

async function fsDelete(path: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${FIRESTORE_BASE}/${path}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`DELETE ${path}: ${res.status}`);
}

async function fsRunQuery(
  collection: string,
  where?: { field: string; op: string; value: unknown },
  orderBy?: { field: string; direction: string }
): Promise<Array<{ name: string; fields: Record<string, unknown> }>> {
  const headers = await authHeaders();
  const structuredQuery = buildStructuredQuery(collection, where, orderBy);
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers,
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`runQuery: ${res.status}`);
  const results = (await res.json()) as Array<{
    document?: {
      name?: string;
      fields?: Record<string, Record<string, unknown>>;
    };
  }>;
  return results
    .filter((r) => r.document)
    .map((r) => ({
      name: r.document!.name || "",
      fields: fromRestDoc(r.document),
    }));
}

async function fsRunCount(
  collection: string,
  where?: { field: string; op: string; value: unknown }
): Promise<number> {
  const headers = await authHeaders();
  const structuredQuery = buildStructuredQuery(collection, where);
  const res = await fetch(`${FIRESTORE_BASE}:runAggregationQuery`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      structuredAggregationQuery: {
        structuredQuery,
        aggregations: [{ alias: "count", count: {} }],
      },
    }),
  });
  if (!res.ok) throw new Error(`runAggregationQuery: ${res.status}`);
  const results = (await res.json()) as Array<{
    result?: { aggregateFields?: { count?: { integerValue?: string } } };
  }>;
  return Number(
    results[0]?.result?.aggregateFields?.count?.integerValue || "0"
  );
}

// ── Firestore-like classes ───────────────────────────────────

function toFirestoreFields(
  data: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(data))
    if (v !== undefined) fields[k] = toRestValue(v);
  return fields;
}

class DocSnapshot {
  constructor(
    public readonly exists: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _data: Record<string, any>,
    public readonly ref: DocRef
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): Record<string, any> {
    return this._data;
  }
  get id(): string {
    return this.ref.id;
  }
}

class DocRef {
  constructor(
    private _collection: string,
    private _id: string
  ) {}
  get id(): string {
    return this._id;
  }
  get path(): string {
    return `${this._collection}/${this._id}`;
  }
  async get(): Promise<DocSnapshot> {
    const res = await fetch(`${FIRESTORE_BASE}/${this.path}`, {
      headers: await authHeaders(),
    });
    if (res.status === 404) {
      return new DocSnapshot(false, {}, this);
    }
    if (!res.ok) throw new Error(`GET ${this.path}: ${res.status}`);
    const doc = (await res.json()) as {
      fields?: Record<string, Record<string, unknown>>;
    };
    return new DocSnapshot(true, fromRestDoc(doc), this);
  }
  async set(data: Record<string, unknown>): Promise<void> {
    const fieldPaths = Object.keys(data);
    await fsPatch(this.path, toFirestoreFields(data), fieldPaths);
  }
  async update(data: Record<string, unknown>): Promise<void> {
    const fieldPaths = Object.keys(data).filter(
      (k) => data[k] !== undefined
    );
    await fsPatch(this.path, toFirestoreFields(data), fieldPaths);
  }
  async delete(): Promise<void> {
    await fsDelete(this.path);
  }
}

class Query {
  private _where?: { field: string; op: string; value: unknown };
  private _orderBy?: { field: string; direction: string };

  constructor(
    private _collection: string,
    where?: { field: string; op: string; value: unknown },
    orderBy?: { field: string; direction: string }
  ) {
    this._where = where;
    this._orderBy = orderBy;
  }

  where(field: string, op: string, value: unknown): Query {
    return new Query(this._collection, { field, op, value }, this._orderBy);
  }

  orderBy(field: string, direction = "ASCENDING"): Query {
    const dir = direction.toUpperCase() === "DESC" ? "DESCENDING" : direction.toUpperCase() === "ASC" ? "ASCENDING" : direction.toUpperCase();
    return new Query(this._collection, this._where, { field, direction: dir });
  }

  async get(): Promise<QuerySnapshot> {
    const docs = await fsRunQuery(
      this._collection,
      this._where,
      this._orderBy
    );
    return new QuerySnapshot(
      docs.map((d) => {
        const docId = d.name.split("/").pop() || "";
        return new DocSnapshot(true, d.fields, new DocRef(this._collection, docId));
      })
    );
  }

  count(): AggregateQuery {
    return new AggregateQuery(this._collection, this._where);
  }
}

class AggregateQuery {
  constructor(
    private _collection: string,
    private _where?: { field: string; op: string; value: unknown }
  ) {}

  async get(): Promise<AggregateSnapshot> {
    const count = await fsRunCount(this._collection, this._where);
    return new AggregateSnapshot(count);
  }
}

class AggregateSnapshot {
  constructor(private _count: number) {}
  data(): { count: number } {
    return { count: this._count };
  }
}

class QuerySnapshot {
  constructor(public readonly docs: DocSnapshot[]) {}
  get empty(): boolean {
    return this.docs.length === 0;
  }
  get size(): number {
    return this.docs.length;
  }
}

class CollectionRef {
  constructor(private _path: string) {}

  doc(id?: string): DocRef {
    return new DocRef(this._path, id || crypto.randomUUID());
  }

  async add(data: Record<string, unknown>): Promise<DocRef> {
    const id = await fsPost(this._path, toFirestoreFields(data));
    return new DocRef(this._path, id);
  }

  where(field: string, op: string, value: unknown): Query {
    return new Query(this._path, { field, op, value });
  }

  orderBy(field: string, direction = "ASCENDING"): Query {
    const dir = direction.toUpperCase() === "DESC" ? "DESCENDING" : direction.toUpperCase() === "ASC" ? "ASCENDING" : direction.toUpperCase();
    return new Query(this._path, undefined, { field, direction: dir });
  }
}

class WriteBatch {
  private _ops: Array<() => Promise<void>> = [];

  set(ref: DocRef, data: Record<string, unknown>): void {
    this._ops.push(() => ref.set(data));
  }
  update(ref: DocRef, data: Record<string, unknown>): void {
    this._ops.push(() => ref.update(data));
  }
  delete(ref: DocRef): void {
    this._ops.push(() => ref.delete());
  }
  async commit(): Promise<void> {
    for (const op of this._ops) {
      await op();
    }
  }
}

class FirestoreRest {
  collection(name: string): CollectionRef {
    return new CollectionRef(name);
  }
  batch(): WriteBatch {
    return new WriteBatch();
  }
}

// ── Session Cookie (jose + SESSION_SECRET HMAC) ──────────────

let sessionKey: CryptoKey | null = null;

async function getSessionKey(): Promise<CryptoKey> {
  if (sessionKey) return sessionKey;
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET environment variable is not set.");
  sessionKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return sessionKey;
}

let firebaseKeysCache: { keys: Record<string, CryptoKey>; expiresAt: number } | null = null;
let firebaseKeysPromise: Promise<Record<string, CryptoKey>> | null = null;

async function getFirebasePublicKeys(): Promise<Record<string, CryptoKey>> {
  if (firebaseKeysCache && Date.now() < firebaseKeysCache.expiresAt)
    return firebaseKeysCache.keys;
  if (firebaseKeysPromise) return firebaseKeysPromise;

  firebaseKeysPromise = (async () => {
    const res = await fetch(FIREBASE_KEYS_URL);
    if (!res.ok) throw new Error(`Failed to fetch Firebase keys: ${res.status}`);
    const data = (await res.json()) as Record<string, string>;
    const keys: Record<string, CryptoKey> = {};
    for (const [kid, pem] of Object.entries(data)) {
      keys[kid] = await importX509(pem, "RS256");
    }
    let ttl = 3600000;
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch) ttl = parseInt(maxAgeMatch[1], 10) * 1000;
    firebaseKeysCache = { keys, expiresAt: Date.now() + ttl };
    return keys;
  })();

  try {
    return await firebaseKeysPromise;
  } finally {
    firebaseKeysPromise = null;
  }
}

async function createSessionCookie(
  idToken: string,
  expiresIn: number
): Promise<string> {
  const { payload } = await jwtVerify(
    idToken,
    async (header) => {
      const keys = await getFirebasePublicKeys();
      const kid = header.kid as string;
      const key = keys[kid];
      if (!key) throw new Error(`Unknown key: ${kid}`);
      return key;
    },
    {
      issuer:
        "https://securetoken.google.com/" + PROJECT_ID,
      audience: PROJECT_ID,
    }
  );

  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    iss: `https://sessiontoken.firebase.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    user_id: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    firebase: payload.firebase,
    auth_time: payload.auth_time,
  })
    .setProtectedHeader({ alg: "HS256", kid: "firebase-session" })
    .setSubject(payload.sub as string)
    .setIssuedAt(now)
    .setExpirationTime(now + Math.floor(expiresIn / 1000))
    .sign(await getSessionKey());

  return jwt;
}

async function createAdminSessionCookie(
  _email: string,
  _expiresIn: number
): Promise<string> {
  throw new Error("createAdminSessionCookie is disabled — use Firebase Auth verification instead");
}

async function verifySessionCookie(
  cookie: string,
  checkRevoked?: boolean
): Promise<DecodedSession> {
  const { payload } = await jwtVerify(cookie, await getSessionKey(), {
    issuer: `https://sessiontoken.firebase.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  if (checkRevoked && payload.sub) {
    const user = await authGetUser(payload.sub as string);
    if (user.validSince) {
      const validSince = Number(user.validSince);
      const iat = (payload.iat as number) || 0;
      if (iat < validSince) throw new Error("Token has been revoked");
    }
  }

  return payload as DecodedSession;
}

// ── Auth REST helpers ────────────────────────────────────────

interface AuthUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  validSince?: string;
}

async function authRequest(
  path: string,
  method: string,
  body?: unknown
): Promise<unknown> {
  const headers = await authHeaders();
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Auth ${method} ${path}: ${res.status} ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function authGetUser(uid: string): Promise<AuthUser> {
  // Firebase Identity Toolkit REST uses POST /accounts:lookup (not GET /accounts/{uid})
  const res = (await authRequest("/accounts:lookup", "POST", { localId: [uid] })) as {
    users?: AuthUser[];
  };
  const user = res.users?.[0];
  if (!user) throw new Error(`User not found: ${uid}`);
  return user;
}

class AuthRest {
  async verifySessionCookie(
    cookie: string,
    checkRevoked?: boolean
  ): Promise<DecodedSession> {
    return verifySessionCookie(cookie, checkRevoked);
  }

  async createSessionCookie(
    idToken: string,
    options: { expiresIn: number }
  ): Promise<string> {
    return createSessionCookie(idToken, options.expiresIn);
  }

  async createAdminSessionCookie(
    email: string,
    expiresIn: number
  ): Promise<string> {
    return createAdminSessionCookie(email, expiresIn);
  }

  async createUser(data: {
    email: string;
    password: string;
    disabled?: boolean;
  }): Promise<{ uid: string }> {
    const res = (await authRequest("/accounts", "POST", {
      email: data.email,
      password: data.password,
      disabled: data.disabled ?? false,
    })) as { localId: string };
    return { uid: res.localId };
  }

  async deleteUser(uid: string): Promise<void> {
    await authRequest(`/accounts/${uid}`, "DELETE");
  }

  async updateUser(
    uid: string,
    data: { disabled?: boolean; emailVerified?: boolean; password?: string }
  ): Promise<void> {
    const updateBody: Record<string, unknown> = { target: uid };
    if (data.disabled !== undefined) updateBody.disabled = data.disabled;
    if (data.emailVerified !== undefined)
      updateBody.emailVerified = data.emailVerified;
    if (data.password !== undefined) updateBody.password = data.password;
    await authRequest("/accounts:update", "POST", updateBody);
  }

  async getUserByEmail(
    email: string
  ): Promise<{ uid: string; email: string }> {
    const data = (await authRequest("/accounts:lookup", "POST", {
      email,
    })) as { users?: Array<{ localId: string; email: string }> };
    const user = data.users?.[0];
    if (!user) throw new Error(`User not found: ${email}`);
    return { uid: user.localId, email: user.email };
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    await authRequest("/accounts:update", "POST", {
      target: uid,
      updateAttribute: "VALIDATE_DURATION",
    });
  }
}

// ── Exports ──────────────────────────────────────────────────

export interface DecodedSession {
  sub: string;
  email?: string;
  email_verified?: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  firebase?: Record<string, unknown>;
  auth_time?: number;
  user_id?: string;
  [key: string]: unknown;
}

export interface AdminDb {
  collection(name: string): CollectionRef;
  batch(): WriteBatch;
}

export interface AdminAuth {
  verifySessionCookie(
    cookie: string,
    checkRevoked?: boolean
  ): Promise<DecodedSession>;
  createSessionCookie(
    idToken: string,
    options: { expiresIn: number }
  ): Promise<string>;
  createAdminSessionCookie(
    email: string,
    expiresIn: number
  ): Promise<string>;
  createUser(data: {
    email: string;
    password: string;
    disabled?: boolean;
  }): Promise<{ uid: string }>;
  deleteUser(uid: string): Promise<void>;
  updateUser(
    uid: string,
    data: {
      disabled?: boolean;
      emailVerified?: boolean;
      password?: string;
    }
  ): Promise<void>;
  getUserByEmail(
    email: string
  ): Promise<{ uid: string; email: string }>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

const firestoreInstance = new FirestoreRest();
const authInstance = new AuthRest();

export function getAdminDb(): AdminDb {
  return firestoreInstance;
}

export function getAdminAuth(): AdminAuth {
  return authInstance;
}

export const adminDb = new Proxy({} as AdminDb, {
  get(_, prop) {
    const db = getAdminDb();
    const val = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

export const adminAuth = new Proxy({} as AdminAuth, {
  get(_, prop) {
    const auth = getAdminAuth();
    const val = (auth as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});

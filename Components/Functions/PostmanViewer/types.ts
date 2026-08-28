/**
 * Postman Collection v2.1 (and v2.0 — same shape, different `info.schema`) plus
 * environment/globals exports.
 *
 * Every field here is optional on purpose: exports in the wild are produced by a
 * decade of Postman versions and by third-party generators, so the parser treats
 * the schema as a suggestion and validates as it walks.
 */

export type RawKeyValue = {
  key?: string;
  value?: unknown;
  disabled?: boolean;
  /** formdata rows carry 'text' | 'file'; environment values carry 'secret' | 'default'. */
  type?: string;
  src?: string | string[];
  description?: unknown;
  enabled?: boolean;
};

export type RawUrl = {
  raw?: string;
  protocol?: string;
  host?: string | string[];
  port?: string;
  path?: string | string[];
  query?: RawKeyValue[];
  hash?: string;
  /** Values for `:id`-style path segments. */
  variable?: RawKeyValue[];
};

export type RawBody = {
  mode?: string;
  raw?: string;
  urlencoded?: RawKeyValue[];
  formdata?: RawKeyValue[];
  graphql?: { query?: string; variables?: string };
  file?: { src?: string };
  options?: { raw?: { language?: string } };
  disabled?: boolean;
};

export type RawAuth = {
  type?: string;
  [scheme: string]: unknown;
};

export type RawRequest = {
  method?: string;
  url?: RawUrl | string;
  header?: RawKeyValue[] | string;
  body?: RawBody;
  auth?: RawAuth;
  description?: unknown;
};

export type RawItem = {
  name?: string;
  /** Present on folders. */
  item?: RawItem[];
  /** Present on requests. */
  request?: RawRequest | string;
  auth?: RawAuth;
  variable?: RawKeyValue[];
  description?: unknown;
};

export type RawCollection = {
  info?: { name?: string; description?: unknown; schema?: string; _postman_id?: string };
  item?: RawItem[];
  variable?: RawKeyValue[];
  auth?: RawAuth;
};

export type RawEnvironment = {
  id?: string;
  name?: string;
  values?: RawKeyValue[];
  _postman_variable_scope?: string;
};

/* ------------------------------------------------------------------ */
/* Normalised model                                                    */
/* ------------------------------------------------------------------ */

export type VariableSource = 'collection' | 'environment' | 'globals';

export type VariableEntry = {
  key: string;
  value: string;
  source: VariableSource;
  /** Postman marks these `"type": "secret"`; we mask them until asked. */
  secret: boolean;
};

export type VariableMap = Map<string, VariableEntry>;

/** What a single `{{…}}` substitution pass could not settle. */
export type Unresolved = {
  /** Names no collection variable or environment value defines. */
  missing: string[];
  /** `{{$guid}}`, `{{$timestamp}}` — Postman generates these at send time. */
  dynamic: string[];
  /** Names that reference themselves, directly or through a chain. */
  circular: string[];
};

export type ResolvedText = Unresolved & {
  /** Substituted, with secret values in the clear. */
  text: string;
  /** Substituted, with secret values replaced by a mask. */
  masked: string;
  /** True when the text still contains a `{{…}}` token of any kind. */
  hasTokens: boolean;
};

export type KeyValue = {
  key: string;
  /** Raw, as authored — may still contain `{{…}}`. */
  raw: string;
  value: ResolvedText;
  disabled: boolean;
  /** formdata rows only. */
  kind?: 'text' | 'file';
};

export type AuthInfo = {
  type: string;
  /** One-line human summary for the detail panel, secrets masked. */
  summary: string;
  /** Where the credential is inherited from, when it isn't set on the request. */
  inherited: boolean;
  header?: KeyValue;
  queryParam?: KeyValue;
  basic?: { username: ResolvedText; password: ResolvedText };
};

export type RequestBody = {
  mode: string;
  /** Serialised preview for raw / graphql / file modes. */
  text?: ResolvedText;
  language?: string;
  entries?: KeyValue[];
};

export type ParsedRequest = {
  id: string;
  name: string;
  /** Enclosing folder names, outermost first. */
  folders: string[];
  method: string;
  /** The URL as authored, `{{…}}` intact. */
  rawUrl: string;
  url: ResolvedText;
  /** `scheme://host:port` once resolved, or the literal token when it isn't. */
  origin: string;
  originResolved: boolean;
  /** Path only — no host, no query. Always starts with `/`. */
  path: string;
  query: KeyValue[];
  pathVariables: KeyValue[];
  headers: KeyValue[];
  auth?: AuthInfo;
  body?: RequestBody;
  description: string;
  unresolved: Unresolved;
};

/**
 * One folder of a collection, narrowed to a single host — a folder whose requests
 * span two hosts is listed once per host, so the header never lies about where a
 * call goes.
 */
export type RequestGroup = {
  /** Stable across renders: folder trail plus origin. */
  id: string;
  /** Enclosing folder names, outermost first. Empty for collection-root requests. */
  folders: string[];
  origin: string;
  resolved: boolean;
  requests: ParsedRequest[];
};

export type CollectionStats = {
  requests: number;
  folders: number;
  hosts: number;
  /** Distinct variable names nothing defines. */
  missingVariables: string[];
  dynamicVariables: string[];
  circularVariables: string[];
};

export type CollectionView = {
  name: string;
  description: string;
  schemaVersion: string;
  groups: RequestGroup[];
  stats: CollectionStats;
  variables: VariableEntry[];
  hasSecrets: boolean;
};

export type EnvironmentSummary = {
  name: string;
  scope: VariableSource;
  values: VariableEntry[];
};

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export type HashInfo = {
  /** Display name of the hash type, e.g. "MD5" or "sha256($salt.$pass)". */
  name: string;
  /** hashcat `-m` mode number, or null when hashcat cannot crack this type. */
  hashcat: number | null;
  /** Short note on where the hash is used. */
  description?: string;
  /** Reference URL for the description. */
  link?: string;
};

export type Prototype = {
  regex: RegExp;
  modes: HashInfo[];
};

/** One candidate hash type for a given input. */
export type HashCandidate = HashInfo & {
  /** True when the type is in the popular set and was floated to the top. */
  popular: boolean;
  /** DevOven tool for this algorithm, when the site has one. */
  tool: string | null;
};

/** The candidates for a single line of input. */
export type IdentifyResult = {
  hash: string;
  candidates: HashCandidate[];
};

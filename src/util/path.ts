import Path from "path";

export {
  addLeadingSlash,
  addTrailingSlash,
  NormalizedPath,
  normalizePath,
  normalizePaths,
  npath,
  stripTrailingSlash,
} from "./normalize-path";

export const prependPath = (parent: string) => (kid: string): string => Path.join(parent, kid);

export { Path };

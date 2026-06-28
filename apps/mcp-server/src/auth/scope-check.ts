import { type Scope } from './scopes'

/**
 * Returns true if every scope in `required` is present in `granted`.
 */
export function hasScopes(granted: string[], required: Scope[]): boolean {
  return required.every((s) => granted.includes(s))
}

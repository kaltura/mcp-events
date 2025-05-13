export const removeEmptyProps = <T = unknown>(
  obj: Partial<T> = {},
  { removeEmptyString }: { removeEmptyString: boolean } = { removeEmptyString: false },
): T => {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null && !(removeEmptyString && v === ''),
  )
  return Object.fromEntries(entries) as unknown as T
}

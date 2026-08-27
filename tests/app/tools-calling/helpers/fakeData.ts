const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley']
const LAST_NAMES = ['Kim', 'Patel', 'Garcia', 'Williams', 'Nguyen', 'Miller']
const TITLES = ['Product Manager', 'Software Engineer', 'Designer', 'Analyst']
const COMPANIES = ['Acme Labs', 'Blue River', 'Northwind', 'Skyline Media']

export function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '.')
}

export function randomFirstName(): string {
  return pick(FIRST_NAMES)
}

export function randomLastName(): string {
  return pick(LAST_NAMES)
}

export function randomPerson(): { firstName: string; lastName: string } {
  return {
    firstName: randomFirstName(),
    lastName: randomLastName(),
  }
}

export function randomEmail(firstName: string, lastName: string): string {
  return `${slug(firstName)}.${slug(lastName)}.${Date.now()}@example.test`
}

export function randomTitle(): string {
  return pick(TITLES)
}

export function randomCompany(): string {
  return pick(COMPANIES)
}

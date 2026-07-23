import { EventUserInfo } from '../events/helpers'
import { faker } from '@faker-js/faker'

export function generateUserInfo(roles = ['Attendees']): EventUserInfo {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }),
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    bio: faker.person.bio(),
    roles: roles,
    skipEmail: true,
  }
}

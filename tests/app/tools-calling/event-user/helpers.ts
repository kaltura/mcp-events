import { EventUserInfo } from '../events/helpers'
import { randomCompany, randomEmail, randomPerson, randomTitle } from '../helpers/fakeData'

export function generateUserInfo(roles = ['Attendees']): EventUserInfo {
  const { firstName, lastName } = randomPerson()
  const email = randomEmail(firstName, lastName)

  return {
    firstName,
    lastName,
    email,
    title: randomTitle(),
    company: randomCompany(),
    bio: `${firstName} ${lastName} is participating in this event.`,
    roles: roles,
    skipEmail: true,
  }
}

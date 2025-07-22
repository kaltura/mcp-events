import { listTimeZones } from 'timezone-support'

export const SupportedTimeZones = Object.freeze([
  ...listTimeZones(),
  'US/Central',
  'US/Eastern',
  'US/Mountain',
  'US/Pacific',
  'Europe/Copenhagen',
  'Europe/Amsterdam',
])

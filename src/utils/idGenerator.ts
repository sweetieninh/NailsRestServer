import { randomUUID } from 'crypto';

export const generateReadableId = (prefix: string): string => {
  // Avoid collisions across restarts/processes by using UUID entropy.
  const value = randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}${value}`;
};

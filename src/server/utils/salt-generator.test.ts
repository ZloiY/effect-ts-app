import { test, expect } from 'vitest';
import { generateSalt } from './salt-generator';

test('generate random string of length 10', () => {
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  expect(salt1.length).toBe(10);
  expect(salt2.length).toBe(10);
  expect(salt1 === salt2).toBe(false);
});

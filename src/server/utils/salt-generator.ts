import crypto from 'crypto';

const charCodes = [] as number[];
// A-Z,[
for (let i = 65; i < 92; i++) {
  charCodes.push(i);
}
// ],^,_,-,a-z,{,|,},~
for (let i = 93; i < 127; i++) {
  if (i !== 96) {
    charCodes.push(i);
  }
}

const alphabet = String.fromCharCode(...charCodes).split('');
const alphabetLastIndex = alphabet.length - 1;

export const generateSalt = () =>
  Array.from(crypto
    .getRandomValues(new Uint8Array(10))
  )
    .map((num) => Math.floor(num / 255 * alphabetLastIndex))
    .map((index) => alphabet[index])
    .join('');

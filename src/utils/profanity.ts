const BLOCKED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'pussy',
  'whore',
  'slut',
  'cunt',
  'nigger',
  'faggot',
  'myre',
  'poori',
  'kunna',
  'thayoli',
  'patti',
];

export function containsProfanity(input: string): boolean {
  const lower = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return BLOCKED_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower) || lower.includes(word);
  });
}

export function sanitizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

export function isValidUsernameFormat(name: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(name);
}

export function isOnamSeason(date = new Date()): boolean {
  const month = date.getMonth(); // 0-indexed: 7 = Aug, 8 = Sep
  return month === 7 || month === 8;
}

export function isMonsoonMonth(date = new Date()): boolean {
  const month = date.getMonth(); // Southwest monsoon Jun-Aug (5,6,7), Northeast monsoon Oct-Nov (9,10)
  return month === 5 || month === 6 || month === 7 || month === 9 || month === 10;
}

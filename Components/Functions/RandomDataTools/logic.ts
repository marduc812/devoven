const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
  'Karen', 'Leo', 'Mary', 'Nathan', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zoe', 'Aaron', 'Bella', 'Chris', 'Diana',
  'Ethan', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nancy',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

const DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com',
  'mail.com', 'icloud.com', 'protonmail.com', 'dev.io', 'company.org',
];

const STREETS = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Walnut Blvd',
  'Washington Ave', 'Lincoln Way', 'Park Pl', 'Lake Dr', 'River Rd', 'Hill St', 'Forest Ave',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Columbus', 'Seattle', 'Denver',
];

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const WORDS = [
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india',
  'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo',
  'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu',
  'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew',
  'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry',
  'strawberry', 'tangerine', 'ugli', 'vanilla', 'watermelon',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function generateUuid(): string {
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  const v = (Math.floor(Math.random() * 4) + 8).toString(16);
  return h() + h() + '-' + h() + '-4' + h().slice(1) + '-' + v + h().slice(1) + '-' + h() + h() + h();
}

function generateEmail(): string {
  const first = pick(FIRST_NAMES).toLowerCase();
  const last = pick(LAST_NAMES).toLowerCase();
  const sep = pick(['.', '_', '']);
  const num = Math.random() > 0.5 ? String(rInt(1, 999)) : '';
  return first + sep + last + num + '@' + pick(DOMAINS);
}

function generateName(): string {
  return pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES);
}

function generatePhone(): string {
  const area = rInt(200, 999);
  const exchange = rInt(200, 999);
  const subscriber = rInt(1000, 9999);
  return '+1 (' + area + ') ' + exchange + '-' + subscriber;
}

function generateAddress(): string {
  const num = rInt(1, 9999);
  const street = pick(STREETS);
  const city = pick(CITIES);
  const state = pick(STATE_CODES);
  const zip = pad2(rInt(0, 99)) + pad2(rInt(0, 99)) + String(rInt(0, 9));
  return num + ' ' + street + ', ' + city + ', ' + state + ' ' + zip;
}

function generateWord(): string {
  return pick(WORDS);
}

function generateSentence(): string {
  const wordCount = rInt(6, 14);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(generateWord());
  }
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.';
}

function generateInteger(min: number, max: number): string {
  return String(rInt(min, max));
}

function generateFloat(min: number, max: number, decimals: number): string {
  const val = Math.random() * (max - min) + min;
  return val.toFixed(decimals);
}

export type ParsedCommand = {
  count: number;
  type: string;
  args: string;
};

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) throw new Error('Enter a command like "10 emails" or "5 names"');

  const match = trimmed.match(/^(\d+)\s+(.+)$/);
  if (!match) throw new Error('Format: "<count> <type>", e.g. "10 emails", "5 UUIDs", "8 integers 1-100"');

  const count = parseInt(match[1], 10);
  if (count < 1 || count > 1000) throw new Error('Count must be between 1 and 1000');

  const rest = match[2].trim();

  // Check for "integers <min>-<max>"
  const intMatch = rest.match(/^integers?\s+(\d+)-(\d+)$/);
  if (intMatch) return { count, type: 'integer', args: intMatch[1] + '-' + intMatch[2] };

  // Check for "floats <min>-<max>" or "floats <min>-<max> <decimals>"
  const floatMatch = rest.match(/^floats?\s+([\d.]+)-([\d.]+)(?:\s+(\d+))?$/);
  if (floatMatch) return { count, type: 'float', args: floatMatch[1] + '-' + floatMatch[2] + '-' + (floatMatch[3] || '2') };

  return { count, type: rest.replace(/s$/, '').trim(), args: '' };
}

export function generateData(command: ParsedCommand): string[] {
  const results: string[] = [];
  const { count, type, args } = command;

  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'email':
        results.push(generateEmail());
        break;
      case 'name':
        results.push(generateName());
        break;
      case 'phone':
      case 'phone number':
        results.push(generatePhone());
        break;
      case 'address':
        results.push(generateAddress());
        break;
      case 'word':
        results.push(generateWord());
        break;
      case 'sentence':
        results.push(generateSentence());
        break;
      case 'uuid': {
        results.push(generateUuid());
        break;
      }
      case 'integer': {
        const parts = args.split('-');
        const min = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        results.push(generateInteger(isNaN(min) ? 1 : min, isNaN(max) ? 100 : max));
        break;
      }
      case 'float': {
        const fparts = args.split('-');
        const fmin = parseFloat(fparts[0]);
        const fmax = parseFloat(fparts[1]);
        const fdec = parseInt(fparts[2], 10);
        results.push(generateFloat(isNaN(fmin) ? 0 : fmin, isNaN(fmax) ? 1 : fmax, isNaN(fdec) ? 2 : fdec));
        break;
      }
      default:
        throw new Error('Unknown type: "' + type + '". Supported: emails, names, phones, addresses, words, sentences, UUIDs, integers, floats');
    }
  }

  return results;
}

export function processInput(input: string): string {
  const lines = input.split('\n').filter(l => l.trim());
  if (lines.length === 0) return '';

  const allResults: string[] = [];
  for (const line of lines) {
    const cmd = parseCommand(line);
    const items = generateData(cmd);
    allResults.push(...items);
  }

  return allResults.join('\n');
}

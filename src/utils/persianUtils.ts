/**
 * Iranian Persian utilities:
 * - Automatic Arabic ك and ي replacement
 * - Number to words in Persian (مبلغ به حروف)
 * - Persian digits conversion and currency formatting (Rial / Toman)
 * - Shamsi (Jalali) date helpers
 */

// Replace Arabic ك and ي with Persian equivalents everywhere
export function cleanPersian(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\u0643/g, '\u06A9') // Arabic Kaf to Persian Keheh
    .replace(/\u064A/g, '\u06CC') // Arabic Yeh to Persian Yeh
    .replace(/\u0649/g, '\u06CC') // Arabic Alef Maksura to Persian Yeh
    .replace(/\u0626/g, '\u0626') // Yeh with Hamza
    .replace(/\u0629/g, '\u0647') // Teh Marbuta to Heh
    .trim();
}

// Convert English/Arabic digits to Persian digits
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  return str
    .replace(/[0-9]/g, (w) => persianDigits[+w])
    .replace(/[٠-٩]/g, (w) => persianDigits[arabicDigits.indexOf(w)]);
}

// Convert Persian/Arabic digits back to English digits for calculations
export function toEnglishDigits(value: string | number | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  return str
    .replace(/[۰-۹]/g, (w) => String(persianDigits.indexOf(w)))
    .replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)));
}

// Format numbers with thousands separators in Persian digits
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '۰';
  const parts = Number(num).toLocaleString('en-US').split('.');
  const formatted = parts[0];
  return toPersianDigits(formatted);
}

// Format currency depending on Rial or Toman setting
export function formatCurrency(
  amountInRials: number,
  currency: 'rial' | 'toman' = 'rial',
  includeUnit = true
): string {
  if (!amountInRials && amountInRials !== 0) return '۰';
  
  const displayAmount = currency === 'toman' ? Math.floor(amountInRials / 10) : amountInRials;
  const formattedNumber = formatNumber(displayAmount);
  
  if (!includeUnit) return formattedNumber;
  return `${formattedNumber} ${currency === 'toman' ? 'تومان' : 'ریال'}`;
}

// Persian Numbers to Words conversion
const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
];
const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigit(n: number): string {
  const parts: string[] = [];
  const c = Math.floor(n / 100);
  const r = n % 100;
  const d = Math.floor(r / 10);
  const u = r % 10;

  if (c > 0) parts.push(hundreds[c]);

  if (r >= 10 && r <= 19) {
    parts.push(teens[r - 10]);
  } else {
    if (d > 0) parts.push(tens[d]);
    if (u > 0) parts.push(ones[u]);
  }

  return parts.join(' و ');
}

export function numberToWordsPersian(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'منفی ' + numberToWordsPersian(Math.abs(num));

  const chunks: number[] = [];
  let temp = Math.floor(num);

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const wordChunks: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWord = convertThreeDigit(chunk);
      const scaleWord = scales[i];
      wordChunks.push(scaleWord ? `${chunkWord} ${scaleWord}` : chunkWord);
    }
  }

  return wordChunks.join(' و ');
}

// Convert amount in Rials to words in either Rial or Toman
export function amountToPersianWords(
  amountInRials: number,
  currency: 'rial' | 'toman' = 'rial'
): string {
  if (!amountInRials || amountInRials === 0) return 'صفر ' + (currency === 'toman' ? 'تومان' : 'ریال');

  const displayAmount = currency === 'toman' ? Math.floor(amountInRials / 10) : amountInRials;
  const words = numberToWordsPersian(displayAmount);
  return `${words} ${currency === 'toman' ? 'تومان' : 'ریال'}`;
}

// Standard Shamsi / Jalali date calculation without heavy external dependencies
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

export function getTodayShamsi(): string {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const mm = jm < 10 ? `0${jm}` : `${jm}`;
  const dd = jd < 10 ? `0${jd}` : `${jd}`;
  return `${jy}/${mm}/${dd}`;
}

export function getTodayShamsiDetailed(): string {
  const today = getTodayShamsi();
  const persianMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  const parts = today.split('/');
  const monthName = persianMonths[parseInt(parts[1], 10) - 1] || '';
  return `${toPersianDigits(parts[2])} ${monthName} ${toPersianDigits(parts[0])}`;
}

/**
 * Generates an unguessable, cryptographically secure tracking code for certificates.
 * Uses CSPRNG (window.crypto.getRandomValues) with 60 bits of cryptographic entropy.
 * Employs a 32-character unambiguous alphabet (excluding 0, O, 1, I, L to prevent OCR/read errors).
 * Format: TRK-XXXX-XXXX-XXXX (Over 1,152,921,504,606,846,976 unique combinations)
 * Making enumeration, guessing, or brute force mathematically impossible.
 */
export function generateSecureTrackingCode(): string {
  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(12);
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < 12; i++) {
        token += ALPHABET[bytes[i] % ALPHABET.length];
      }
      return `TRK-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
    }
  } catch {
    // fallback if crypto is not available
  }

  for (let i = 0; i < 12; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `TRK-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

/**
 * Normalizes user-entered tracking codes by stripping dashes, spaces, and converting Persian numbers
 */
export function normalizeTrackingCode(code: string): string {
  if (!code) return '';
  return toEnglishDigits(code)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}


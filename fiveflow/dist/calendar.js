// Simplified civil-date day-pillar calculation. This is not a full birth chart.
// Birth dates roll over at local midnight; no birth time or birthplace is used.
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ELEMENTS = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];
const DAY_MS = 86_400_000;
// 2001-03-30 was 壬辰, the 29th day in the 60-day cycle.
const ANCHOR_DAY = Date.UTC(2001, 2, 30) / DAY_MS;
const ANCHOR_CYCLE_INDEX = 28;

function civilDayNumber(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) throw new RangeError('Expected a valid date in YYYY-MM-DD format');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new RangeError('Invalid calendar date');
  }
  // setUTCFullYear handles years 0001–0099 without Date.UTC's 1900 offset.
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError('Invalid calendar date');
  }
  return date.getTime() / DAY_MS;
}

/** Return a day pillar and its heavenly-stem element for a Gregorian civil date. */
export function getDayProfile(dateString) {
  const offset = civilDayNumber(dateString) - ANCHOR_DAY;
  const cycleIndex = ((ANCHOR_CYCLE_INDEX + offset) % 60 + 60) % 60;
  const stemIndex = cycleIndex % 10;
  const stem = STEMS[stemIndex];
  const branch = BRANCHES[cycleIndex % 12];
  return {
    date: dateString,
    dayPillar: stem + branch,
    stem,
    branch,
    element: ELEMENTS[stemIndex],
    polarity: stemIndex % 2 === 0 ? 'yang' : 'yin',
    cycleIndex,
  };
}

/** Today's Gregorian civil date in Japan, regardless of the device's timezone. */
export function getJapanToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const GENERATES = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CONTROLS = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

/**
 * Compare personal day-stem element with today's day-stem element.
 * Values describe the direction of the relationship, not good/bad fortune.
 */
export function getElementRelation(personElement, dayElement) {
  if (!Object.hasOwn(GENERATES, personElement) || !Object.hasOwn(GENERATES, dayElement)) {
    throw new RangeError('Unknown five-element value');
  }
  if (personElement === dayElement) return 'same';
  if (GENERATES[dayElement] === personElement) return 'supported';
  if (GENERATES[personElement] === dayElement) return 'expressing';
  if (CONTROLS[dayElement] === personElement) return 'constrained';
  return 'directing';
}

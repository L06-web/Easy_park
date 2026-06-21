const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BRASILIA_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

function getBrasiliaParts(date = new Date()) {
  const parsedDate = parseDate(date);
  const parts = formatter.formatToParts(parsedDate);
  const mapped = Object.fromEntries(
    parts
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)])
  );

  return {
    year: mapped.year,
    month: mapped.month,
    day: mapped.day,
    hour: mapped.hour,
    minute: mapped.minute,
    second: mapped.second,
    millisecond: parsedDate.getMilliseconds()
  };
}

function getBrasiliaOffsetMinutes(date = new Date()) {
  const parsedDate = parseDate(date);
  const parts = getBrasiliaParts(parsedDate);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parsedDate.getMilliseconds()
  );

  return Math.round((localAsUtc - parsedDate.getTime()) / 60000);
}

function toBrasiliaISOString(date = new Date()) {
  const parsedDate = parseDate(date);
  const parts = getBrasiliaParts(parsedDate);

  return [
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    `T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}.${pad(parsedDate.getMilliseconds(), 3)}`,
    formatOffset(getBrasiliaOffsetMinutes(parsedDate))
  ].join('');
}

function agoraBrasiliaISO() {
  return toBrasiliaISOString(new Date());
}

function getBrasiliaHour(date = new Date()) {
  return getBrasiliaParts(date).hour;
}

function getBrasiliaDay(date = new Date()) {
  const parts = getBrasiliaParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function inicioDaHoraAtualBrasilia(date = new Date()) {
  const parts = getBrasiliaParts(date);
  return fromBrasiliaParts({
    ...parts,
    minute: 0,
    second: 0,
    millisecond: 0
  });
}

function subtrairDiasBrasilia(date = new Date(), days = 0) {
  return adicionarDiasBrasilia(date, -days);
}

function adicionarDiasBrasilia(date = new Date(), days = 0) {
  const parts = getBrasiliaParts(date);
  const shiftedLocal = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day + days,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond
  ));

  return fromBrasiliaParts({
    year: shiftedLocal.getUTCFullYear(),
    month: shiftedLocal.getUTCMonth() + 1,
    day: shiftedLocal.getUTCDate(),
    hour: shiftedLocal.getUTCHours(),
    minute: shiftedLocal.getUTCMinutes(),
    second: shiftedLocal.getUTCSeconds(),
    millisecond: shiftedLocal.getUTCMilliseconds()
  });
}

function fromBrasiliaParts(parts) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0,
    parts.millisecond || 0
  );
  let offset = getBrasiliaOffsetMinutes(new Date(localAsUtc));
  let instant = new Date(localAsUtc - offset * 60000);
  const correctedOffset = getBrasiliaOffsetMinutes(instant);

  if (correctedOffset !== offset) {
    instant = new Date(localAsUtc - correctedOffset * 60000);
  }

  return instant;
}

function parseDate(date) {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Data invalida');
  }

  return parsedDate;
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const mins = absolute % 60;

  return `${sign}${pad(hours)}:${pad(mins)}`;
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

module.exports = {
  BRASILIA_TIME_ZONE,
  agoraBrasiliaISO,
  toBrasiliaISOString,
  getBrasiliaHour,
  getBrasiliaDay,
  inicioDaHoraAtualBrasilia,
  adicionarDiasBrasilia,
  subtrairDiasBrasilia
};

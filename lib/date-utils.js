export function getLocalDateString(timezone) {
  if (!timezone) {
    return new Date().toISOString().split('T')[0];
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function getLocalDateOffset(timezone, daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  if (!timezone) {
    return date.toISOString().split('T')[0];
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

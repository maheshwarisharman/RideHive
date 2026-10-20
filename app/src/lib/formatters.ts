import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Kolkata';

/**
 * Format integer paise to display INR string.
 * Example: 11200 paise -> "₹112", 11250 paise -> "₹112.50"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  if (Number.isInteger(rupees)) {
    return `₹${rupees.toLocaleString('en-IN')}`;
  }
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format ISO datetime string or Date object in Asia/Kolkata time zone.
 */
export function formatRideTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const zoned = toZonedTime(date, TIME_ZONE);

  if (isToday(zoned)) {
    return `Today, ${format(zoned, 'h:mm a')}`;
  }
  if (isTomorrow(zoned)) {
    return `Tomorrow, ${format(zoned, 'h:mm a')}`;
  }
  return format(zoned, 'EEE, d MMM · h:mm a');
}

/**
 * Short time format (e.g. "6:30 PM")
 */
export function formatTimeOnly(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const zoned = toZonedTime(date, TIME_ZONE);
  return format(zoned, 'h:mm a');
}

/**
 * Format relative departure time (e.g. "in 25 min", "Leaves 6:30 PM")
 */
export function formatRelativeDeparture(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format meters to human readable distance (e.g. 850 m, 12.4 km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Format seconds to duration string (e.g. "45 min", "1 hr 15 min")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Calculate per-person fare split in integer paise.
 * Evenly distributes remainder paise so sum(splits) === totalPaise exactly.
 */
export function calculateExactSplit(totalPaise: number, memberCount: number): number[] {
  if (memberCount <= 0) return [];
  const baseShare = Math.floor(totalPaise / memberCount);
  const remainder = totalPaise % memberCount;

  return Array.from({ length: memberCount }, (_, index) => {
    return baseShare + (index < remainder ? 1 : 0);
  });
}

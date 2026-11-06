import { TimeSlot, Booking } from '../types';

/**
 * Formats a 24-hour time "HH:mm" into a 12-hour human readable time "h:mm AM/PM".
 */
export function formatTime12h(time24: string): string {
  const [hoursStr, minsStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minsStr.padStart(2, '0');
  const ampm = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  
  if (hours === 0 || hours === 24) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a start and end time range: "7:00 AM - 7:20 AM"
 */
export function formatSlotRange(startTime: string, endTime: string): string {
  return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
}

/**
 * Checks if a given date string or Date object falls on a weekend (Saturday or Sunday).
 */
export function isWeekendDay(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Helper to add minutes to a "HH:mm" time string.
 */
function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Generate 20-minute interval slots between start and end times.
 * Handles ranges that stay within the same day or cross midnight (e.g. 23:00 to 02:00).
 */
export function generateRangeSlots(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  dateString: string,
  period: 'morning' | 'evening' | 'night',
  isWeekend: boolean,
  crossesMidnight = false
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = 20; // 20 minutes

  let currentTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = crossesMidnight 
    ? (endHour + 24) * 60 + endMinute 
    : endHour * 60 + endMinute;

  while (currentTotalMinutes + slotDuration <= endTotalMinutes) {
    const slotStartTotal = currentTotalMinutes % (24 * 60);
    const slotEndTotal = (currentTotalMinutes + slotDuration) % (24 * 60);

    const startH = Math.floor(slotStartTotal / 60);
    const startM = slotStartTotal % 60;
    const endH = Math.floor(slotEndTotal / 60);
    const endM = slotEndTotal % 60;

    const startTimeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const id = `${dateString}_${startTimeStr.replace(':', '-')}`;

    slots.push({
      id,
      dateString,
      startTime: startTimeStr,
      endTime: endTimeStr,
      formattedTime: formatSlotRange(startTimeStr, endTimeStr),
      period,
      isWeekend,
      isBooked: false,
    });

    currentTotalMinutes += slotDuration;
  }

  return slots;
}

/**
 * Generates all available slots for a given date according to Ramesh J's consulting rules:
 * - Weekdays (Mon-Fri):
 *   - Morning: 7:00 AM - 8:00 AM (20 min slots) -> 3 slots
 *   - Evening: 6:00 PM - 7:00 PM (18:00 - 19:00, 20 min slots) -> 3 slots
 * - Weekends (Sat-Sun):
 *   - Morning: 6:00 AM - 9:00 AM (20 min slots) -> 9 slots
 *   - Evening: 5:00 PM - 8:00 PM (17:00 - 20:00, 20 min slots) -> 9 slots
 *   - Night: 11:00 PM - 2:00 AM (23:00 - 02:00 next day, 20 min slots) -> 9 slots
 */
export function generateSlotsForDate(
  dateInput: Date | string,
  existingBookings: Booking[] = [],
  referenceNow: Date = new Date()
): TimeSlot[] {
  const dateObj = typeof dateInput === 'string' 
    ? new Date(`${dateInput}T00:00:00`) 
    : dateInput;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const weekend = isWeekendDay(dateObj);
  let rawSlots: TimeSlot[] = [];

  if (!weekend) {
    // Weekday: 7-8 AM (morning) and 6-7 PM (evening)
    const morningSlots = generateRangeSlots(7, 0, 8, 0, dateString, 'morning', false);
    const eveningSlots = generateRangeSlots(18, 0, 19, 0, dateString, 'evening', false);
    rawSlots = [...morningSlots, ...eveningSlots];
  } else {
    // Weekend: 6-9 AM, 5-8 PM, 11 PM - 2 AM
    const morningSlots = generateRangeSlots(6, 0, 9, 0, dateString, 'morning', true);
    const eveningSlots = generateRangeSlots(17, 0, 20, 0, dateString, 'evening', true);
    // 23:00 to 02:00 crosses midnight
    const nightSlots = generateRangeSlots(23, 0, 2, 0, dateString, 'night', true, true);
    rawSlots = [...morningSlots, ...eveningSlots, ...nightSlots];
  }

  // Booked slots map for this date
  const bookedSlotIds = new Set(
    existingBookings
      .filter((b) => b.status === 'confirmed' && b.dateString === dateString)
      .map((b) => b.slotId)
  );

  // Check past status
  const now = referenceNow;
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDay = String(now.getDate()).padStart(2, '0');
  const todayDateString = `${nowYear}-${nowMonth}-${nowDay}`;
  const isToday = dateString === todayDateString;
  const isPastDay = dateString < todayDateString;

  return rawSlots.map((slot) => {
    let isPast = isPastDay;
    if (isToday) {
      const [slotH, slotM] = slot.startTime.split(':').map(Number);
      const slotTimeDate = new Date(nowYear, now.getMonth(), now.getDate(), slotH, slotM);
      // Night slots starting with 00:xx or 01:xx on same day actually belong to the late night session
      if (slot.period === 'night' && slotH < 6) {
        // Next day early morning: add 1 day
        slotTimeDate.setDate(slotTimeDate.getDate() + 1);
      }
      isPast = slotTimeDate.getTime() <= now.getTime();
    }

    return {
      ...slot,
      isBooked: bookedSlotIds.has(slot.id),
      isPast,
    };
  });
}

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { isWeekendDay } from '../utils/slotGenerator';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of the month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isDatePast = (date: Date) => {
    const today = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return target < today;
  };

  // Quick jump presets
  const handleSelectToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentMonth(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
    onSelectDate(tomorrow);
  };

  const handleSelectUpcomingWeekend = () => {
    const date = new Date();
    const day = date.getDay();
    const daysUntilWeekend = day === 0 ? 6 : (day === 6 ? 1 : 6 - day);
    date.setDate(date.getDate() + daysUntilWeekend);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onSelectDate(date);
  };

  const selectedIsWeekend = isWeekendDay(selectedDate);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 backdrop-blur-sm">
      {/* Month header & navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-slate-800/70 text-xs">
        <span className="text-slate-400 font-medium mr-1">Quick date:</span>
        <button
          type="button"
          onClick={handleSelectToday}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
        >
          Today
        </button>
        <button
          type="button"
          onClick={handleSelectTomorrow}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={handleSelectUpcomingWeekend}
          className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 transition-colors font-medium flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Upcoming Weekend
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-semibold text-slate-400">
        {DAY_NAMES.map((name, i) => (
          <div key={name} className={i === 0 || i === 6 ? 'text-emerald-400/90' : ''}>
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-xs">
        {/* Previous month padding days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => {
          const prevDay = daysInPrevMonth - firstDayIndex + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="h-11 flex items-center justify-center text-slate-600 rounded-lg select-none"
            >
              {prevDay}
            </div>
          );
        })}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDate = new Date(year, month, dayNum);
          const isSelected = isSameDay(dayDate, selectedDate);
          const isPast = isDatePast(dayDate);
          const isWeekend = isWeekendDay(dayDate);
          const isToday = isSameDay(dayDate, new Date());

          let btnClass = 'h-11 rounded-xl flex flex-col items-center justify-center relative font-medium transition-all ';

          if (isSelected) {
            btnClass += 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 shadow-md shadow-indigo-500/30 scale-[1.03] z-10';
          } else if (isPast) {
            btnClass += 'text-slate-600 cursor-not-allowed opacity-50';
          } else if (isWeekend) {
            btnClass += 'bg-slate-800/90 hover:bg-emerald-950/50 hover:border-emerald-600/40 text-emerald-200 border border-slate-700/50 cursor-pointer';
          } else {
            btnClass += 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 border border-slate-800 cursor-pointer';
          }

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dayDate)}
              className={btnClass}
              title={
                isPast
                  ? 'Past date unavailable'
                  : isWeekend
                  ? 'Weekend: 27 slots (6-9 AM, 5-8 PM, 11 PM-2 AM)'
                  : 'Weekday: 6 slots (7-8 AM, 6-7 PM)'
              }
            >
              <span className="leading-none">{dayNum}</span>
              
              {/* Slot indicators */}
              {!isPast && (
                <div className="flex items-center gap-0.5 mt-1">
                  {isWeekend ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Weekend Slots (27 available)" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Weekday Slots (6 available)" />
                  )}
                </div>
              )}

              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Availability Banner */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                selectedIsWeekend
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {selectedIsWeekend ? 'Weekend Rules (27 Slots)' : 'Weekday Rules (6 Slots)'}
            </span>
          </div>

          <span className="text-slate-400 text-[11px]">20 min / slot</span>
        </div>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
          {selectedIsWeekend ? (
            <>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-300">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Morning: 6:00 – 9:00 AM</div>
                  <div className="text-slate-400 text-[10px]">9 slots (20 min intervals)</div>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-300">
                <Sunset className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Evening: 5:00 – 8:00 PM</div>
                  <div className="text-slate-400 text-[10px]">9 slots (20 min intervals)</div>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-300 sm:col-span-2 lg:col-span-1">
                <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Night Owl: 11:00 PM – 2:00 AM</div>
                  <div className="text-slate-400 text-[10px]">9 slots (20 min intervals)</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-300">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Morning: 7:00 – 8:00 AM</div>
                  <div className="text-slate-400 text-[10px]">3 slots (20 min intervals)</div>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-slate-300">
                <Sunset className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Evening: 6:00 – 7:00 PM</div>
                  <div className="text-slate-400 text-[10px]">3 slots (20 min intervals)</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

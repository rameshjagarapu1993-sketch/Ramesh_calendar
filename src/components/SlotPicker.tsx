import React, { useState } from 'react';
import { Clock, Sun, Sunset, Moon, CheckCircle2, AlertCircle, Video } from 'lucide-react';
import { TimeSlot } from '../types';

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  selectedDate: Date;
  timeZoneLabel: string;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  selectedDate,
  timeZoneLabel,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'morning' | 'evening' | 'night'>('all');

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const eveningSlots = slots.filter((s) => s.period === 'evening');
  const nightSlots = slots.filter((s) => s.period === 'night');

  const filteredSlots = slots.filter((s) => {
    if (filterPeriod === 'all') return true;
    return s.period === filterPeriod;
  });

  const availableCount = slots.filter((s) => !s.isBooked && !s.isPast).length;
  const isWeekend = slots.some((s) => s.isWeekend);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Select a 20-Min Slot</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Times displayed in <span className="text-slate-200 font-medium">{timeZoneLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {availableCount} available
          </span>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1 py-3 border-b border-slate-800/80 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterPeriod('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterPeriod === 'all'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          All Slots ({slots.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterPeriod('morning')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            filterPeriod === 'morning'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          Morning ({morningSlots.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterPeriod('evening')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            filterPeriod === 'evening'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Sunset className="w-3.5 h-3.5 text-indigo-400" />
          Evening ({eveningSlots.length})
        </button>

        {isWeekend && (
          <button
            type="button"
            onClick={() => setFilterPeriod('night')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterPeriod === 'night'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-emerald-400" />
            Nightowl ({nightSlots.length})
          </button>
        )}
      </div>

      {/* Slots Grid */}
      <div className="pt-4 max-h-[360px] overflow-y-auto pr-1">
        {filteredSlots.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            No slots in this time window.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isUnavailable = slot.isBooked || slot.isPast;

              let slotClass =
                'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ';

              if (isSelected) {
                slotClass +=
                  'bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.01] ring-2 ring-indigo-400';
              } else if (slot.isBooked) {
                slotClass +=
                  'bg-slate-950/60 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-60';
              } else if (slot.isPast) {
                slotClass +=
                  'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40';
              } else {
                slotClass +=
                  'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-500 text-slate-200 cursor-pointer shadow-sm';
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => onSelectSlot(slot)}
                  className={slotClass}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                      {slot.formattedTime.split(' - ')[0]}
                      <span className="text-xs font-normal text-slate-400">
                        &rarr; {slot.formattedTime.split(' - ')[1]}
                      </span>
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                    {slot.isBooked && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                        Booked
                      </span>
                    )}
                    {slot.isPast && !slot.isBooked && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-500 rounded">
                        Past
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Video className="w-3 h-3 text-blue-400" />
                      Google Meet (20m)
                    </span>
                    <span className="capitalize text-[10px] text-slate-400">
                      {slot.period}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Selected slot: <strong>{selectedSlot.formattedTime}</strong> on{' '}
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <span className="text-[11px] text-indigo-300 font-medium">Ready to reserve &rarr;</span>
        </div>
      )}
    </div>
  );
};

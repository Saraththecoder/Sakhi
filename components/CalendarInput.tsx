
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarInputProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

const CalendarInput: React.FC<CalendarInputProps> = ({ selectedDate, onDateSelect, className = '' }) => {
  // Parse selected date or default to today
  // Handle invalid date strings gracefully
  const getInitialDate = () => {
      const d = new Date(selectedDate);
      return isNaN(d.getTime()) ? new Date() : d;
  };
  
  const [viewDate, setViewDate] = useState(getInitialDate());

  // If selectedDate changes externally (e.g. from props), we might want to update view,
  // but typically we don't want to jump around if the user is browsing months.
  // We'll trust the user's navigation for now.

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    // Construct YYYY-MM-DD
    // Use Date.UTC to avoid timezone shifts when formatting to ISO string
    const newDate = new Date(Date.UTC(year, month, day));
    const isoDate = newDate.toISOString().split('T')[0];
    onDateSelect(isoDate);
  };

  const renderDays = () => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty cells for offset
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Days
    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(Date.UTC(year, month, d));
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const isSelected = selectedDate === currentDateStr;
      
      const today = new Date();
      const isToday = today.toISOString().split('T')[0] === currentDateStr;
      const isFuture = currentDate > today;

      days.push(
        <button
          key={d}
          onClick={() => handleDateClick(d)}
          className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
            ${isSelected 
              ? 'bg-wa-teal text-white shadow-md scale-100 font-bold' 
              : isToday 
                ? 'text-wa-teal border border-wa-teal font-semibold' 
                : 'text-gray-700 hover:bg-gray-100'}
            ${isFuture ? 'opacity-50' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <button 
            type="button"
            onClick={handlePrevMonth} 
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-800 text-lg">
          {monthNames[month]} {year}
        </span>
        <button 
            type="button"
            onClick={handleNextMonth} 
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs font-bold text-gray-400 h-8 flex items-center justify-center uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarInput;

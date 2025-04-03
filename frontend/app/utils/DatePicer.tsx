import React, { useState, useEffect } from "react";

interface DatePickerProps {
  selectedDate?: Date;
  onChange?: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate = new Date(),
  onChange,
}) => {
  // State to track selected date and calendar visibility
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Update internal date when prop changes
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  // Format date for display in the input field
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get days in month for calendar generation
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for the first day of the month
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Change month handlers
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Select a specific day
  const selectDay = (day: number | null): void => {
    if (day) {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      setCurrentDate(newDate);
      setShowCalendar(false); // Hide calendar after selection

      // Call the onChange handler if provided
      if (onChange) {
        onChange(newDate);
      }
    }
  };

  // Get current month and year for display
  const currentMonthYear = currentDate.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
  });

  // Days of the week headers (for Hebrew locale)
  const weekdays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  return (
    <div className="w-64 relative">
      {/* Date input display */}
      <div
        className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer flex justify-between items-center"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <span>{formatDate(currentDate)}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div className="absolute top-12 left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 w-64">
          {/* Calendar header with month/year and navigation */}
          <div className="flex justify-between items-center p-2 border-b">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="font-semibold">{currentMonthYear}</div>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                onClick={() => selectDay(day)}
                className={`
                  h-8 w-8 flex items-center justify-center text-sm rounded-full
                  ${day ? "cursor-pointer hover:bg-gray-100" : ""}
                  ${
                    day &&
                    day === currentDate.getDate() &&
                    selectedDate.getMonth() === currentDate.getMonth() &&
                    selectedDate.getFullYear() === currentDate.getFullYear()
                      ? "bg-blue-500 text-white"
                      : "text-gray-700"
                  }
                `}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Today button */}
          <div className="border-t p-2 flex justify-center">
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setShowCalendar(false);
                if (onChange) {
                  onChange(today);
                }
              }}
              className="w-full py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              היום
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

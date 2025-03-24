import React, { useState } from "react";

const DatePicker = () => {
  // State to track selected date and calendar visibility
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Format date for display in the input field
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
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
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
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
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  // Select a specific day
  interface SelectDayProps {
    day: number | null;
  }

  const selectDay = (day: SelectDayProps["day"]): void => {
    if (day) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );
      setSelectedDate(newDate);
      setShowCalendar(false); // Hide calendar after selection
    }
  };

  // Get current month and year for display
  const currentMonthYear = selectedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Days of the week headers
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-64 relative">
      {/* Date input display */}
      <div
        className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer flex justify-between items-center"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <span>{formatDate(selectedDate)}</span>
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
                    day === selectedDate.getDate() &&
                    selectedDate.getMonth() ===
                      new Date(selectedDate).getMonth()
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
          <div className="border-t p-2">
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setShowCalendar(false);
              }}
              className="py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

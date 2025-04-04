"use client";

import React, { useState, useEffect, FormEvent } from "react";
import DatePicker from "../utils/DatePicer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const OperationsPage = () => {
  // State for form fields
  const [operationDate, setOperationDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>("asotaCalaniotAshdod");
  const [startHour, setStartHour] = useState<string>("09:00");
  const [endHour, setEndHour] = useState<string>("17:00");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Fetch a default doctor on component mount
  useEffect(() => {
    const fetchDefaultDoctor = async () => {
      try {
        const response = await fetch(`${API_URL}/doctors`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            // Use the first doctor as default
            setSelectedDoctorId(data[0]._id);
          } else {
            setError(
              "No doctors found in the system. Please add a doctor first."
            );
          }
        } else {
          setError("Failed to fetch doctors");
        }
      } catch (error) {
        setError("Error fetching doctors");
        console.error("Error fetching doctors:", error);
      }
    };

    fetchDefaultDoctor();
  }, []);

  // Handle date change from DatePicker
  const handleDateChange = (date: Date) => {
    setOperationDate(date);
  };

  // Get location display name
  const getLocationName = (locationCode: string): string => {
    const locations: Record<string, string> = {
      asotaCalaniotAshdod: "אסותא כלניות אשדוד",
      asotaHolon: "אסותא חולון",
      asotaRamatHahayal: "אסותא רמת החייל",
      bestMedicalBatYam: "בסט מדיקל בת ים",
    };
    return locations[locationCode] || locationCode;
  };

  // Handle submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled correctly
    if (!operationDate || !startHour || !endHour) {
      setError("אנא מלא את כל השדות הנדרשים");
      return;
    }
    // Create date string in YYYY-MM-DD format to prevent timezone issues
    const formatDateNoTimezone = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    // Prepare operation day data
    const operationDayData = {
      date: formatDateNoTimezone(operationDate),
      location,
      startHour,
      endHour,
      doctorId: selectedDoctorId, // Include doctorId in the request
    };

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Send data to backend API
      const response = await fetch(`${API_URL}/operationday`, {
        method: "POST", // Create new operation day
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(operationDayData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "שגיאה בשמירת יום פעולות");
      }

      // Show success message
      setSuccess("יום הפעולות נשמר בהצלחה");

      // Clear form fields
      setOperationDate(new Date());
      setLocation("asotaCalaniotAshdod");
      setStartHour("09:00");
      setEndHour("17:00");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("שגיאה לא ידועה בשמירת יום הפעולות");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">הגדרת יום פעולות</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-right">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operation Date */}
          <div className="text-right">
            <label className="block mb-2">
              תאריך יום פעולה:
              <DatePicker
                selectedDate={operationDate}
                onChange={handleDateChange}
              />
            </label>
          </div>

          {/* Default doctor is used - no selection needed */}

          {/* Location */}
          <div className="text-right">
            <label className="block mb-2">
              מיקום:
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="asotaCalaniotAshdod">אסותא כלניות אשדוד</option>
                <option value="asotaHolon">אסותא חולון</option>
                <option value="asotaRamatHahayal">אסותא רמת החייל</option>
                <option value="bestMedicalBatYam">בסט מדיקל בת ים</option>
              </select>
            </label>
          </div>

          {/* Start Hour */}
          <div className="text-right">
            <label htmlFor="startHour" className="block mb-2">
              שעת התחלה:
            </label>
            <input
              id="startHour"
              type="time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* End Hour */}
          <div className="text-right">
            <label htmlFor="endHour" className="block mb-2">
              שעת סיום:
            </label>
            <input
              id="endHour"
              type="time"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Location-specific warnings or info based on requirements */}
          <div className="md:col-span-2 mt-4">
            {location === "asotaHolon" && (
              <div className="bg-blue-100 p-3 rounded text-right">
                <p className="text-blue-800">
                  שים לב: באסותא חולון נדרש לפחות 8 פעולות ביום
                </p>
              </div>
            )}
            {location === "asotaRamatHahayal" && (
              <div className="bg-blue-100 p-3 rounded text-right">
                <p className="text-blue-800">
                  שים לב: ברמת החייל נדרש לפחות 12 פעולות ביום
                </p>
              </div>
            )}
            {location === "asotaCalaniotAshdod" && (
              <div className="bg-blue-100 p-3 rounded text-right">
                <p className="text-blue-800">
                  שים לב: בכלניות אשדוד נדרש בדיוק 12 פעולות ביום, לא יותר מ-7
                  קולונו
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "שומר..." : "הגדר יום פעולות"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OperationsPage;

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import DatePicker from "../utils/DatePicer";
import IsraeliIDValidator from "../utils/IsraeliIDValidator";

const OperationsPage = () => {
  // State for form fields
  const [operationDate, setOperationDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>("asotaCalaniotAshdod");
  const [startHour, setStartHour] = useState<string>("09:00");
  const [operationType, setOperationType] = useState<string>("colono");
  const [patientId, setPatientId] = useState<string>("");
  const [isPatientIdValid, setIsPatientIdValid] = useState<boolean>(false);
  const [isPatientIdValidated, setIsPatientIdValidated] =
    useState<boolean>(false);

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

  // Calculate end time based on operation type and start time
  const calculateEndTime = (startTime: string, opType: string): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    let durationMinutes = 0;

    switch (opType) {
      case "double":
        durationMinutes = 45;
        break;
      case "colono":
        durationMinutes = 30;
        break;
      case "gastro":
      case "sigmo":
        durationMinutes = 15;
        break;
      default:
        durationMinutes = 30;
    }

    // Calculate new time
    let newMinutes = minutes + durationMinutes;
    let newHours = hours;

    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes %= 60;
    }

    // Format as HH:MM
    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
      2,
      "0"
    )}`;
  };

  // Handle submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled correctly
    if (!operationDate || !startHour) {
      alert("אנא מלא את כל השדות הנדרשים");
      return;
    }

    // Calculate end time
    const endTime = calculateEndTime(startHour, operationType);

    // Create summary
    const summary = `
תאריך ביצוע פעולה: ${operationDate.toLocaleDateString("he-IL")}
מיקום: ${getLocationName(location)}
סוג פעולה: ${getOperationTypeName(operationType)}
שעת התחלה: ${startHour}
שעת סיום: ${endTime}
ת.ז. מטופל: ${patientId}
`;

    // Show summary
    alert(summary);

    // Clear form fields
    setOperationDate(new Date());
    setLocation("asotaCalaniotAshdod");
    setStartHour("09:00");
    setOperationType("colono");
    setPatientId("");
    setIsPatientIdValid(false);
    setIsPatientIdValidated(false);
    setPatientId("");
  };

  // Get operation type display name
  const getOperationTypeName = (opType: string): string => {
    const types: Record<string, string> = {
      colono: "קולונו",
      sigmo: "סיגמו",
      gastro: "גסטרו",
      double: "כפולה",
    };
    return types[opType] || opType;
  };

  return (
    <div className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">הגדרת יום פעולות</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operation Date */}
          <div className="text-right">
            <label className="block mb-2">
              תאריך ביצוע פעולה:
              <DatePicker />
            </label>
          </div>

          {/* Location */}
          <div className="text-right">
            <label className="block mb-2">
              מיקום:
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
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

          {/* patient ID field */}
          {/* ID Validator */}
          <div className="md:col-span-2">
            <IsraeliIDValidator
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onValidityChange={setIsPatientIdValid}
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            הגדר יום פעולות
          </button>
        </div>
      </form>
    </div>
  );
};

export default OperationsPage;

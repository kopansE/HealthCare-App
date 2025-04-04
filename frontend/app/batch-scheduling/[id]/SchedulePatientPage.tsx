"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  HCProvider: string;
  operationType?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

interface OperationDay {
  _id: string;
  date: string;
  location: string;
  startHour: string;
  endHour: string;
  isLocked: boolean;
  doctorId?: string; // Added doctorId property
}

interface Schedule {
  _id: string;
  patientId: string;
  doctorId: string;
  operationDayId: string;
  operationType: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityInfo {
  operationDayId: string;
  nextAvailableTime: string;
  isValid: boolean;
  validationMessage?: string;
}

interface EnhancedOperationDay extends OperationDay {
  availableTime?: string;
  doctor?: Doctor;
  dayOfWeek?: string;
}

const SchedulePatientPage = () => {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [operationDays, setOperationDays] = useState<OperationDay[]>([]);
  const [availabilityInfo, setAvailabilityInfo] = useState<
    Record<string, AvailabilityInfo>
  >({});
  const [filteredDays, setFilteredDays] = useState<EnhancedOperationDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showMore, setShowMore] = useState<boolean>(false);
  const [schedulingInProgress, setSchedulingInProgress] =
    useState<boolean>(false);
  const [selectedDayId, setSelectedDayId] = useState<string>("");

  // Filter states
  const [filterDoctor, setFilterDoctor] = useState<string>("");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");

  // Fetch patient details, doctors, and operation days
  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch patient details
      const patientResponse = await fetch(`${API_URL}/patients/${patientId}`);
      if (!patientResponse.ok) {
        throw new Error("שגיאה בטעינת פרטי המטופל");
      }
      const patientData = await patientResponse.json();
      const patientDetails = patientData.patient || patientData;
      setPatient(patientDetails);

      // Fetch doctors
      const doctorsResponse = await fetch(`${API_URL}/doctors`);
      if (!doctorsResponse.ok) {
        throw new Error("שגיאה בטעינת רשימת רופאים");
      }
      const doctorsData = await doctorsResponse.json();
      setDoctors(doctorsData);

      // Fetch available operation days (not locked)
      const operationDaysResponse = await fetch(`${API_URL}/operationday`);
      if (!operationDaysResponse.ok) {
        throw new Error("שגיאה בטעינת ימי פעולות");
      }
      const operationDaysData = await operationDaysResponse.json();

      // Filter to only include future days that aren't locked
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDays = operationDaysData.filter((day: OperationDay) => {
        const dayDate = new Date(day.date);
        return dayDate >= today && !day.isLocked;
      });

      setOperationDays(futureDays);

      // Calculate availability for each operation day
      await calculateAvailabilityForDays(
        futureDays,
        patientDetails,
        doctorsData
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailabilityForDays = async (
    days: OperationDay[],
    patient: Patient,
    doctorsList: Doctor[]
  ) => {
    if (!patient || !patient.operationType) return;

    const availability: Record<string, AvailabilityInfo> = {};
    const enhancedDays: EnhancedOperationDay[] = [];

    // Process each day to find next available time slot
    for (const day of days) {
      try {
        // Get existing schedules for this day
        const schedulesResponse = await fetch(
          `${API_URL}/scheduler/day-schedule/${day._id}`
        );
        if (!schedulesResponse.ok) {
          continue;
        }

        const schedules = await schedulesResponse.json();

        // Check if this location is valid for the patient's health provider
        const isValidLocation = isOperationDayValidForPatient(day, patient);

        // Check colonoscopy constraints for Asota Calaniot
        let isValidColono = true;
        let validationMessage;

        if (day.location === "asotaCalaniotAshdod") {
          const colonoCount = schedules.filter(
            (s: Schedule) =>
              s.operationType === "colono" || s.operationType === "double"
          ).length;

          if (
            (patient.operationType === "colono" ||
              patient.operationType === "double") &&
            colonoCount >= 7
          ) {
            isValidColono = false;
            validationMessage = "הגעת למקסימום קולונו ביום זה";
          }
        }

        // Get next available time for this day
        const nextTime = calculateNextAvailableTime(
          day,
          schedules,
          patient.operationType
        );

        availability[day._id] = {
          operationDayId: day._id,
          nextAvailableTime: nextTime || "",
          isValid: isValidLocation && isValidColono && !!nextTime,
          validationMessage: !isValidLocation
            ? "קופת החולים של המטופל אינה מתאימה למקום זה"
            : !isValidColono
            ? validationMessage
            : !nextTime
            ? "אין זמן פנוי ביום זה"
            : undefined,
        };

        // Only add valid days to the enhancedDays array
        if (isValidLocation && isValidColono && nextTime) {
          // Use the doctor that's already assigned to this operation day
          // The backend should populate the doctorId field
          let assignedDoctor;

          // If the operation day already has a doctorId, find that doctor
          if (day.doctorId) {
            assignedDoctor = doctorsList.find(
              (doc) => doc._id === day.doctorId
            );
          }

          // If no matching doctor found, use the first one (fallback)
          if (!assignedDoctor && doctorsList.length > 0) {
            assignedDoctor = doctorsList[0];
            console.log(
              `No matching doctor found for day ${day._id}, using default`
            );
          }

          const dayOfWeek = getDayOfWeek(day.date);

          if (assignedDoctor) {
            enhancedDays.push({
              ...day,
              availableTime: nextTime,
              doctor: assignedDoctor,
              dayOfWeek,
            });
            console.log(
              `Added day ${day._id} with doctor ${assignedDoctor.firstName} ${assignedDoctor.lastName} and time ${nextTime}`
            );
          } else {
            console.log(`No doctor available for day ${day._id}, skipping`);
          }
        }
      } catch (error) {
        console.error(`Error processing day ${day._id}:`, error);
      }
    }

    setAvailabilityInfo(availability);

    // Sort by date
    enhancedDays.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Store all days but show limited amount
    const displayDays = showMore ? enhancedDays : enhancedDays.slice(0, 15);
    setFilteredDays(displayDays);

    // Apply initial filters
    applyFilters(enhancedDays, filterDoctor, filterDayOfWeek, filterLocation);
  };

  // Update filtered days when showMore changes or availability info updates
  useEffect(() => {
    if (operationDays.length > 0 && filteredDays.length > 0) {
      const allDays = showMore
        ? filteredDays
        : filteredDays.slice(0, Math.min(filteredDays.length, 15));

      // Apply current filters
      applyFilters(allDays, filterDoctor, filterDayOfWeek, filterLocation);
    }
  }, [showMore]);

  // Update filtered days when filters change
  useEffect(() => {
    if (filteredDays.length > 0) {
      applyFilters(filteredDays, filterDoctor, filterDayOfWeek, filterLocation);
    }
  }, [filterDoctor, filterDayOfWeek, filterLocation]);

  // Apply filters to days
  const applyFilters = (
    days: EnhancedOperationDay[],
    doctorFilter: string,
    dayOfWeekFilter: string,
    locationFilter: string
  ) => {
    let filtered = days;

    // Filter by doctor
    if (doctorFilter) {
      filtered = filtered.filter(
        (day) => day.doctor && day.doctor._id === doctorFilter
      );
    }

    // Filter by day of week
    if (dayOfWeekFilter) {
      filtered = filtered.filter((day) => day.dayOfWeek === dayOfWeekFilter);
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter((day) => day.location === locationFilter);
    }

    setFilteredDays(filtered);
  };

  // Check if an operation day is valid for this patient (based on health provider)
  const isOperationDayValidForPatient = (
    day: OperationDay,
    patient: Patient
  ): boolean => {
    const location = day.location;
    const hcProvider = patient.HCProvider;

    // Logic based on location and health provider constraints
    switch (location) {
      case "bestMedicalBatYam":
        return hcProvider === "leumit";
      case "asotaHolon":
        return hcProvider === "maccabi";
      case "asotaRamatHahayal":
      case "asotaCalaniotAshdod":
        return hcProvider === "maccabi" || hcProvider === "leumit";
      default:
        return true;
    }
  };

  // Calculate next available time slot based on operation type and existing schedules
  const calculateNextAvailableTime = (
    day: OperationDay,
    schedules: Schedule[],
    operationType?: string
  ): string | undefined => {
    if (!operationType) return undefined;

    // Get operation duration
    const operationDuration = getOperationDuration(operationType);

    // Convert day start/end times to minutes
    const dayStartMinutes = timeToMinutes(day.startHour);
    const dayEndMinutes = timeToMinutes(day.endHour);

    // Create array of busy time slots
    const busySlots = schedules
      .map((schedule) => ({
        start: timeToMinutes(schedule.startTime),
        end: timeToMinutes(schedule.endTime),
      }))
      .sort((a, b) => a.start - b.start);

    // Find the first available slot
    let currentTime = dayStartMinutes;

    while (currentTime + operationDuration <= dayEndMinutes) {
      // Check if this time slot conflicts with any busy slot
      const conflictFound = busySlots.some(
        (slot) =>
          (currentTime >= slot.start && currentTime < slot.end) || // Start time conflicts
          (currentTime + operationDuration > slot.start &&
            currentTime + operationDuration <= slot.end) || // End time conflicts
          (currentTime <= slot.start &&
            currentTime + operationDuration >= slot.end) // Encompasses a busy slot
      );

      if (!conflictFound) {
        // Return the available time
        return minutesToTime(currentTime);
      }

      // Move to the next potential starting time (try each minute)
      currentTime += 1;
    }

    // No available time slots found
    return undefined;
  };

  // Handle filter changes
  const handleDoctorFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterDoctor(e.target.value);
  };

  const handleDayOfWeekFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterDayOfWeek(e.target.value);
  };

  const handleLocationFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterLocation(e.target.value);
  };

  // Handle reset filters
  const resetFilters = () => {
    setFilterDoctor("");
    setFilterDayOfWeek("");
    setFilterLocation("");
  };

  // Handle scheduling the patient for the selected operation day
  const schedulePatient = async (operationDayId: string) => {
    if (!patient || !operationDayId) return;

    setSchedulingInProgress(true);
    setError("");
    setSuccess("");

    try {
      // Find the selected day's information
      const selectedDay = filteredDays.find(
        (day) => day._id === operationDayId
      );
      if (!selectedDay || !selectedDay.availableTime || !selectedDay.doctor) {
        throw new Error("יום הפעולות שנבחר אינו זמין");
      }

      // Create schedule request
      const scheduleData = {
        patientId: patient._id,
        doctorId: selectedDay.doctor._id,
        operationDayId: operationDayId,
        startTime: selectedDay.availableTime,
      };

      // Send scheduling request
      const response = await fetch(`${API_URL}/scheduler/schedule-specific`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "שגיאה בשיבוץ המטופל");
      }

      setSuccess("המטופל שובץ בהצלחה");

      // Redirect back after successful scheduling
      setTimeout(() => {
        router.push("/batch-scheduling");
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בשיבוץ המטופל");
    } finally {
      setSchedulingInProgress(false);
    }
  };

  // Get day of week from date
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return days[date.getDay()];
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  // Get location name
  const getLocationName = (locationCode: string): string => {
    const locations: Record<string, string> = {
      asotaCalaniotAshdod: "אסותא כלניות אשדוד",
      asotaHolon: "אסותא חולון",
      asotaRamatHahayal: "אסותא רמת החייל",
      bestMedicalBatYam: "בסט מדיקל בת ים",
    };
    return locations[locationCode] || locationCode;
  };

  // Get all unique locations
  const getUniqueLocations = () => {
    const locations = new Set<string>();
    filteredDays.forEach((day) => locations.add(day.location));
    return Array.from(locations);
  };

  // Get all unique days of week
  const getUniqueDaysOfWeek = () => {
    const daysOfWeek = new Set<string>();
    filteredDays.forEach((day) => {
      if (day.dayOfWeek) daysOfWeek.add(day.dayOfWeek);
    });
    return Array.from(daysOfWeek);
  };

  // Get operation type name
  const getOperationTypeName = (code?: string): string => {
    if (!code) return "לא צוין";

    const names: Record<string, string> = {
      colono: "קולונוסקופיה",
      sigmo: "סיגמואידוסקופיה",
      gastro: "גסטרוסקופיה",
      double: "כפולה",
    };
    return names[code] || code;
  };

  // Get health care provider name
  const getHCProviderName = (code: string): string => {
    const names: Record<string, string> = {
      maccabi: "מכבי",
      clalit: "כללית",
      meuhedet: "מאוחדת",
      leumit: "לאומית",
    };
    return names[code] || code;
  };

  // Get all unique doctors from filtered days
  const getUniqueDoctors = () => {
    const doctorSet = new Set<string>();
    const doctorMap: Record<string, Doctor> = {};

    filteredDays.forEach((day) => {
      if (day.doctor) {
        doctorSet.add(day.doctor._id);
        doctorMap[day.doctor._id] = day.doctor;
      }
    });

    return Array.from(doctorSet).map((id) => doctorMap[id]);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">שיבוץ מטופל לפעולה</h1>

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

      {/* Patient details */}
      {patient && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h2 className="text-xl font-bold mb-4 text-right">פרטי מטופל</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-gray-600">שם מלא:</p>
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">תעודת זהות:</p>
              <p className="font-medium">{patient.patientId}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">קופת חולים:</p>
              <p className="font-medium">
                {getHCProviderName(patient.HCProvider)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">סוג פעולה:</p>
              <p className="font-medium">
                {getOperationTypeName(patient.operationType)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter controls */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <h2 className="text-xl font-bold mb-4 text-right">סינון ימי פעולות</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Doctor filter */}
          <div className="text-right">
            <label htmlFor="doctorFilter" className="block mb-2">
              רופא:
            </label>
            <select
              id="doctorFilter"
              value={filterDoctor}
              onChange={handleDoctorFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={loading || schedulingInProgress}
            >
              <option value="">כל הרופאים</option>
              {getUniqueDoctors().map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {`ד"ר ${doctor.firstName} ${doctor.lastName}`}
                </option>
              ))}
            </select>
          </div>

          {/* Day of week filter */}
          <div className="text-right">
            <label htmlFor="dayOfWeekFilter" className="block mb-2">
              יום בשבוע:
            </label>
            <select
              id="dayOfWeekFilter"
              value={filterDayOfWeek}
              onChange={handleDayOfWeekFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={loading || schedulingInProgress}
            >
              <option value="">כל הימים</option>
              {getUniqueDaysOfWeek().map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div className="text-right">
            <label htmlFor="locationFilter" className="block mb-2">
              מקום:
            </label>
            <select
              id="locationFilter"
              value={filterLocation}
              onChange={handleLocationFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={loading || schedulingInProgress}
            >
              <option value="">כל המקומות</option>
              {getUniqueLocations().map((location) => (
                <option key={location} value={location}>
                  {getLocationName(location)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset filters button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            disabled={loading || schedulingInProgress}
          >
            נקה סינון
          </button>
        </div>
      </div>

      {/* Available operation days */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <h2 className="text-xl font-bold mb-4 text-right">ימי פעולות זמינים</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">טוען ימי פעולות זמינים...</p>
          </div>
        ) : (
          <>
            {filteredDays.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  לא נמצאו ימי פעולות זמינים למטופל זה
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border-b text-right">תאריך</th>
                        <th className="px-4 py-2 border-b text-right">
                          יום בשבוע
                        </th>
                        <th className="px-4 py-2 border-b text-right">
                          שעה פנויה
                        </th>
                        <th className="px-4 py-2 border-b text-right">מקום</th>
                        <th className="px-4 py-2 border-b text-right">רופא</th>
                        <th className="px-4 py-2 border-b text-right">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDays.map((day) => (
                        <tr key={day._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b">
                            {formatDate(day.date)}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {day.dayOfWeek}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {day.availableTime}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {getLocationName(day.location)}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {day.doctor
                              ? `ד"ר ${day.doctor.firstName} ${day.doctor.lastName}`
                              : ""}
                          </td>
                          <td className="px-4 py-2 border-b">
                            <button
                              onClick={() => setSelectedDayId(day._id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              disabled={schedulingInProgress}
                            >
                              בחר
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Show more button */}
                {!showMore &&
                  operationDays.length > 15 &&
                  filteredDays.length < operationDays.length && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setShowMore(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        הצג עוד (
                        {operationDays.length -
                          Math.min(15, filteredDays.length)}
                        )
                      </button>
                    </div>
                  )}
              </>
            )}
          </>
        )}
      </div>

      {/* Confirmation modal */}
      {selectedDayId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-right">אישור שיבוץ</h3>
            <p className="mb-6 text-right">
              האם אתה בטוח שברצונך לשבץ את המטופל
              {patient ? ` ${patient.firstName} ${patient.lastName}` : ""}
              ליום הפעולות שנבחר?
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setSelectedDayId("")}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                disabled={schedulingInProgress}
              >
                ביטול
              </button>
              <button
                onClick={() => schedulePatient(selectedDayId)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={schedulingInProgress}
              >
                {schedulingInProgress ? "משבץ..." : "אישור שיבוץ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Link
          href="/batch-scheduling"
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          חזרה לרשימת המטופלים
        </Link>
      </div>
    </div>
  );
};

// Helper functions for time calculations
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

// Helper to calculate operation duration in minutes
const getOperationDuration = (opType: string): number => {
  switch (opType) {
    case "double":
      return 45;
    case "colono":
      return 30;
    case "gastro":
    case "sigmo":
      return 15;
    default:
      return 30; // Default duration
  }
};

export default SchedulePatientPage;

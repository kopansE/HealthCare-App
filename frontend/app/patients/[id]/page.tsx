"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  HCProvider: string;
  phone: string;
  additionalPhone?: string;
  visitDate: string;
  operationType?: string;
  preparationType?: string;
  additionalInfo?: string;
  isSetForOp: boolean;
  doesntWantSurgery: boolean;
}

interface PatientResponse {
  patient: Patient;
  allVisits: Patient[];
}

const PatientPage = () => {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [allVisits, setAllVisits] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${API_URL}/patients/${patientId}`);

        if (!response.ok) {
          throw new Error("לא ניתן למצוא את המטופל המבוקש");
        }

        const data = await response.json();

        // Check if response includes both patient and allVisits
        if (data.patient && data.allVisits) {
          setPatient(data.patient);
          setAllVisits(data.allVisits);
        } else {
          // If using old API format, set the data as patient and empty array for visits
          setPatient(data);
          setAllVisits([data]); // Include current patient data as a visit
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "שגיאה לא ידועה");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  // Map health care provider codes to Hebrew names
  const getHCProviderName = (code: string): string => {
    const names: Record<string, string> = {
      maccabi: "מכבי",
      clalit: "כללית",
      meuhedet: "מאוחדת",
      leumit: "לאומית",
    };
    return names[code] || code;
  };

  // Map operation type codes to Hebrew names
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

  // Map preparation type codes to Hebrew names
  const getPreparationTypeName = (code?: string): string => {
    if (!code) return "לא צוין";

    const names: Record<string, string> = {
      piko: "פיקולוקס",
      meroken: "מרוקן",
      noPrep: "ללא הכנה",
    };
    return names[code] || code;
  };

  // Handle schedule button click
  const handleScheduleClick = (visitId: string) => {
    alert("לחצת על כפתור השיבוץ");
    // In the future, this will navigate to the scheduling page for this specific visit
  };

  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto rtl">
        <div className="text-center py-8">
          <p className="text-gray-600">טוען פרטי מטופל...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-3xl mx-auto rtl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <p>{error}</p>
        </div>
        <div className="flex justify-center mt-4">
          <Link
            href="/search"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            חזרה לחיפוש
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 max-w-3xl mx-auto rtl">
        <div className="text-center py-8">
          <p className="text-gray-600">המטופל לא נמצא</p>
        </div>
        <div className="flex justify-center mt-4">
          <Link
            href="/search"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            חזרה לחיפוש
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">
        פרטי מטופל: {patient.firstName} {patient.lastName}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-right">
            <h3 className="text-gray-500">תעודת זהות</h3>
            <p className="font-medium">{patient.patientId}</p>
          </div>

          <div className="text-right">
            <h3 className="text-gray-500">שם מלא</h3>
            <p className="font-medium">
              {patient.firstName} {patient.lastName}
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-gray-500">קופת חולים</h3>
            <p className="font-medium">
              {getHCProviderName(patient.HCProvider)}
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-gray-500">טלפון</h3>
            <p className="font-medium">{patient.phone}</p>
          </div>

          {patient.additionalPhone && (
            <div className="text-right">
              <h3 className="text-gray-500">טלפון נוסף</h3>
              <p className="font-medium">{patient.additionalPhone}</p>
            </div>
          )}

          <div className="text-right">
            <h3 className="text-gray-500">תאריך ביקור אחרון במרפאה</h3>
            <p className="font-medium">
              {new Date(patient.visitDate).toLocaleDateString("he-IL")}
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-gray-500">סוג פעולה</h3>
            <p className="font-medium">
              {getOperationTypeName(patient.operationType)}
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-gray-500">סוג הכנה</h3>
            <p className="font-medium">
              {getPreparationTypeName(patient.preparationType)}
            </p>
          </div>

          <div className="text-right md:col-span-2">
            <h3 className="text-gray-500">סטטוס</h3>
            <p className="font-medium">
              {patient.doesntWantSurgery
                ? "לא מעוניין בפעולה"
                : patient.isSetForOp
                ? "נקבע תור לפעולה"
                : "ממתין לתיאום פעולה"}
            </p>
          </div>

          {patient.additionalInfo && (
            <div className="text-right md:col-span-2">
              <h3 className="text-gray-500">הערות נוספות</h3>
              <p className="font-medium">{patient.additionalInfo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Visit History Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-right">ביקורים במרפאה</h2>

        {allVisits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b text-right">תאריך ביקור</th>
                  <th className="px-4 py-2 border-b text-right">פעולה</th>
                  <th className="px-4 py-2 border-b text-right">
                    בוצעה בתאריך
                  </th>
                  <th className="px-4 py-2 border-b text-right">שיבוץ</th>
                </tr>
              </thead>
              <tbody>
                {allVisits.map((visit) => (
                  <tr key={visit._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">
                      {new Date(visit.visitDate).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {getOperationTypeName(visit.operationType)}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {/* Empty for now, will show operation date in the future */}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {!visit.isSetForOp && !visit.doesntWantSurgery && (
                        <button
                          onClick={() => handleScheduleClick(visit._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          שבץ פעולה
                        </button>
                      )}
                      {visit.isSetForOp && (
                        <span className="text-green-600">משובץ</span>
                      )}
                      {visit.doesntWantSurgery && (
                        <span className="text-red-600">לא מעוניין</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">
            לא נמצאו ביקורים קודמים למטופל זה
          </p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Link
          href="/search"
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          חזרה לחיפוש
        </Link>

        {/* Placeholder for future functionality */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled
        >
          שמירת שינויים
        </button>
      </div>
    </div>
  );
};

export default PatientPage;

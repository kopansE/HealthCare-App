"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  HCProvider: string;
  phone: string;
  operationType?: string;
  visitDate: string;
  isSetForOp: boolean;
  doesntWantSurgery: boolean;
}

const BatchSchedulingPage = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("visitDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterHCProvider, setFilterHCProvider] = useState<string>("");
  const [filterOperationType, setFilterOperationType] = useState<string>("");

  // Fetch available patients
  useEffect(() => {
    fetchAvailablePatients();
  }, []);

  const fetchAvailablePatients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/scheduler/available-patients`);

      if (!response.ok) {
        throw new Error("שגיאה בטעינת מטופלים");
      }

      const data = await response.json();
      setPatients(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

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

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Otherwise, sort by this field in ascending order
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Get unique health care providers from the results
  const uniqueHCProviders = React.useMemo(() => {
    const providers = Array.from(new Set(patients.map((p) => p.HCProvider)));
    return providers;
  }, [patients]);

  // Get unique operation types from the results
  const uniqueOperationTypes = React.useMemo(() => {
    const operationTypes = Array.from(
      new Set(patients.map((p) => p.operationType).filter(Boolean))
    );
    return operationTypes;
  }, [patients]);

  // Filter and sort patients
  const filteredAndSortedPatients = React.useMemo(() => {
    let filtered = [...patients];

    // Apply HCProvider filter
    if (filterHCProvider) {
      filtered = filtered.filter((p) => p.HCProvider === filterHCProvider);
    }

    // Apply operationType filter
    if (filterOperationType) {
      filtered = filtered.filter(
        (p) => p.operationType === filterOperationType
      );
    }

    // Sort patients
    filtered.sort((a, b) => {
      const aValue =
        sortBy === "visitDate"
          ? new Date(a.visitDate).getTime()
          : sortBy === "lastName"
          ? a.lastName
          : sortBy === "firstName"
          ? a.firstName
          : sortBy === "HCProvider"
          ? getHCProviderName(a.HCProvider)
          : a[sortBy as keyof Patient] || "";

      const bValue =
        sortBy === "visitDate"
          ? new Date(b.visitDate).getTime()
          : sortBy === "lastName"
          ? b.lastName
          : sortBy === "firstName"
          ? b.firstName
          : sortBy === "HCProvider"
          ? getHCProviderName(b.HCProvider)
          : b[sortBy as keyof Patient] || "";

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [patients, sortBy, sortOrder, filterHCProvider, filterOperationType]);

  // Handle scheduling a patient
  const handleSchedulePatient = (patientId: string) => {
    router.push(`/batch-scheduling/${patientId}`);
  };

  // Optional: Handle patient information refresh
  const handleRefresh = () => {
    fetchAvailablePatients();
  };

  return (
    <div className="p-4 max-w-6xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">שיבוץ מרובה</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <p>{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mr-2"
          disabled={loading}
        >
          {loading ? "מרענן..." : "רענן רשימה"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-4 text-right">סינון מטופלים</h2>

        <div className="flex flex-wrap gap-4 justify-end">
          {/* Health Care Provider Filter */}
          <div className="w-full md:w-auto">
            <label htmlFor="hcProviderFilter" className="block mb-2 text-right">
              קופת חולים:
            </label>
            <select
              id="hcProviderFilter"
              value={filterHCProvider}
              onChange={(e) => setFilterHCProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">הכל</option>
              {uniqueHCProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {getHCProviderName(provider)}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type Filter */}
          <div className="w-full md:w-auto">
            <label htmlFor="opTypeFilter" className="block mb-2 text-right">
              סוג פעולה:
            </label>
            <select
              id="opTypeFilter"
              value={filterOperationType}
              onChange={(e) => setFilterOperationType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">הכל</option>
              {uniqueOperationTypes.map(
                (opType) =>
                  opType && (
                    <option key={opType} value={opType}>
                      {getOperationTypeName(opType)}
                    </option>
                  )
              )}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">טוען מטופלים...</p>
        </div>
      ) : (
        <>
          {patients.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">לא נמצאו מטופלים זמינים לשיבוץ</p>
              <p className="text-gray-500 mt-2">
                כל המטופלים כבר שובצו לפעולות או שאין מטופלים הממתינים לשיבוץ
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("patientId")}
                      >
                        ת.ז
                        {sortBy === "patientId" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("lastName")}
                      >
                        שם משפחה
                        {sortBy === "lastName" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("firstName")}
                      >
                        שם פרטי
                        {sortBy === "firstName" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("HCProvider")}
                      >
                        קופת חולים
                        {sortBy === "HCProvider" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("operationType")}
                      >
                        פעולה נדרשת
                        {sortBy === "operationType" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort("visitDate")}
                      >
                        תאריך ביקור במרפאה
                        {sortBy === "visitDate" &&
                          (sortOrder === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th className="px-4 py-2 border-b text-right">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b">
                          {patient.patientId}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {patient.lastName}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {patient.firstName}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {getHCProviderName(patient.HCProvider)}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {getOperationTypeName(patient.operationType)}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {new Date(patient.visitDate).toLocaleDateString(
                            "he-IL"
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <button
                            onClick={() => handleSchedulePatient(patient._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            שבץ לפעולה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Link
          href="/"
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          חזרה לעמוד הראשי
        </Link>
      </div>
    </div>
  );
};

export default BatchSchedulingPage;

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  HCProvider: string; // Health Care Provider
  phone: string;
  operationType?: string;
  visitDate: string;
  isSetForOp: boolean;
}

const PatientSearch = () => {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default to newest first
  const [filterHCProvider, setFilterHCProvider] = useState<string>("");
  const [filterOperationType, setFilterOperationType] = useState<string>("");

  // Handle combined search - updated function
  const handleCombinedSearch = async () => {
    const searchParams = new URLSearchParams();

    // Add non-empty parameters to the search parameters
    if (patientId)
      searchParams.append("patientId", normalizePatientId(patientId));
    if (firstName.trim()) searchParams.append("firstName", firstName.trim());
    if (lastName.trim()) searchParams.append("lastName", lastName.trim());
    if (phoneNumber.trim()) searchParams.append("phone", phoneNumber.trim());

    if (searchParams.toString() === "") {
      setError("יש להזין לפחות ערך אחד לחיפוש");
      return;
    }

    setLoading(true);
    setError("");
    setActiveSearch(true);

    try {
      // Use the search endpoint with query parameters
      const response = await fetch(
        `${API_URL}/patients/search?${searchParams.toString()}`
      );

      // Check if response is ok before processing
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`שגיאה בחיפוש מטופלים: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} patient results`);

      // Always update the patients array first
      setPatients(data);

      // Then handle redirect if needed
      if (data.length === 1) {
        console.log(
          "One patient found, redirecting to:",
          `/patients/${data[0]._id}`
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(
        error instanceof Error ? error.message : "שגיאה לא ידועה בחיפוש"
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

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

    // Sort by visit date
    filtered.sort((a, b) => {
      const dateA = new Date(a.visitDate).getTime();
      const dateB = new Date(b.visitDate).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [patients, sortOrder, filterHCProvider, filterOperationType]);

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

  return (
    <div className="p-4 max-w-4xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">חיפוש מטופלים</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Patient ID search */}
          <div className="flex flex-col">
            <label htmlFor="patientId" className="mb-1 text-right">
              תעודת זהות:
            </label>
            <input
              id="patientId"
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCombinedSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-right"
              placeholder="הזן תעודת זהות"
              disabled={loading}
            />
          </div>

          {/* First Name search */}
          <div className="flex flex-col">
            <label htmlFor="firstName" className="mb-1 text-right">
              שם פרטי:
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCombinedSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-right"
              placeholder="הזן שם פרטי"
              disabled={loading}
            />
          </div>

          {/* Last Name search */}
          <div className="flex flex-col">
            <label htmlFor="lastName" className="mb-1 text-right">
              שם משפחה:
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCombinedSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-right"
              placeholder="הזן שם משפחה"
              disabled={loading}
            />
          </div>

          {/* Phone Number search */}
          <div className="flex flex-col">
            <label htmlFor="phoneNumber" className="mb-1 text-right">
              מספר טלפון:
            </label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCombinedSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-right"
              placeholder="הזן מספר טלפון"
              disabled={loading}
            />
          </div>
        </div>

        {/* Combined search and Home buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleCombinedSearch}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            disabled={
              loading ||
              (!patientId.trim() &&
                !firstName.trim() &&
                !lastName.trim() &&
                !phoneNumber.trim())
            }
          >
            {loading ? "מחפש..." : "חיפוש משולב"}
          </button>

          <Link
            href="/"
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            חזור למסך הראשי
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <p>{error}</p>
        </div>
      )}

      {patients.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap justify-end gap-4 mb-4">
            {/* Health Care Provider Filter */}
            <div className="flex items-center">
              <label htmlFor="hcProviderFilter" className="ml-2">
                קופת חולים:
              </label>
              <select
                id="hcProviderFilter"
                value={filterHCProvider}
                onChange={(e) => setFilterHCProvider(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
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
            <div className="flex items-center">
              <label htmlFor="opTypeFilter" className="ml-2">
                סוג פעולה:
              </label>
              <select
                id="opTypeFilter"
                value={filterOperationType}
                onChange={(e) => setFilterOperationType(e.target.value)}
                className="border border-gray-300 rounded-md p-2"
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

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b text-right">תעודת זהות</th>
                  <th className="px-4 py-2 border-b text-right">שם משפחה</th>
                  <th className="px-4 py-2 border-b text-right">שם פרטי</th>
                  <th className="px-4 py-2 border-b text-right">קופת חולים</th>
                  <th className="px-4 py-2 border-b text-right">פעולה נדרשת</th>
                  <th
                    className="px-4 py-2 border-b text-right cursor-pointer hover:bg-gray-200"
                    onClick={toggleSortOrder}
                  >
                    תאריך ביקור אחרון במרפאה
                    {sortOrder === "desc" ? " ▼" : " ▲"}
                  </th>
                  <th className="px-4 py-2 border-b text-right">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{patient.patientId}</td>
                    <td className="px-4 py-2 border-b">{patient.lastName}</td>
                    <td className="px-4 py-2 border-b">{patient.firstName}</td>
                    <td className="px-4 py-2 border-b">
                      {getHCProviderName(patient.HCProvider)}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {getOperationTypeName(patient.operationType)}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {new Date(patient.visitDate).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <Link
                        href={`/patients/${patient._id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        הצג מטופל
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {patients.length === 0 && activeSearch && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">לא נמצאו מטופלים התואמים את החיפוש</p>
        </div>
      )}
    </div>
  );
};

function normalizePatientId(id: string): string {
  // Remove all whitespace, dashes or any other non-digit characters
  return id.replace(/[^\d]/g, "");
}

export default PatientSearch;

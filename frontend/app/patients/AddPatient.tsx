"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import DatePicker from "../utils/DatePicer";
import IsraeliIDValidator from "../utils/IsraeliIDValidator";
import PhoneNumberValidator from "../utils/PhoneNumberValidator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const AddPatient = () => {
  // State for form fields
  const [healthFund, setHealthFund] = useState<string>("maccabi");
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [patientId, setPatientId] = useState<string>("");
  const [isPatientIdValid, setIsPatientIdValid] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
  const [additionalPhone, setAdditionalPhone] = useState<string>("");
  const [operationType, setOperationType] = useState<string>("colono");
  const [preparationType, setPreparationType] = useState<string>("piko");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  // const [isVisitSet, setIsVisitSet] = useState<string>("notSet");

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Determine if prep field should be disabled
  const isNoPrepRequired =
    operationType === "sigmo" || operationType === "gastro";

  // Update prep type when operation type changes
  React.useEffect(() => {
    if (isNoPrepRequired) {
      setPreparationType("noPrep");
    } else if (preparationType === "noPrep") {
      setPreparationType("piko");
    }
  }, [operationType, isNoPrepRequired, preparationType]);

  // Handle date change from DatePicker
  const handleDateChange = (date: Date) => {
    setVisitDate(date);
  };

  // Handle submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset status messages
    setError("");
    setSuccess("");

    // Check if required fields are valid
    if (!isPatientIdValid || !isPhoneValid || !firstName || !lastName) {
      setError("אנא מלא את כל השדות הנדרשים בצורה תקינה");
      return;
    }

    // Format phone numbers to have only digits
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanAdditionalPhone = additionalPhone
      ? additionalPhone.replace(/\D/g, "")
      : "";

    // Prepare patient data
    const patientData = {
      patientId: patientId,
      firstName: firstName,
      lastName: lastName,
      HCProvider: healthFund,
      phone: cleanPhone,
      additionalPhone: cleanAdditionalPhone,
      visitDate: visitDate.toISOString(),
      operationType: operationType,
      preparationType: preparationType,
      additionalInfo: additionalInfo,
    };

    setIsLoading(true);

    try {
      // Send data to backend API
      const response = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "שגיאה בשמירת פרטי המטופל");
      }

      // Show success message
      setSuccess("פרטי המטופל נשמרו בהצלחה");

      // Clear form fields
      setHealthFund("maccabi");
      setVisitDate(new Date());
      setPatientId("");
      setIsPatientIdValid(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setIsPhoneValid(false);
      setAdditionalPhone("");
      setOperationType("colono");
      setPreparationType("piko");
      setAdditionalInfo("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("שגיאה לא ידועה בשמירת פרטי המטופל");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">הוספת מטופל חדש</h1>

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
          {/* Health Fund */}
          <div className="text-right">
            <label className="block mb-2">
              קופת חולים:
              <select
                value={healthFund}
                onChange={(e) => setHealthFund(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
                disabled={isLoading}
              >
                <option value="maccabi">מכבי</option>
                <option value="clalit">כללית</option>
                <option value="meuhedet">מאוחדת</option>
                <option value="leumit">לאומית</option>
              </select>
            </label>
          </div>
        </div>

        {/* Last Visit Date */}
        <div className="text-right">
          <label className="block mb-2">
            תאריך ביקור במרפאה:
            <DatePicker
              selectedDate={visitDate}
              onChange={handleDateChange}
            />{" "}
          </label>
        </div>

        {/* ID Validator */}
        <div className="md:col-span-2">
          <IsraeliIDValidator
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onValidityChange={setIsPatientIdValid}
          />
        </div>

        {/* First Name */}
        <div className="text-right">
          <label htmlFor="firstName" className="block mb-2">
            שם פרטי
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-right w-full"
            placeholder="הזן שם פרטי"
            required
            disabled={isLoading}
          />
        </div>

        {/* Last Name */}
        <div className="text-right">
          <label htmlFor="lastName" className="block mb-2">
            שם משפחה
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-right w-full"
            placeholder="הזן שם משפחה"
            required
            disabled={isLoading}
          />
        </div>

        {/* Phone Number */}
        <div className="text-right">
          <PhoneNumberValidator
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onValidityChange={setIsPhoneValid}
          />
        </div>

        {/* Additional Phone */}
        <div className="text-right">
          <label htmlFor="additionalPhone" className="block mb-2">
            טלפון או פרטים נוספים
          </label>
          <input
            type="text"
            id="additionalPhone"
            value={additionalPhone}
            onChange={(e) => setAdditionalPhone(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-right w-full"
            placeholder="הזן מספר טלפון נוסף"
            disabled={isLoading}
          />
        </div>

        {/* Operation Type */}
        <div className="text-right">
          <label className="block mb-2">
            סוג פעולה:
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              disabled={isLoading}
            >
              <option value="colono">קולונו</option>
              <option value="sigmo">סיגמו</option>
              <option value="gastro">גסטרו</option>
              <option value="double">כפולה</option>
            </select>
          </label>
        </div>

        {/* Preparation Type */}
        <div className="text-right">
          <label className="block mb-2">
            הכנה:
            <select
              value={preparationType}
              onChange={(e) => setPreparationType(e.target.value)}
              disabled={isNoPrepRequired || isLoading}
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
            >
              {!isNoPrepRequired && (
                <>
                  <option value="piko">פיקולוקס</option>
                  <option value="meroken">מרוקן</option>
                </>
              )}
              <option value="noPrep">ללא הכנה</option>
            </select>
          </label>
        </div>

        {/* Additional Info */}
        <div className="text-right md:col-span-2">
          <label htmlFor="additionalInfo" className="block mb-2">
            הערות
          </label>
          <textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-right w-full"
            placeholder="הזן הערות נוספות"
            rows={3}
            disabled={isLoading}
          />
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
            {isLoading ? "שומר פרטים..." : "שמור פרטי מטופל"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;

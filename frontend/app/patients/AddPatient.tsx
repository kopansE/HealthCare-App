"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import DatePicker from "../utils/DatePicer";
import IsraeliIDValidator from "../utils/IsraeliIDValidator";
import PhoneNumberValidator from "../utils/PhoneNumberValidator";

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
  const [isVisitSet, setIsVisitSet] = useState<string>("notSet");

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
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Check if required fields are valid
    if (!isPatientIdValid || !isPhoneValid || !firstName || !lastName) {
      alert("אנא מלא את כל השדות הנדרשים בצורה תקינה");
      return;
    }

    // Create summary
    const summary = `
      קופת חולים: ${healthFund}
      תאריך ביקור: ${visitDate.toLocaleDateString("he-IL")}
      ת.ז.: ${patientId}
      שם פרטי: ${firstName}
      שם משפחה: ${lastName}
      טלפון: ${phone}
      טלפון נוסף: ${additionalPhone || "לא הוזן"}
      סוג פעולה: ${operationType}
      הכנה: ${preparationType}
      הערות: ${additionalInfo || "אין"}
      האם נקבע תאריך לפעולה: ${isVisitSet}
    `;

    // Show summary
    alert(summary);

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
    setIsVisitSet("notSet");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">הוספת מטופל חדש</h1>

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
              >
                <option value="maccabi">מכבי</option>
                <option value="clalit">כללית</option>
                <option value="meuhedet">מאוחדת</option>
                <option value="leumit">לאומית</option>
              </select>
            </label>
          </div>

          {/* Last Visit Date */}
          <div className="text-right">
            <label className="block mb-2">
              תאריך ביקור במרפאה:
              <DatePicker />
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
                disabled={isNoPrepRequired}
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
            />
          </div>

          {/* Is Visit Set */}
          <div className="text-right">
            <label className="block mb-2">
              האם נקבע תאריך לפעולה?
              <select
                value={isVisitSet}
                onChange={(e) => setIsVisitSet(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
              >
                <option value="notSet">לא נקבע</option>
                <option value="set">נקבע</option>
                <option value="notInterested">לא מעוניין</option>
              </select>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            שמור פרטי מטופל
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;

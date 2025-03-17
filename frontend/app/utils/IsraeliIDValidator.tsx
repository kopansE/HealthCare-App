import React, { useState } from "react";

const IsraeliIDValidator = () => {
  // State for ID input and validation
  const [patientID, setPatientID] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Function to validate Israeli ID (Teudat Zehut)
  const validateIsraeliID = (id) => {
    // Remove any non-digit characters
    const cleanID = id.replace(/\D/g, "");

    // Israeli ID must be 9 digits
    if (cleanID.length !== 9) {
      return false;
    }

    // Israeli ID validation algorithm
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      // Get current digit
      let digit = parseInt(cleanID[i]);

      // Apply weight (1 for even positions, 2 for odd positions)
      let weight = (i % 2) + 1;
      let weighted = digit * weight;

      // If the weighted value is > 9, subtract 9
      if (weighted > 9) {
        weighted -= 9;
      }

      // Add to sum
      sum += weighted;
    }

    // The ID is valid if the sum is divisible by 10
    return sum % 10 === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow digits and restrict to 9 characters
    if (/^\d*$/.test(value) && value.length <= 9) {
      setPatientID(value);
      // Reset validation state when input changes
      if (isValidated) {
        setIsValidated(false);
      }
    }
  };

  // Handle blur event (when focus leaves the input)
  const handleBlur = () => {
    // Only validate if there's input
    if (patientID.length > 0) {
      const result = validateIsraeliID(patientID);
      setIsValid(result);
      setIsValidated(true);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <label htmlFor="patientID">תעודת זהות מטופל</label>
        <div className="flex items-center">
          <input
            type="text"
            id="patientID"
            value={patientID}
            onChange={handleChange}
            onBlur={handleBlur}
            className={` px-3 py-2 border ${
              isValidated && !isValid ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 ${
              isValidated && !isValid
                ? "focus:ring-red-500"
                : "focus:ring-blue-500"
            }`}
            placeholder="הכנס תעודת זהות"
          />

          {/* Validation indicators */}
          {isValidated && (
            <div className="absolute left">
              {isValid ? (
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Error message - shown only when validated and invalid */}
        {isValidated && !isValid && (
          <p className="text-sm text-red-600 mt-1">תעודת זהות אינה תקינה</p>
        )}
      </div>
    </div>
  );
};

export default IsraeliIDValidator;

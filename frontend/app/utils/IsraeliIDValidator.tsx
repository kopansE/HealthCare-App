import React, { useState, ChangeEvent, useEffect } from "react";

interface IsraeliIDValidatorProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValidityChange?: (isValid: boolean) => void;
}

const IsraeliIDValidator: React.FC<IsraeliIDValidatorProps> = ({
  value = "",
  onChange,
  onValidityChange,
}) => {
  // State to track ID input and validation status
  const [idNumber, setIdNumber] = useState<string>(value);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

  // Update internal state when external value changes
  useEffect(() => {
    setIdNumber(value);
  }, [value]);

  // Function to validate Israeli ID number (Teudat Zehut)
  const validateIsraeliID = (id: string): boolean => {
    // ID must be 9 digits
    if (!/^\d{9}$/.test(id)) return false;

    // Calculate checksum (using the algorithm for Israeli IDs)
    const digits = id.split("").map((digit) => parseInt(digit, 10));
    let sum = 0;

    // Loop through first 8 digits
    for (let i = 0; i < 8; i++) {
      // Multiply digit by 1 or 2 based on position
      let digit = digits[i];
      const factor = (i % 2) + 1;
      digit *= factor;

      // If multiplication resulted in a two-digit number, add digits
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }

      sum += digit;
    }

    // Check if last digit makes the sum a multiple of 10
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === digits[8];
  };

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 9 characters
    const newValue = e.target.value.replace(/\D/g, "").slice(0, 9);

    // Update internal state
    setIdNumber(newValue);

    // Reset validation status when input changes
    if (isValidated) {
      setIsValidated(false);
    }

    // Call external onChange handler if provided
    if (onChange) {
      // Create a synthetic event with the sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue,
        },
      } as ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    }
  };

  // Handle blur event (when focus leaves the input)
  const handleBlur = () => {
    // Only validate if there's input
    if (idNumber.length > 0) {
      const validationResult = validateIsraeliID(idNumber);
      setIsValid(validationResult);
      setIsValidated(true);

      // Notify parent component about validation result
      if (onValidityChange) {
        onValidityChange(validationResult);
      }
    }
  };

  return (
    <div className="text-right">
      <label htmlFor="patientID" className="block mb-2">
        תעודת זהות מטופל
      </label>
      <div className="relative">
        <input
          type="text"
          id="patientID"
          value={idNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`px-3 py-2 border ${
            isValidated && !isValid ? "border-red-500" : "border-gray-300"
          } rounded-md text-right w-full focus:outline-none focus:ring-2 ${
            isValidated && !isValid
              ? "focus:ring-red-500"
              : "focus:ring-blue-500"
          }`}
          placeholder="הכנס תעודת זהות"
        />

        {/* Validation indicators */}
        {isValidated && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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
        <p className="text-sm text-red-600 mt-1">
          תעודת זהות אינה תקינה. נא להזין 9 ספרות תקינות.
        </p>
      )}
    </div>
  );
};

export default IsraeliIDValidator;

// import React, { useState } from "react";

// const IsraeliIDValidator = () => {
//   // State for ID input and validation
//   const [patientID, setPatientID] = useState("");
//   const [isValidated, setIsValidated] = useState(false);
//   const [isValid, setIsValid] = useState(false);

//   // Function to validate Israeli ID (Teudat Zehut)
//   const validateIsraeliID = (id: string): boolean => {
//     // Remove any non-digit characters
//     const cleanID: string = id.replace(/\D/g, "");

//     // Israeli ID must be 9 digits
//     if (cleanID.length !== 9) {
//       return false;
//     }

//     // Israeli ID validation algorithm
//     let sum: number = 0;

//     for (let i = 0; i < 9; i++) {
//       // Get current digit
//       let digit: number = parseInt(cleanID[i]);

//       // Apply weight (1 for even positions, 2 for odd positions)
//       let weight: number = (i % 2) + 1;
//       let weighted: number = digit * weight;

//       // If the weighted value is > 9, subtract 9
//       if (weighted > 9) {
//         weighted -= 9;
//       }

//       // Add to sum
//       sum += weighted;
//     }

//     // The ID is valid if the sum is divisible by 10
//     return sum % 10 === 0;
//   };

//   // Handle input change
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
//     const value: string = e.target.value;
//     // Only allow digits and restrict to 9 characters
//     if (/^\d*$/.test(value) && value.length <= 9) {
//       setPatientID(value);
//       // Reset validation state when input changes
//       if (isValidated) {
//         setIsValidated(false);
//       }
//     }
//   };

//   // Handle blur event (when focus leaves the input)
//   const handleBlur = () => {
//     // Only validate if there's input
//     if (patientID.length > 0) {
//       const result = validateIsraeliID(patientID);
//       setIsValid(result);
//       setIsValidated(true);
//     }
//   };

//   return (
//     <div className="w-full max-w-md">
//       <div className="relative">
//         <label htmlFor="patientID">תעודת זהות מטופל</label>
//         <div className="flex items-center">
//           <input
//             type="text"
//             id="patientID"
//             value={patientID}
//             onChange={handleChange}
//             onBlur={handleBlur}
//             className={` px-3 py-2 border ${
//               isValidated && !isValid ? "border-red-500" : "border-gray-300"
//             } rounded-md focus:outline-none focus:ring-2 ${
//               isValidated && !isValid
//                 ? "focus:ring-red-500"
//                 : "focus:ring-blue-500"
//             }`}
//             placeholder="הכנס תעודת זהות"
//           />

//           {/* Validation indicators */}
//           {isValidated && (
//             <div className="absolute left">
//               {isValid ? (
//                 <svg
//                   className="h-5 w-5 text-green-500"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M5 13l4 4L19 7"
//                   />
//                 </svg>
//               ) : (
//                 <svg
//                   className="h-5 w-5 text-red-500"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Error message - shown only when validated and invalid */}
//         {isValidated && !isValid && (
//           <p className="text-sm text-red-600 mt-1">תעודת זהות אינה תקינה</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default IsraeliIDValidator;

import React, { useState, ChangeEvent } from "react";

interface PhoneNumberFieldProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onValidityChange?: (isValid: boolean) => void;
}

const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  value,
  onChange,
  onValidityChange,
}) => {
  // State to track validation status
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

  // Function to validate Israeli phone numbers
  const validateIsraeliPhone = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, "");

    // Israeli mobile numbers start with 05 and are 10 digits long
    const isrPhoneRegex = /^05\d{8}$/;

    return isrPhoneRegex.test(cleanPhone);
  };

  // Handle blur event (when focus leaves the input)
  const handleBlur = () => {
    // Only validate if there's input
    if (value.length > 0) {
      const validationResult = validateIsraeliPhone(value);
      setIsValid(validationResult);
      setIsValidated(true);

      // Notify parent component about validation result if needed
      if (onValidityChange) {
        onValidityChange(validationResult);
      }
    }
  };

  return (
    <div>
      <label htmlFor="phone">מספר טלפון</label>
      <div className="relative">
        <input
          type="tel"
          id="phone"
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          className={`px-3 py-2 border ${
            isValidated && !isValid ? "border-red-500" : "border-gray-300"
          } rounded-md text-right focus:outline-none focus:ring-2 ${
            isValidated && !isValid
              ? "focus:ring-red-500"
              : "focus:ring-blue-500"
          }`}
          placeholder="הזן מספר טלפון (05X-XXX-XXXX)"
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
          מספר טלפון לא תקין. יש להזין מספר סלולרי ישראלי המתחיל ב-05 ובאורך 10
          ספרות
        </p>
      )}
    </div>
  );
};

export default PhoneNumberField;

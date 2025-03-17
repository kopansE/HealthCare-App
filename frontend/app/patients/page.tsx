"use client";

import React, { useState, ChangeEvent } from "react";
import Datepicker from "../utils/DatePicer";
import IsraeliIDValidator from "../utils/IsraeliIDValidator";
import PhoneNumberValidator from "../utils/PhoneNumberValidator";
const addPatient = () => {
  return (
    <>
      <h1>Add patient Page</h1>
      <PickHealthFund />
      <LastVisitInClinic />
      <IsraeliIDValidator />
      <FirstNameField value="" onChange={() => {}} />
      <LastNameField value="" onChange={() => {}} />
      <PhoneNumberField />
      <AdditionalPhoneNumberField />
      <br />
      <OperationTypeNPreparation />
      <AdditionalInfo />
      <IsVisitSet />
    </>
  );
};

function PickHealthFund() {
  return (
    <label>
      קופת חולים:{" "}
      <select>
        <option value="maccabi">מכבי</option>
        <option value="clalit">כללית</option>
      </select>
    </label>
  );
}

const LastVisitInClinic = () => {
  return (
    <>
      <label>
        תאריך ביקור אחרון במרפאה:
        <Datepicker />
      </label>
    </>
  );
};

interface FirstNameFieldProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FirstNameField: React.FC<FirstNameFieldProps> = () => {
  return (
    <div>
      <label htmlFor="firstName">שם פרטי</label>
      <input
        type="text"
        id="firstName"
        className="px-3 py-2 border border-gray-300 rounded-md text-right"
        placeholder="הזן שם פרטי"
      />
    </div>
  );
};

interface LastNameFieldProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const LastNameField: React.FC<LastNameFieldProps> = () => {
  return (
    <div>
      <label htmlFor="lastName">שם משפחה</label>
      <input
        type="text"
        id="lastName"
        className=" px-3 py-2 border border-gray-300 rounded-md text-right"
        placeholder="הזן שם משפחה"
      />
    </div>
  );
};

const PhoneNumberField: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  return (
    <form id="phoneNumber" className="space-y-4">
      <PhoneNumberValidator
        value={phoneNumber}
        onChange={handlePhoneChange}
        onValidityChange={setIsPhoneValid}
      />
    </form>
  );
};

const AdditionalPhoneNumberField: React.FC = () => {
  return (
    <div>
      <label htmlFor="additionalPhone">טלפון או פרטים נוספים</label>
      <input
        type="text"
        id="additionalPhone"
        className=" px-3 py-2 border border-gray-300 rounded-md text-right"
        placeholder="הזן מספר טלפון נוסף"
      />
    </div>
  );
};

// const OperationType = () => {
//   return (
//     <label>
//       סוג פעולה:{" "}
//       <select>
//         <option value="colono">קולונו</option>
//         <option value="sigmo">סיגמו</option>
//         <option value="gastro">גסטרו</option>
//         <option value="double">כפולה</option>
//       </select>
//     </label>
//   );
// };

// const Preparation = () => {
//   return (
//     <label>
//       הכנה:{" "}
//       <select>
//         <option value="piko">פיקולוקס</option>
//         <option value="meroken">מרוקן</option>
//         <option value="noPrep">ללא הכנה</option>
//       </select>
//     </label>
//   );
// };

const OperationTypeNPreparation = () => {
  const [operationType, setOperationType] = useState("colono");

  // Determine if we should force "noPrep" based on operation type
  const isNoPrepRequired =
    operationType === "sigmo" || operationType === "gastro";

  return (
    <div>
      <div>
        <label>
          סוג פעולה:{" "}
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
          >
            <option value="colono">קולונו</option>
            <option value="sigmo">סיגמו</option>
            <option value="gastro">גסטרו</option>
            <option value="double">כפולה</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          הכנה:{" "}
          <select
            value={isNoPrepRequired ? "noPrep" : undefined}
            disabled={isNoPrepRequired}
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
    </div>
  );
};

const AdditionalInfo: React.FC = () => {
  return (
    <div>
      <label htmlFor="additionalInfo">הערות</label>
      <input
        type="text"
        id="additionalInfo"
        className=" px-3 py-2 border border-gray-300 rounded-md text-right"
        placeholder="הזן הערות נוספות"
      />
    </div>
  );
};

const IsVisitSet = () => {
  return (
    <label>
      האם נקבע תאריך לפעולה?{" "}
      <select>
        <option value="notSet">לא נקבע</option>
        <option value="Set">נקבע</option>
        <option value="notInterested">לא מעוניין</option>
      </select>
    </label>
  );
};

export default addPatient;

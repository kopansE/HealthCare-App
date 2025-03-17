"use client";

import React, { useState, ChangeEvent } from "react";
import DatePicker from "../utils/DatePicer";
import IsraeliIDValidator from "../utils/IsraeliIDValidator";

const page = () => {
  return (
    <>
      <h1>ימי פעולות</h1>
      <OperationDate />
      <OperationPlace />
      <StartHour />
      <EndHour />
      <IsraeliIDValidator />
    </>
  );
};

const OperationDate = () => {
  return (
    <>
      <label>
        תאריך ביצוע פעולה:
        <DatePicker />
      </label>
    </>
  );
};

function OperationPlace() {
  return (
    <label>
      מיקום:{" "}
      <select>
        <option value="asotaCalaniotAshdod">אסותא כלניות אשדוד</option>
        <option value="asotaHolon">אסותא חולון</option>
        <option value="asotaRamatHahayal">אסותא רמת החייל</option>
        <option value="bestMedicalBatYam">בסט מדיקל בת ים</option>
      </select>
    </label>
  );
}

interface TimeInputProps {
  onChange?: (time: string) => void;
  defaultValue?: string;
}

const StartHour: React.FC<TimeInputProps> = ({
  onChange,
  defaultValue = "09:00",
}) => {
  const [hour, setHour] = useState<string>(defaultValue);

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHour(value);
    if (onChange) onChange(value);
  };

  return (
    <div>
      <label htmlFor="startHour">שעת התחלה: </label>
      <input
        id="startHour"
        type="time"
        value={hour}
        onChange={handleTimeChange}
      />
    </div>
  );
};

const EndHour: React.FC<TimeInputProps> = ({
  onChange,
  defaultValue = "17:00",
}) => {
  const [hour, setHour] = useState<string>(defaultValue);

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHour(value);
    if (onChange) onChange(value);
  };

  return (
    <div>
      <label htmlFor="endHour">שעת סיום: </label>
      <input
        id="endHour"
        type="time"
        value={hour}
        onChange={handleTimeChange}
      />
    </div>
  );
};

export default page;

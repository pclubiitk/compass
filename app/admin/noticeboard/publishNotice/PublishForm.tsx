"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Ban } from "lucide-react";
import { DatePicker } from "@/app/components/user/noticeboard/DatePicker";

interface formDataType {
  type: string;
  title: string;
  recipient: string;
  publisher: string;
  location: string;
  date: Date | undefined;
  description: string;
}

export default function NoticeboardForm() {
  const router = useRouter();
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState<formDataType>({
    type: "Suggestion",
    title: "",
    recipient: "",
    publisher: "",
    location: "",
    date: date,
    description: "",
  });

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    setFormData({ ...formData, date: newDate });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (value: string) => {
    setFormData({ ...formData, type: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted notice:", formData);
    router.push("/admin/noticeboard");
  };

  return (
      <div className={`w-full p-8 rounded-2xl shadow-md ring-1`}>
        <h1 className={`text-3xl font-bold mb-6 text-center`}>
          Publish a {formData.type}
        </h1>

        <div className="flex flex-wrap gap-4 justify-center sm:justify-between">
          {[
            {
              label: "Suggestion",
              icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            },
            {
              label: "Warning",
              icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
            },
            { label: "Ban", icon: <Ban className="w-5 h-5 text-red-600" /> },
          ].map((option) => (
            <label
              key={option.label}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="radio"
                name="type"
                value={option.label}
                checked={formData.type === option.label}
                onChange={() => handleRadioChange(option.label)}
                className="accent-inherit"
              />
              {option.icon}
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        <br></br>

        <form onSubmit={handleSubmit} className="space-y-5">
          {["title", "recipient", "publisher", "location"].map((field) => (
            <div key={field} className="transform transition-all duration-200">
              <label className="block text-sm font-medium capitalize">
                {field}
              </label>
              <input
                name={field}
                type="text"
                value={(formData as any)[field]}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:shadow-lg focus:border-blue-400 focus:outline-none transform focus:-translate-y-0.5"
                required
              />
            </div>
          ))}

          <div className="transform transition-all duration-200">
            <label className="block text-sm font-medium capitalize">Time</label>
            <DatePicker
              open={datePickerOpen}
              setOpen={setDatePickerOpen}
              date={date}
              setDate={handleDateChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium  capitalize">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:shadow-lg focus:border-blue-400 focus:outline-none transform focus:-translate-y-0.5"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Publish Notice
          </button>
        </form>
      </div>
  );
}

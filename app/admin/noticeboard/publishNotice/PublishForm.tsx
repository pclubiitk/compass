'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';

export default function NoticeboardForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: 'Suggestion',
    title: '',
    recipient: '',
    publisher: '',
    location: '',
    time: '',
    description: '',
  });

  const typeStyles = {
    Suggestion: {
      bg: 'bg-green-50',
      header: 'text-green-700',
      ring: 'ring-green-500',
    },
    Warning: {
      bg: 'bg-yellow-50',
      header: 'text-yellow-700',
      ring: 'ring-yellow-500',
    },
    Ban: {
      bg: 'bg-red-50',
      header: 'text-red-700',
      ring: 'ring-red-500',
    },
  };

  const currentStyle = typeStyles[formData.type as keyof typeof typeStyles];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (value: string) => {
    setFormData({ ...formData, type: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted notice:', formData);
    router.push('/admin/noticeboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className={`max-w-2xl w-full ${currentStyle.bg} p-8 rounded-2xl shadow-md ring-1 ${currentStyle.ring}`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${currentStyle.header}`}>
          Publish a {formData.type}
        </h1>

        <div className="flex flex-wrap gap-4 justify-center sm:justify-between">
          {[
            { label: 'Suggestion', icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
            { label: 'Warning', icon: <AlertTriangle className="w-5 h-5 text-yellow-600" /> },
            { label: 'Ban', icon: <Ban className="w-5 h-5 text-red-600" /> },
          ].map((option) => (
            <label key={option.label} className="flex items-center space-x-2 cursor-pointer">
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
          {['title', 'recipient', 'publisher', 'location'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 capitalize">{field}</label>
              <input
                name={field}
                type="text"
                value={(formData as any)[field]}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              name="time"
              type="datetime-local"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
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
    </div>
  );
}

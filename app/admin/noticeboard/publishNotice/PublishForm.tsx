'use client';
import MDEditor from '@uiw/react-md-editor';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';

export default function NoticeboardForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [formData, setFormData] = useState({
    type: 'Event', // You might want a select input for this
    title: '',
    location: '',
    time: '',
    description: '**hello world!**\n\nstart writing your notice here.', // Initial markdown content
  });

  // 2. Handler for standard input fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 3. Specific handler for the MDEditor, as its onChange provides the value directly
  const handleEditorChange = (value?: string) => {
    setFormData((prevData) => ({
      ...prevData,
      description: value || '', // Ensure value is not undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    console.log('Submitted notice:', formData);
    // --------------

    try {
      const response = await fetch('http://localhost:8081/api/maps/notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // authorization header if needed
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        // error message from backend response
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      // successful
      console.log('Notice submitted successfully!');
      router.push('/admin/noticeboard');

    } catch (err: any) {
      console.error("Failed to submit notice:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  
    // router.push('/admin/noticeboard');
  };


  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
    <form onSubmit={handleSubmit} className="space-y-6">
      {['title', 'location'].map((field) => (
        <div key={field}>
          <label htmlFor={field} className="block font-semibold text-sm font-medium text-gray-700 capitalize">
            {field}
          </label>
          <input
            id={field}
            name={field}
            type="text"
            value={(formData as any)[field]}
            onChange={handleChange}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            required
          />
        </div>
      ))}

      {/* Date and Time input */}
      <div>
        <label htmlFor="time" className="block text-sm font-semibold font-medium text-gray-700">Time</label>
        <input
          id="time"
          name="time"
          type="datetime-local"
          value={formData.time}
          onChange={handleChange}
          className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
          required
        />
      </div>

      {/* The MDEditor for the description */}
      <div>
        <label className="block text-sm font-medium font-semibold text-gray-700">Description (Markdown Supported)</label>
        <div data-color-mode="light" className="mt-1 border border-gray-300 rounded-lg overflow-hidden">
          <MDEditor
            height={359}
            value={formData.description}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
      >
        Publish Notice
      </button>
    </form>
    </div>
  );
}

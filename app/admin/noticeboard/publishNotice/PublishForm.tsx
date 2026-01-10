"use client";
import MDEditor from "@uiw/react-md-editor";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

interface UploadedImage {
  previewUrl: string;
  file: File;
  id: string | null; // Will be null until upload is complete
  isUploading: boolean;
  copySuccess: boolean;
}

export default function NoticeboardForm() {
  const router = useRouter();
  // FIXME:
  // 28:10  Error: 'isSubmitting' is assigned a value but never used.  @typescript-eslint/no-unused-vars
  // 29:10  Error: 'error' is assigned a value but never used.  @typescript-eslint/no-unused-vars
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null); // To trigger file input click

  const [formData, setFormData] = useState({
    type: "Event", // You might want a select input for this
    title: "",
    location: "",
    eventTime: "",
    eventEndTime: "",
    description: "",
    body: "**hello world!**\n\nstart writing your notice here.", // Initial markdown content
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Specific handler for the MDEditor, as its onChange provides the value directly
  const handleEditorChange = (value?: string) => {
    setFormData((prevData) => ({
      ...prevData,
      body: value || "", // Ensure value is not undefined
    }));
  };

  // -- changes --
  const handleFileSelectAndUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesArray = Array.from(selectedFiles); // convert filelist to array

    const newImages: UploadedImage[] = filesArray.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      file,
      id: null,
      isUploading: true,
      copySuccess: false,
    }));
    setImages((prev) => [...prev, ...newImages]);

    for (const image of newImages) {
      try {
        const imageFormData = new FormData();
        imageFormData.append("file", image.file);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ASSET_URL}/assets`,
          {
            method: "POST",
            body: imageFormData,
            credentials: "include",
          }
        );

        if (!response.ok)
          throw new Error(`image upload failed for ${image.file.name}`);
        const result = await response.json();

        // console.log("SERVER RESPONSE:", result);
        // console.log("ID BEING READ:", result.ImageID);

        setImages((prev) =>
          prev.map((img) =>
            img.file === image.file
              ? { ...img, id: result.ImageID, isUploadingImage: false }
              : img
          )
        );
      } catch {
        // setError(err.message);
        setImages((prev) =>
          prev.filter((img) => img.previewUrl !== image.previewUrl)
        );
        // removed the failed uploads
      }
    }
  };

  // Deletes a specific image from the array by its previewUrl
  const handleImageDelete = (previewUrlToDelete: string) => {
    const imageToDelete = images.find(
      (img) => img.previewUrl === previewUrlToDelete
    );
    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.previewUrl); // Clean up memory
    }
    setImages((prev) =>
      prev.filter((img) => img.previewUrl !== previewUrlToDelete)
    );
  };

  // Copies the ID for a specific image
  const handleCopyId = (previewUrlToCopy: string) => {
    const imageToCopy = images.find(
      (img) => img.previewUrl === previewUrlToCopy
    );
    if (!imageToCopy || !imageToCopy.id) return;

    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_ASSET_URL}/${imageToCopy.id}.webp`
    );
    setImages((prev) =>
      prev.map((img) =>
        img.previewUrl === previewUrlToCopy
          ? { ...img, copySuccess: true }
          : img
      )
    );
    setTimeout(() => {
      setImages((prev) =>
        prev.map((img) =>
          img.previewUrl === previewUrlToCopy
            ? { ...img, copySuccess: false }
            : img
        )
      );
    }, 2000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setIsSubmitting(true);
    // setError(null);
    // console.log("Submitted notice:", formData);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        // error message from backend response
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      // successful
      console.log("Notice submitted successfully!");
      router.push("/admin/noticeboard");
    } catch {
      toast.error("Failed to submit notice");
      // console.error("Failed to submit notice:", err);
      // setError(err.message);
    } finally {
      // setIsSubmitting(false);
    }

    // router.push('/admin/noticeboard');
  };

  // Clean up all object URLs when the component unmounts
  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []); // vs [images]

  return (
    <div className="bg-linear-to-br from-yellow-50 to-orange-50 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {["title", "description"].map((field) => (
          <div key={field}>
            <Label
              htmlFor={field}
              className="block text-sm font-medium text-gray-700 capitalize"
            >
              {field}
            </Label>
            <Input
              id={field}
              name={field}
              placeholder={field}
              type="text"
              // TODO: add correct interface NoticeFormData
              value={(formData as any)[field]}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
        ))}

        <div className="flex flex-col md:flex-row md:space-x-6 md:items-start space-y-6 md:space-y-0">
          {/* Location and Time Inputs */}
          <div className="md:w-1/2 space-y-6">
            <div>
              <Label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location
              </Label>
              <Input
                id="location"
                name="location"
                placeholder="Location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <Label
                htmlFor="eventTime"
                className="block text-sm font-medium text-gray-700"
              >
                Time
              </Label>
              <Input
                id="eventTime"
                name="eventTime"
                placeholder="Event Time"
                type="datetime-local"
                value={formData.eventTime}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* Scrollable Multi-Image Preview Pane */}
          <div className="md:w-1/2">
            <Label className="block text-sm font-medium text-gray-700">
              Images
            </Label>
            {/* Hidden file input that now accepts multiple files */}
            <Input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelectAndUpload}
              className="hidden"
            />
            {/* Scrollable container */}
            <div className="mt-1 h-48 w-full p-2 border-2 border-dashed border-gray-300 rounded-lg overflow-y-auto flex flex-wrap gap-4">
              {/* Map over the images array to display each preview */}
              {images.map((image) => (
                <div
                  key={image.previewUrl}
                  className="relative w-28 h-28 group shrink-0"
                >
                  {/* {image.isUploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 rounded-lg text-white text-xs">Uploading...</div>
                )} */}
                  <img
                    src={image.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />

                  {/* Buttons appear on hover */}
                  {
                    /*!image.isUploading && */ image.id && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCopyId(image.previewUrl)}
                          className="p-1.5 bg-white rounded-full text-black"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                    )
                  }
                  <button
                    type="button"
                    onClick={() => handleImageDelete(image.previewUrl)}
                    className="absolute top-1 right-1 z-20 bg-black bg-opacity-50 text-white rounded-full p-1 leading-none hover:bg-opacity-75"
                  >
                    &#x2715;
                  </button>
                </div>
              ))}

              {/* Add More button is always visible */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 shrink-0 flex flex-col items-center justify-center border-2 border-transparent rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-500"
              >
                <UploadIcon />
                <span className="text-xs mt-1">Add Images</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="eventEndTime"
            className="block text-sm font-medium text-gray-700"
          >
            Event End Time
          </label>
          <input
            id="eventEndTime"
            name="eventEndTime"
            type="datetime-local"
            value={formData.eventEndTime}
            onChange={handleChange}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            required
          />
        </div>
        <div>
          <label
            htmlFor="eventEndTime"
            className="block text-sm font-medium text-gray-700"
          >
            Event End Time
          </label>
          <input
            id="eventEndTime"
            name="eventEndTime"
            type="datetime-local"
            value={formData.eventEndTime}
            onChange={handleChange}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            required
          />
        </div>

        {/* The MDEditor for the description */}
        <div>
          <Label className="block text-sm font-semibold text-gray-700">
            Body (Markdown Supported)
          </Label>
          <div
            data-color-mode="light"
            className="mt-1 border border-gray-300 rounded-lg overflow-hidden"
          >
            <MDEditor
              height={359}
              value={formData.body}
              onChange={handleEditorChange}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          Publish Notice
        </Button>
      </form>
    </div>
  );
}

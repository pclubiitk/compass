"use client";
import MDEditor from "@uiw/react-md-editor";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Send, Save, Type, AlignLeft, MapPin, Calendar, UploadCloud, X, Copy} from "lucide-react";

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

  const searchParams = useSearchParams();
  const noticeId = searchParams.get("noticeid");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null); // To trigger file input click

  // TODO: fix datetype of formdata to RFC formal
  const [formData, setFormData] = useState({
    type: "Event", // You might want a select input for this
    title: "",
    location: "",
    eventTime: "",
    eventEndTime: "",
    description: "",
    body: "**hello world!**\n\nstart writing your notice here.", // Initial markdown content
  });

  // -- location autocomplete state --
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationSkipNextSearch = useRef(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  console.log("Current notice", noticeId);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
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

  // Fuzzy search for the Location field, same endpoint + cache pattern as the map search bar
  const fuzzySearchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) return [];

    const CACHE_KEY = "search_cache";
    const rawCache = localStorage.getItem(CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};

    if (cache[searchQuery]) {
      return cache[searchQuery];
    }

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_MAPS_URL
      }/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    const results = data.results || [];

    cache[searchQuery] = results;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    const size = new Blob([JSON.stringify(cache)]).size;
    const MAX = 5 * 1024 * 1024;
    if (size > MAX) {
      localStorage.removeItem(CACHE_KEY);
    }

    return results;
  };

  // Debounced search whenever formData.location changes
  useEffect(() => {
    if (!formData.location.trim()) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }

    if (locationSkipNextSearch.current) {
      locationSkipNextSearch.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await fuzzySearchLocations(formData.location);
      setLocationResults(results);
      setShowLocationDropdown(results.length > 0);
    }, 300);

    return () => clearTimeout(timeout);
  }, [formData.location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationWrapperRef.current &&
        !locationWrapperRef.current.contains(e.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: any) => {
    locationSkipNextSearch.current = true;
    setFormData((prev) => ({ ...prev, location: loc.name }));
    setLocationResults([]);
    setShowLocationDropdown(false);
  };

  // -- changes --
  const handleFileSelectAndUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesArray = Array.from(selectedFiles).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} must be less than 10 MB.`);
        return false;
      }
      return true;
    });
    if (filesArray.length === 0) return;

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
          },
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
              : img,
          ),
        );
      } catch {
         // setError(err.message);
        setImages((prev) =>
          prev.filter((img) => img.previewUrl !== image.previewUrl),
        );
        // removed the failed uploads
      }
    }
  };

  // Deletes a specific image from the array by its previewUrl
  const handleImageDelete = (previewUrlToDelete: string) => {
    const imageToDelete = images.find(
      (img) => img.previewUrl === previewUrlToDelete,
    );
    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.previewUrl); // Clean up memory
    }
    setImages((prev) =>
      prev.filter((img) => img.previewUrl !== previewUrlToDelete),
    );
  };

  // Copies the ID for a specific image
  const handleCopyId = (previewUrlToCopy: string) => {
    const imageToCopy = images.find(
      (img) => img.previewUrl === previewUrlToCopy,
    );
    if (!imageToCopy || !imageToCopy.id) return;

    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_ASSET_URL}/tmp/${imageToCopy.id}.webp`,
    );
    setImages((prev) =>
      prev.map((img) =>
        img.previewUrl === previewUrlToCopy
          ? { ...img, copySuccess: true }
          : img,
      ),
    );
    setTimeout(() => {
      setImages((prev) =>
        prev.map((img) =>
          img.previewUrl === previewUrlToCopy
            ? { ...img, copySuccess: false }
            : img,
        ),
      );
    }, 2000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const readyImages = images.filter((img) => img.id !== null);
    try {
      const payload = {
        ...formData,
        coverPic: readyImages[0]?.id ?? null,
        bioPics: readyImages.slice(1).map((img) => img.id),
        eventEndTime: formData.eventEndTime
          ? new Date(formData.eventEndTime).toISOString()
          : null,
        eventTime: formData.eventTime
          ? new Date(formData.eventTime).toISOString()
          : null,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      localStorage.removeItem("notice_search_cache");

      console.log("Notice submitted successfully!");
      router.push("/noticeboard");
    } catch {
      toast.error("Failed to submit notice");
    }
  };

  function isoToDatetimeLocal(iso: string) {
    const date = new Date(iso);

    const pad = (n: number) => String(n).padStart(2, "0");

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }


  // Clean up all object URLs when the component unmounts
  useEffect(() => {
    if (noticeId) {
      // Fetch existing notice data and populate form
      const fetchNotice = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/notice/${noticeId}`,
            {
              credentials: "include",
            },
          );
          if (!res.ok) throw new Error("Notice not found");

          const data = await res.json();
          setFormData({
            type: data.entity,
            title: data.title,
            location: data.location,
            eventTime: isoToDatetimeLocal(data.eventTime),
            eventEndTime: isoToDatetimeLocal(data.eventEndTime),
            description: data.description,
            body: data.body,
          });
        } catch (err) {
          console.error("Failed to fetch notice:", err);
        }
      };

      fetchNotice();
    }
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []); // vs [images]

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!noticeId) return;

    try {
      const payload = {
        ...formData,
        eventEndTime: formData.eventEndTime
          ? new Date(formData.eventEndTime).toISOString()
          : null,
        eventTime: formData.eventTime
          ? new Date(formData.eventTime).toISOString()
          : null,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAPS_URL}/api/maps/editNotice/${noticeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      localStorage.removeItem("notice_search_cache");

      console.log("Notice updated successfully!");
      router.push("/noticeboard");
    } catch {
      toast.error("Failed to update notice");
      // console.error("Failed to update notice:", err);
    }
  };

  const inputBaseClass =
    "mt-1 w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg shadow-sm bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors";

  return (
    <div className="w-full flex justify-center  px-4">
      <Card className="w-full max-w-6xl border border-gray-200 rounded-2xl shadow-sm">
        {/* Header row: title left, primary action top-right */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {noticeId ? "Edit Notice" : "Publish Notice"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {noticeId
                ? "Update the details for this notice."
                : "Share a notice or event with the campus community."}
            </p>
          </div>

          {noticeId ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => router.push("/noticeboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="notice-form"
                className="bg-gray-900 text-white rounded-xl px-5 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900/20 transition-colors flex items-center gap-1.5"
                onClick={handleEdit}
              >
                <Save className="w-4 h-4" />
                Update
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              form="notice-form"
              className="bg-gray-900 text-white rounded-xl px-5 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900/20 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Publish
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-2 pb-5">
          <form id="notice-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: title + description side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="block text-xs font-semibold text-gray-900">
                  Title
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Type className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Annual Tech Fest 2026"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="block text-xs font-semibold text-gray-900">
                  Description
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AlignLeft className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short summary for the notice card"
                    type="text"
                    value={formData.description}
                    onChange={handleChange}
                    className={inputBaseClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 2: location, start, end, images — 4 columns on wide screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div ref={locationWrapperRef} className="relative">
                <Label htmlFor="location" className="block text-xs font-semibold text-gray-900">
                  Location
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. Main Auditorium"
                    type="text"
                    autoComplete="off"
                    value={formData.location}
                    onChange={handleChange}
                    onFocus={() => {
                      if (locationResults.length > 0) setShowLocationDropdown(true);
                    }}
                    className={inputBaseClass}
                  />
                </div>

                {/* Suggestions dropdown */}
                {showLocationDropdown && locationResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full bg-white max-h-56 overflow-y-auto rounded-lg shadow-lg border border-gray-100">
                    {locationResults.map((loc) => (
                      <div
                        key={loc.locationId || loc.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                        onClick={() => handleSelectLocation(loc)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-800 text-xs truncate">
                            {loc.name}
                          </span>
                          {(loc.category || loc.locationType || loc.location_type) && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide shrink-0">
                              {loc.category || loc.locationType || loc.location_type}
                            </span>
                          )}
                        </div>
                        {loc.description && (
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                            {loc.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="eventTime" className="block text-xs font-semibold text-gray-900">
                  Start Time
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="datetime-local"
                    value={formData.eventTime}
                    onChange={handleChange}
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="eventEndTime" className="block text-xs font-semibold text-gray-900">
                  End Time
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </span>
                  <Input
                    id="eventEndTime"
                    name="eventEndTime"
                    type="datetime-local"
                    value={formData.eventEndTime}
                    onChange={handleChange}
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div className="md:col-span-2 xl:col-span-1">
                <div className="flex items-baseline justify-between">
                  <Label className="block text-xs font-semibold text-gray-900">Images</Label>
                  <span className="text-[10px] text-gray-400">Max 10MB</span>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelectAndUpload}
                  className="hidden"
                />
                <div className="mt-1 h-[74px] w-full px-2 py-1.5 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/60 overflow-x-auto overflow-y-hidden flex items-center gap-2">
                  {images.map((image) => (
                    <div
                      key={image.previewUrl}
                      className="relative w-[58px] h-[58px] group shrink-0 rounded-md overflow-hidden border border-gray-200 bg-white"
                    >
                    {/* {image.isUploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 rounded-lg text-white text-xs">Uploading...</div>
                )} */}
                      <img
                        src={image.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      {image.id && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleCopyId(image.previewUrl)}
                            className="p-1 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                            title={image.copySuccess ? "Copied!" : "Copy URL"}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageDelete(image.previewUrl)}
                        className="absolute top-0.5 right-0.5 z-20 bg-gray-900/70 text-white rounded-full p-0.5 leading-none hover:bg-gray-900 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[58px] h-[58px] shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-md cursor-pointer bg-white border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span className="text-[9px] font-medium">Add</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body editor */}
            <div>
              <Label className="block text-xs font-semibold text-gray-900">
                Body <span className="font-normal text-gray-400">(Markdown supported)</span>
              </Label>
              <div
                data-color-mode="light"
                className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                <MDEditor
                  height={340}
                  value={formData.body}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Copy, Check, X, Facebook, Mail, Send, Twitter } from 'lucide-react';

export default function ShareDialog({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset icon after 2s
    } catch {
      alert('Copy failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800">Share Notice</h2>

        <div className="flex flex-col gap-3">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
          >
            <Send className="w-4 h-4" /> WhatsApp
          </a>

          <a
            href={`https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          >
            <Send className="w-4 h-4" /> Telegram
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition"
          >
            <Twitter className="w-4 h-4" /> Twitter (X)
          </a>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
          >
            <Facebook className="w-4 h-4" /> Facebook
          </a>

          <a
            href={`mailto:?subject=${shareText}&body=${shareText}%0A${shareUrl}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            <Mail className="w-4 h-4" /> Email
          </a>

          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

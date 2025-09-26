'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Check, X, Facebook, Mail, Send, Twitter } from 'lucide-react';

type ShareDialogProps = {
  url: string;
  title: string;
  onClose: () => void;
};

function ShareButton({
  href,
  onClick,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className: string;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}

export default function ShareDialog({ url, title, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareText = encodeURIComponent(title);
const shareUrl = `${window.location.origin}/noticeboard/v1`; 

// Copy link handler
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl); 
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    alert("Copy failed");
  }
};


  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url,
        });
      } catch {
      }
    } else {
      alert('Sharing not supported on this device');
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
    >
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

          <ShareButton
            onClick={handleCopy}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
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
          </ShareButton>

          <ShareButton
            onClick={handleNativeShare}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
             Share
          </ShareButton>
        </div>
      </div>
    </div>
  );
}

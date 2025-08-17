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
  const shareUrl = encodeURIComponent(url);

  // Copy link handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    } catch {
      alert('Copy failed');
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
        {/* Close button */}
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
            href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
            className="bg-green-50 text-green-700 hover:bg-green-100"
          >
            <Send className="w-4 h-4" /> WhatsApp
          </ShareButton>

          <ShareButton
            href={`https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Send className="w-4 h-4" /> Telegram
          </ShareButton>

          <ShareButton
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            className="bg-sky-50 text-sky-600 hover:bg-sky-100"
          >
            <Twitter className="w-4 h-4" /> Twitter (X)
          </ShareButton>

          <ShareButton
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            <Facebook className="w-4 h-4" /> Facebook
          </ShareButton>

          <ShareButton
            href={`mailto:?subject=${shareText}&body=${shareText}%0A${shareUrl}`}
            className="bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Mail className="w-4 h-4" /> Email
          </ShareButton>

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
            📱 Native Share
          </ShareButton>
        </div>
      </div>
    </div>
  );
}

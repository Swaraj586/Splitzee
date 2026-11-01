import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, MessageCircle, Send } from 'lucide-react';
import logoImg from '../assets/Logo.png';
import titleLightImg from '../assets/Title_light_theme.png';
import titleDarkImg from '../assets/Title_dark_theme.png';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const shareTitle = 'Splitzee - Smart Group Expense Splitter';
  const shareText = 'Hey! Check out Splitzee to split bills, track shared expenses, and settle group debts effortlessly:';
  const fullShareMessage = `${shareText} ${appUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      prompt('Copy this invitation message:', fullShareMessage);
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-600 text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-700 hover:bg-slate-800 text-white',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullShareMessage)}`,
    },
    {
      name: 'Twitter / X',
      icon: Share2,
      color: 'bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareMessage)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <img src={logoImg} alt="Splitzee Logo" className="h-7 w-auto object-contain" />
            <div className="flex items-center">
              <img src={titleLightImg} alt="Splitzee" className="h-5 w-auto object-contain block dark:hidden" />
              <img src={titleDarkImg} alt="Splitzee" className="h-5 w-auto object-contain hidden dark:block" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Message Preview Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Message Preview
            </label>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 select-all">
              <p>{shareText}</p>
              <p className="font-semibold text-amber-600 dark:text-amber-400 break-all">{appUrl}</p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Link & Message Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Invite Link & Message</span>
              </>
            )}
          </button>

          {/* Direct Share Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Or Share Directly Via
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {shareLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-transform hover:scale-[1.02] shadow-sm ${item.color}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

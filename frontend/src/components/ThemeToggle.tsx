import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  /** Optional override for controlled state */
  checked?: boolean;
  /** Optional callback when toggle is clicked */
  onChange?: (isDark: boolean) => void;
  /** Size variant of the toggle switch */
  size?: 'sm' | 'md' | 'lg';
  /** Extra CSS classes for the container */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

// Crisp Sun icon matching the reference design: centered circular core with 8 rounded rays
const SunIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.95"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Center circle */}
    <circle cx="12" cy="12" r="4.2" />
    {/* 4 Cardinal Rays */}
    <line x1="12" y1="2.4" x2="12" y2="5.2" />
    <line x1="12" y1="18.8" x2="12" y2="21.6" />
    <line x1="2.4" y1="12" x2="5.2" y2="12" />
    <line x1="18.8" y1="12" x2="21.6" y2="12" />
    {/* 4 Diagonal Rays */}
    <line x1="5.4" y1="5.4" x2="7.3" y2="7.3" />
    <line x1="18.6" y1="5.4" x2="16.7" y2="7.3" />
    <line x1="5.4" y1="18.6" x2="7.3" y2="16.7" />
    <line x1="18.6" y1="18.6" x2="16.7" y2="16.7" />
  </svg>
);

// Crisp Crescent Moon icon matching the reference design: facing left with graceful pointed tips
const MoonIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.95"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M 5.2 8 A 8 8 0 1 1 5.2 16 A 6.8 6.8 0 0 0 5.2 8 Z" />
  </svg>
);

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Toggle dark or light theme',
}) => {
  const { theme, toggleTheme } = useTheme();

  const isDark = checked !== undefined ? checked : theme === 'dark';

  const handleToggle = () => {
    if (onChange) {
      onChange(!isDark);
    } else {
      toggleTheme();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Dimensions configuration matching the ~2.25 : 1 pill aspect ratio in the reference image
  const sizeConfig = {
    sm: {
      track: 'w-[62px] h-[28px] p-[2.5px]',
      thumb: 'w-[23px] h-[23px]',
      thumbTranslate: isDark ? 'translate-x-[34px]' : 'translate-x-0',
      iconSize: 'w-3.5 h-3.5',
      slotSize: 'w-[23px] h-[23px]',
    },
    md: {
      track: 'w-[74px] h-[34px] p-[3px]',
      thumb: 'w-[28px] h-[28px]',
      thumbTranslate: isDark ? 'translate-x-[40px]' : 'translate-x-0',
      iconSize: 'w-4 h-4',
      slotSize: 'w-[28px] h-[28px]',
    },
    lg: {
      track: 'w-[86px] h-[40px] p-[3.5px]',
      thumb: 'w-[33px] h-[33px]',
      thumbTranslate: isDark ? 'translate-x-[46px]' : 'translate-x-0',
      iconSize: 'w-5 h-5',
      slotSize: 'w-[33px] h-[33px]',
    },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center rounded-full select-none cursor-pointer transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 active:scale-95 ${sizeConfig.track} ${
        isDark
          ? 'bg-[#18191c] border border-white/[0.08] shadow-[inset_0_3px_6px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(0,0,0,0.7),inset_0_-1px_1px_rgba(255,255,255,0.06)]'
          : 'bg-[#e2e4e8] border border-black/[0.07] shadow-[inset_0_3px_5px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(0,0,0,0.14),inset_0_-1px_2px_rgba(255,255,255,0.85)]'
      } ${className}`}
    >
      {/* Background Track Inactive Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-[3px] pointer-events-none">
        {/* Left static Sun (dim gray outline on dark sunken track) */}
        <div className={`flex items-center justify-center ${sizeConfig.slotSize}`}>
          <SunIcon
            className={`${sizeConfig.iconSize} transition-opacity duration-300 ${
              isDark ? 'opacity-100 text-[#555a66]' : 'opacity-0 text-[#9ca3af]'
            }`}
          />
        </div>

        {/* Right static Moon (soft gray outline on light sunken track) */}
        <div className={`flex items-center justify-center ${sizeConfig.slotSize}`}>
          <MoonIcon
            className={`${sizeConfig.iconSize} transition-opacity duration-300 ${
              isDark ? 'opacity-0 text-[#4b5563]' : 'opacity-100 text-[#8a8f99]'
            }`}
          />
        </div>
      </div>

      {/* Sliding Thumb / Knob */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] overflow-hidden ${
          sizeConfig.thumb
        } ${sizeConfig.thumbTranslate}`}
        style={{
          boxShadow: isDark
            ? '0 3px 8px rgba(0, 0, 0, 0.65), 0 1px 2px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.45)'
            : '0 3px 8px rgba(240, 123, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.16), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.7), inset 0 -1.5px 2px rgba(0, 0, 0, 0.22)',
        }}
      >
        {/* Light Mode Knob Gradient Background */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background: 'linear-gradient(180deg, #ffb833 0%, #ffa210 38%, #f07b00 100%)',
          }}
        />

        {/* Dark Mode Knob Gradient Background */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(180deg, #535966 0%, #3a3e47 50%, #2b2e35 100%)',
          }}
        />

        {/* Active Sun Icon inside Thumb (White) */}
        <div
          className={`relative z-10 flex items-center justify-center transition-all duration-300 ${
            isDark
              ? 'opacity-0 scale-50 rotate-90 pointer-events-none'
              : 'opacity-100 scale-100 rotate-0 text-white'
          }`}
        >
          <SunIcon className={`${sizeConfig.iconSize} drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)]`} />
        </div>

        {/* Active Moon Icon inside Thumb (White) */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 ${
            isDark
              ? 'opacity-100 scale-100 rotate-0 text-white'
              : 'opacity-0 scale-50 -rotate-90 pointer-events-none'
          }`}
        >
          <MoonIcon className={`${sizeConfig.iconSize} drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]`} />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;

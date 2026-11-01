import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import logoImg from '../assets/Logo.png';
import titleLightImg from '../assets/Title_light_theme.png';
import titleDarkImg from '../assets/Title_dark_theme.png';

export interface SplitzeeLoaderProps {
  /** Size variant of the loader */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  /** Optional custom text message below the loader */
  text?: string;
  /** Whether to render the themed title graphic alongside/below the logo */
  showTitle?: boolean;
  /** Additional CSS classes for styling */
  className?: string;
  /** Error message to display directly on the loading screen */
  error?: string | null;
  /** Optional callback to retry connecting */
  onRetry?: () => void;
}

export const SplitzeeLoader: React.FC<SplitzeeLoaderProps> = ({
  size = 'md',
  text,
  showTitle = true,
  className = '',
  error,
  onRetry,
}) => {
  // Configured dimensions for each size variant
  const config = {
    sm: {
      logoSize: 'h-7 w-auto',
      titleSize: 'h-4 w-auto',
      ringSize: 'w-12 h-12',
      glowSize: 'w-14 h-14',
      beamWidth: 'w-28 h-1',
      textSize: 'text-[11px]',
      gap: 'space-y-2',
    },
    md: {
      logoSize: 'h-10 w-auto',
      titleSize: 'h-6 w-auto',
      ringSize: 'w-16 h-16',
      glowSize: 'w-20 h-20',
      beamWidth: 'w-40 h-1.5',
      textSize: 'text-xs',
      gap: 'space-y-3.5',
    },
    lg: {
      logoSize: 'h-14 sm:h-16 w-auto',
      titleSize: 'h-7 sm:h-8 w-auto',
      ringSize: 'w-24 h-24',
      glowSize: 'w-28 h-28',
      beamWidth: 'w-52 h-1.5',
      textSize: 'text-xs sm:text-sm',
      gap: 'space-y-4',
    },
    fullscreen: {
      logoSize: 'h-16 sm:h-20 w-auto',
      titleSize: 'h-8 sm:h-9 w-auto',
      ringSize: 'w-28 h-28',
      glowSize: 'w-36 h-36',
      beamWidth: 'w-60 h-2',
      textSize: 'text-sm',
      gap: 'space-y-5',
    },
  }[size];

  const defaultText = {
    sm: 'Loading...',
    md: 'Balancing expenses...',
    lg: 'Splitting bills & settling debts...',
    fullscreen: 'Loading Splitzee...',
  }[size];

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${config.gap} ${className}`}>
      {/* Animated Brand Emblem & Aura */}
      <div className="relative flex items-center justify-center">
        {/* Soft Radial Ambient Glow */}
        <div
          className={`absolute rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/20 to-amber-400/10 blur-xl pointer-events-none animate-splitzee-glow ${config.glowSize}`}
          aria-hidden="true"
        />

        {/* Dynamic Expanding Pulse Ring */}
        <div
          className={`absolute rounded-full border border-amber-500/30 dark:border-amber-400/20 pointer-events-none animate-splitzee-pulse-ring ${config.ringSize}`}
          aria-hidden="true"
        />

        {/* The Splitzee Logo Coin with smooth levitation float */}
        <div className="relative z-10 animate-splitzee-float">
          <img
            src={logoImg}
            alt="Splitzee Logo"
            className={`${config.logoSize} object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)]`}
          />
        </div>
      </div>

      {/* Themed Brand Title Graphic */}
      {showTitle && (
        <div className="relative flex items-center justify-center transition-opacity duration-300">
          {/* Light Theme Title */}
          <img
            src={titleLightImg}
            alt="Splitzee"
            className={`${config.titleSize} object-contain block dark:hidden`}
          />
          {/* Dark Theme Title */}
          <img
            src={titleDarkImg}
            alt="Splitzee"
            className={`${config.titleSize} object-contain hidden dark:block`}
          />
        </div>
      )}

      {/* Content Area: Error State or Loading Shimmer */}
      {error ? (
        <div className="flex flex-col items-center space-y-3 pt-2 max-w-xs sm:max-w-sm animate-in fade-in zoom-in-95 duration-300">
          {/* Status Alert Badge */}
          <div className="p-2.5 bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/30 shadow-sm">
            <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          {/* Primary Busy Error Message */}
          <div className="space-y-1">
            <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
              {error}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Not available at this moment.
            </p>
          </div>

          {/* Retry Button */}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      ) : (
        /* Normal Settle / Balance Shimmer Beam */
        <div className="flex flex-col items-center space-y-2 pt-1">
          <div
            className={`rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/40 overflow-hidden relative shadow-inner ${config.beamWidth}`}
          >
            {/* Shimmering beam traveling across to symbolize balancing transactions */}
            <div className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full animate-splitzee-shimmer" />
          </div>

          {/* Contextual Status Caption */}
          <p className={`font-medium text-slate-500 dark:text-slate-400 tracking-wide ${config.textSize}`}>
            {text || defaultText}
          </p>
        </div>
      )}
    </div>
  );

  if (size === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-sm sm:max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default SplitzeeLoader;

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, User as UserIcon, Share2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import logoImg from '../assets/Logo.png';
import titleLightImg from '../assets/Title_light_theme.png';
import titleDarkImg from '../assets/Title_dark_theme.png';

interface NavbarProps {
  onOpenAuth: () => void;
  onGoHome: () => void;
  onOpenShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onGoHome, onOpenShare }) => {
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70 sticky top-0 z-40 transition-colors duration-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Themed Title */}
        <div
          onClick={onGoHome}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group flex-shrink-0 select-none"
        >
          <img
            src={logoImg}
            alt="Splitzee Logo"
            className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex items-center">
            {/* Light mode title */}
            <img
              src={titleLightImg}
              alt="Splitzee"
              className="h-6 sm:h-7 w-auto object-contain block dark:hidden"
            />
            {/* Dark mode title */}
            <img
              src={titleDarkImg}
              alt="Splitzee"
              className="h-6 sm:h-7 w-auto object-contain hidden dark:block"
            />
            
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Share / Invite Splitzee Button */}
          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              title="Invite friends to Splitzee"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer backdrop-blur-sm"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          {/* Skeuomorphic Dark/Light Mode Toggle Switch */}
          <ThemeToggle />

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <div className="hidden md:flex items-center space-x-2 bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 max-w-[200px] backdrop-blur-sm">
                <UserIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span className="font-medium truncate">{currentUser?.name || currentUser?.email}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 sm:px-3 py-1.5 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition-all cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-amber-500/25 transition-all cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

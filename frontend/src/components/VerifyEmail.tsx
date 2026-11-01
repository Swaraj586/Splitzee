import React, { useEffect, useState, useRef } from 'react';
import { authService } from '../api/apiClient';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Home, ShieldCheck } from 'lucide-react';

interface VerifyEmailProps {
  onOpenAuth: () => void;
  onGoHome: () => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onOpenAuth, onGoHome }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const verificationStarted = useRef(false);
  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check the activation link sent to your email.');
      return;
    }

    const verify = async () => {
      try {
        const resMessage = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(typeof resMessage === 'string' ? resMessage : 'Account verified successfully! You can now log in.');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Invalid or expired verification link.';
        setStatus('error');
        setMessage(typeof errMsg === 'string' ? errMsg : 'Invalid or expired verification link.');
      }
    };

    verify();
  }, []);

  const handleProceedToLogin = () => {
    window.history.replaceState({}, document.title, '/');
    onGoHome();
    onOpenAuth();
  };

  const handleGoHome = () => {
    window.history.replaceState({}, document.title, '/');
    onGoHome();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-center transition-colors">
        {status === 'verifying' && (
          <div className="space-y-6 py-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Verifying Email Address
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please wait while we confirm your account details...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
              </span>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Email Verified!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                {message}
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={handleProceedToLogin}
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-500 ring-8 ring-red-50/50 dark:ring-red-950/20">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300">
                Verification Failed
              </span>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Unable to Verify Email
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                {message}
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={handleGoHome}
                className="w-full py-3 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

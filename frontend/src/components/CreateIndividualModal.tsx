import React, { useState } from 'react';
import { groupService } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Group } from '../types';
import { X, UserPlus, AlertCircle, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { SplitzeeLoader } from './SplitzeeLoader';

interface CreateIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIndividualCreated: (group: Group) => void;
}

export const CreateIndividualModal: React.FC<CreateIndividualModalProps> = ({
  isOpen,
  onClose,
  onIndividualCreated,
}) => {
  const { currentUser } = useAuth();
  const [friendEmail, setFriendEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = friendEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your friend's email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (currentUser?.email && cleanEmail === currentUser.email.trim().toLowerCase()) {
      setError('You cannot create an individual expense with yourself.');
      return;
    }

    if (!currentUser?.email) {
      setError('You must be logged in to create an individual expense.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const group = await groupService.createIndividual(cleanEmail);

      if (!group || !group.groupId) {
        throw new Error('Failed to create or retrieve individual expense.');
      }

      // Store groupId locally for persistence
      const storedIds: string[] = JSON.parse(localStorage.getItem('splitzeeGroupIds') || '[]');
      if (!storedIds.includes(group.groupId)) {
        storedIds.push(group.groupId);
        localStorage.setItem('splitzeeGroupIds', JSON.stringify(storedIds));
      }

      setFriendEmail('');
      onIndividualCreated(group);
      onClose();
    } catch (err: any) {
      const backendMsg = err.response?.data?.message || err.response?.data || err.message;
      if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('not found')) {
        setError(`User "${cleanEmail}" not found. Please make sure they have signed up for Splitzee.`);
      } else {
        setError(typeof backendMsg === 'string' ? backendMsg : 'Failed to create or open individual expense.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white dark:from-slate-800 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Start Individual Expense
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-on-1 direct expense thread with a friend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body or Loading */}
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center min-h-[260px]">
            <SplitzeeLoader size="md" text="Connecting & opening expense thread..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Current User indicator */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Splitting as:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[220px]">
                {currentUser?.name || currentUser?.email}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Friend's Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Feature Info Card */}
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Instant 1-on-1 Connection</p>
                <p className="text-indigo-700 dark:text-indigo-300/80 leading-relaxed">
                  If an individual thread with this friend already exists, Splitzee will immediately open your existing thread so you never lose past expenses or settlements.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 text-xs sm:text-sm"
              >
                <span>Open Thread</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

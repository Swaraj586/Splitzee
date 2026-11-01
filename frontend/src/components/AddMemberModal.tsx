import React, { useState } from 'react';
import { groupService } from '../api/apiClient';
import { SplitzeeLoader } from './SplitzeeLoader';
import { X, Plus, Trash2, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  groupId,
  onClose,
  onMemberAdded,
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = async () => {
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(clean)) {
      setError('Email already in list');
      return;
    }

    setCheckingEmail(true);
    setError(null);

    try {
      // Verify user existence with backend: /group/{email}/checkValidMember
      const isValid = await groupService.checkValidMember(clean);
      if (!isValid) {
        setError(`User "${clean}" does not exist on Splitzee. Only valid registered users can be invited.`);
        return;
      }

      setEmails((prev) => [...prev, clean]);
      setNewEmail('');
      setError(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to verify member';
      setError(typeof msg === 'string' ? msg : 'Failed to verify member');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emails.length === 0) {
      setError('Please add at least one member email to invite');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Invitation is the only medium
      await groupService.inviteMembers(groupId, emails);
      onMemberAdded();
      onClose();
      setEmails([]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to send invitations';
      setError(typeof msg === 'string' ? msg : 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-slate-200/80 dark:border-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Invite Members
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send an email invitation link to join this group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <SplitzeeLoader size="md" text="Sending invitations to new members..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Addresses to Invite
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="email"
                placeholder="friend@example.com"
                value={newEmail}
                disabled={checkingEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!checkingEmail) {
                      handleAddEmail();
                    }
                  }
                }}
                className="flex-1 px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                disabled={checkingEmail || !newEmail.trim()}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                {checkingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Email Pills List */}
            {emails.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs sm:text-sm"
                  >
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <Mail className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || emails.length === 0}
              className="px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl shadow-sm shadow-amber-500/20 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {loading ? 'Sending...' : `Send ${emails.length > 0 ? `(${emails.length}) ` : ''}Invitations`}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

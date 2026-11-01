import React, { useState } from 'react';
import { groupService } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { SplitzeeLoader } from './SplitzeeLoader';
import { X, Plus, Trash2, Users, AlertCircle, Loader2 } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [emails, setEmails] = useState<string[]>(currentUser?.email ? [currentUser.email] : []);
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

    if (emails.map((e) => e.toLowerCase()).includes(clean)) {
      setError('Email already added');
      return;
    }

    setCheckingEmail(true);
    setError(null);

    try {
      // Verify user existence with backend: /group/{email}/checkValidMember
      const isValid = await groupService.checkValidMember(clean);
      if (!isValid) {
        setError(`User "${clean}" does not exist on Splitzee. Only valid registered users can be added.`);
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
    if (!title.trim()) {
      setError('Group title is required');
      return;
    }
    if (emails.length === 0) {
      setError('At least one member email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const creatorEmail = currentUser?.email || (emails.length > 0 ? emails[0] : null);

      // 1. Create group entity with creator included as an initial member
      const createdGroup = await groupService.createGroup({
        title: title.trim(),
        emails: creatorEmail ? [creatorEmail.trim()] : [],
      });
      const groupId = createdGroup?.groupId;

      if (!groupId) {
        throw new Error('Failed to retrieve created group ID.');
      }

      // 2. Invite other group members via /group/{groupId}/invite
      const otherEmails = emails
        .map((e) => e.trim())
        .filter((e) => e.toLowerCase() !== (creatorEmail?.trim().toLowerCase() || ''));

      if (otherEmails.length > 0) {
        try {
          await groupService.inviteMembers(groupId, otherEmails);
        } catch (inviteErr) {
          console.warn('Failed to send invitations to some members:', inviteErr);
        }
      }

      // 4. Store groupId locally
      const storedIds: string[] = JSON.parse(localStorage.getItem('splitzeeGroupIds') || '[]');
      if (!storedIds.includes(groupId)) {
        storedIds.push(groupId);
        localStorage.setItem('splitzeeGroupIds', JSON.stringify(storedIds));
      }

      onGroupCreated();
      onClose();
      setTitle('');
      setEmails(currentUser?.email ? [currentUser.email] : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-slate-200/80 dark:border-slate-800">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Create New Group</h2>
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
            <SplitzeeLoader size="md" text="Creating group & dispatching invites..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Group Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Trip to Goa, Apartment Expenses"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Invite Members by Email
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Invitations will be emailed to each recipient to join this group.
            </p>
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
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                disabled={checkingEmail || !newEmail.trim()}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
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

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl shadow-sm shadow-amber-500/20 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {loading ? 'Creating & Inviting...' : 'Create Group & Send Invites'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

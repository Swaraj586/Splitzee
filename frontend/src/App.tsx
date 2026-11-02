import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CreateIndividualModal } from './components/CreateIndividualModal';
import { GroupList } from './components/GroupList';
import { GroupDetail } from './components/GroupDetail';
import { VerifyEmail } from './components/VerifyEmail';
import { ShareAppModal } from './components/ShareAppModal';
import { Group } from './types';
import { groupService, apiClient, BACKEND_BUSY_MESSAGE } from './api/apiClient';
import { SplitzeeLoader } from './components/SplitzeeLoader';
import { AlertCircle, X } from 'lucide-react';
import logoImg from './assets/Logo.png';
import titleLightImg from './assets/Title_light_theme.png';
import titleDarkImg from './assets/Title_dark_theme.png';

const MainContent: React.FC = () => {
  const { currentUser, isAuthenticated, authReady } = useAuth();
  const { theme } = useTheme();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const [groups, setGroups] = useState<Group[]>([]);
  const [individualGroups, setIndividualGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateIndividualOpen, setIsCreateIndividualOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyError, setBusyError] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  // Listen for backend retry updates and unavailability
  useEffect(() => {
    const handleBackendBusy = (e: any) => {
      const msg = e.detail?.message || BACKEND_BUSY_MESSAGE;
      setBusyError(msg);
      setLoading(false);
      setIndividualLoading(false);
    };

    const handleBackendRetry = (e: any) => {
      const { attempt } = e.detail || {};
      if (attempt) {
        if (attempt <= 2) {
          setRetryStatus('Connecting to Splitzee...');
        } else if (attempt <= 6) {
          setRetryStatus('Waking up the server, please wait a moment...');
        } else if (attempt <= 16) {
          setRetryStatus('Backend is waking up (cloud cold-start)...');
        } else {
          setRetryStatus('Still warming up backend services, almost ready...');
        }
      }
    };

    window.addEventListener('splitzee:backend-busy', handleBackendBusy);
    window.addEventListener('splitzee:backend-retry', handleBackendRetry);
    return () => {
      window.removeEventListener('splitzee:backend-busy', handleBackendBusy);
      window.removeEventListener('splitzee:backend-retry', handleBackendRetry);
    };
  }, []);

  // Early background ping to kickstart Azure container wake-up immediately
  useEffect(() => {
    apiClient.get('/csrf-token/public').catch(() => {});
  }, []);

  const handleOpenShare = async () => {
    const shareData = {
      title: 'Splitzee - Smart Group Expense Splitter',
      text: 'Hey! Check out Splitzee to split bills, track shared expenses, and settle group debts effortlessly:',
      url: window.location.origin,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsShareOpen(true);
        }
      }
    } else {
      setIsShareOpen(true);
    }
  };

  // Check URL query parameters for invite tokens on load (exclude verification route)
  useEffect(() => {
    if (window.location.pathname === '/verify-email') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('inviteToken') || urlParams.get('token');

    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.setItem('pendingInviteToken', token);
    }
  }, []);

  const fetchGroups = async () => {
    if (!isAuthenticated) {
      setGroups([]);
      setIndividualGroups([]);
      setLoading(false);
      setIndividualLoading(false);
      return;
    }

    setLoading(true);
    setIndividualLoading(true);
    try {
      let groupList: Group[] = [];
      let individualList: Group[] = [];
      let backendDown = false;

      try {
        groupList = await groupService.getUserGroups(currentUser?.email);
      } catch (e: any) {
        if (e?.message === BACKEND_BUSY_MESSAGE || e?.response?.data?.message === BACKEND_BUSY_MESSAGE) {
          backendDown = true;
          setBusyError(BACKEND_BUSY_MESSAGE);
        } else {
          console.warn('User groups fetch failed, falling back to local groups', e);
        }
      }

      if (!backendDown) {
        try {
          individualList = await groupService.getUserIndividuals();
        } catch (e: any) {
          if (e?.message === BACKEND_BUSY_MESSAGE || e?.response?.data?.message === BACKEND_BUSY_MESSAGE) {
            backendDown = true;
            setBusyError(BACKEND_BUSY_MESSAGE);
          } else {
            console.warn('User individual expenses fetch failed', e);
          }
        }
      }

      if (!backendDown) {
        const storedGroupIds: string[] = JSON.parse(localStorage.getItem('splitzeeGroupIds') || '[]');
        const existingGroupIds = new Set(groupList.map((g) => g.groupId));
        const existingIndividualIds = new Set(individualList.map((g) => g.groupId));

        for (const id of storedGroupIds) {
          if (!existingGroupIds.has(id) && !existingIndividualIds.has(id)) {
            try {
              const g = await groupService.getGroup(id);
              if (g && g.groupId) {
                if (g.isDirect || g.direct) {
                  individualList.push(g);
                  existingIndividualIds.add(g.groupId);
                } else {
                  groupList.push(g);
                  existingGroupIds.add(g.groupId);
                }
              }
            } catch {
              // Ignore invalid IDs
            }
          }
        }
      }

      setGroups(groupList);
      setIndividualGroups(individualList);
    } catch (err: any) {
      console.error('Error fetching groups and individuals:', err);
      if (err?.message === BACKEND_BUSY_MESSAGE || err?.response?.data?.message === BACKEND_BUSY_MESSAGE) {
        setBusyError(BACKEND_BUSY_MESSAGE);
      }
    } finally {
      setLoading(false);
      setIndividualLoading(false);
      setInitialLoading(false);
    }
  };

  // Process pending invitation token when auth status changes
  const processPendingInvite = async () => {
    if (window.location.pathname === '/verify-email') {
      return;
    }

    const token = sessionStorage.getItem('pendingInviteToken');
    if (!token) return;

    if (isAuthenticated) {
      sessionStorage.removeItem('pendingInviteToken');
      try {
        const msg = await groupService.acceptInvite(token);
        setInviteBanner({
          type: 'success',
          message: typeof msg === 'string' ? msg : 'Successfully accepted group invitation!',
        });
        fetchGroups();
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to accept invitation';
        setInviteBanner({
          type: 'error',
          message: typeof errMsg === 'string' ? errMsg : 'Invalid or expired invitation token.',
        });
      }
    } else {
      setIsAuthOpen(true);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      setGroups([]);
      setLoading(false);
      setIndividualLoading(false);
      setInitialLoading(false);
      return;
    }
    fetchGroups();
    processPendingInvite();
  }, [authReady, currentUser, isAuthenticated]);

  const handleGroupCreated = () => {
    fetchGroups();
  };

  const handleIndividualCreated = (createdGroup: Group) => {
    fetchGroups();
    if (createdGroup?.groupId) {
      setSelectedGroupId(createdGroup.groupId);
    }
  };

  if (busyError) {
    return (
      <SplitzeeLoader
        size="fullscreen"
        error={busyError}
        onRetry={() => {
          setBusyError(null);
          setRetryStatus(null);
          setInitialLoading(true);
          fetchGroups();
        }}
      />
    );
  }

  if (!authReady || (isAuthenticated && initialLoading)) {
    return (
      <SplitzeeLoader
        size="fullscreen"
        text={retryStatus || "Loading your Splitzee dashboard..."}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
      }`}>
      {/* Ambient background glow for glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-[100px]" />
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-orange-400/10 dark:bg-orange-500/10 blur-[120px]" />
      </div>

      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenShare={handleOpenShare}
        onGoHome={() => {
          setCurrentPath('/');
          setSelectedGroupId(null);
        }}
      />

      <main className="flex-1">
        {inviteBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className={`flex items-center justify-between p-4 rounded-2xl text-sm backdrop-blur-md border ${inviteBanner.type === 'success'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 shadow-sm'
                : 'bg-red-50/80 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/80 text-red-900 dark:text-red-200 shadow-sm'
              }`}>
              <span>{inviteBanner.message}</span>
              <button
                onClick={() => setInviteBanner(null)}
                className="text-xs font-bold underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {currentPath === '/verify-email' ? (
          <VerifyEmail
            onOpenAuth={() => setIsAuthOpen(true)}
            onGoHome={() => {
              setCurrentPath('/');
              setSelectedGroupId(null);
            }}
          />
        ) : selectedGroupId ? (
          <GroupDetail
            groupId={selectedGroupId}
            onBack={() => setSelectedGroupId(null)}
            onGroupDeleted={() => {
              setSelectedGroupId(null);
              fetchGroups();
            }}
          />
        ) : (
          <GroupList
            groups={groups}
            individualGroups={individualGroups}
            loading={loading}
            individualLoading={individualLoading}
            onSelectGroup={(id) => setSelectedGroupId(id)}
            onCreateGroupClick={() => setIsCreateGroupOpen(true)}
            onCreateIndividualClick={() => setIsCreateIndividualOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenShare={handleOpenShare}
          />
        )}
      </main>

      <footer className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <div className="flex items-center justify-center space-x-2.5 mb-2 select-none">
          <img src={logoImg} alt="Splitzee Logo" className="h-5 w-auto object-contain opacity-80" />
          <div className="flex items-center">
            <img src={titleLightImg} alt="Splitzee" className="h-4 w-auto object-contain opacity-80 block dark:hidden" />
            <img src={titleDarkImg} alt="Splitzee" className="h-4 w-auto object-contain opacity-80 hidden dark:block" />
          </div>
        </div>
        <p>© 2026 SNP. All rights reserved.</p>
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      <CreateIndividualModal
        isOpen={isCreateIndividualOpen}
        onClose={() => setIsCreateIndividualOpen(false)}
        onIndividualCreated={handleIndividualCreated}
      />
      <ShareAppModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { Group } from '../types';
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  Share2,
  UserPlus,
  Receipt,
  Sparkles,
  User,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SplitzeeLoader } from './SplitzeeLoader';
import logoImg from '../assets/Logo.png';
import titleLightImg from '../assets/Title_light_theme.png';
import titleDarkImg from '../assets/Title_dark_theme.png';

interface GroupListProps {
  groups: Group[];
  individualGroups?: Group[];
  loading: boolean;
  individualLoading?: boolean;
  onSelectGroup: (groupId: string) => void;
  onCreateGroupClick: () => void;
  onCreateIndividualClick?: () => void;
  onOpenAuth: () => void;
  onOpenShare?: () => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  individualGroups = [],
  loading,
  individualLoading = false,
  onSelectGroup,
  onCreateGroupClick,
  onCreateIndividualClick,
  onOpenAuth,
  onOpenShare,
}) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'individuals'>('all');

  const term = searchTerm.toLowerCase().trim();

  // Filter regular groups
  const filteredGroups = groups.filter((g) =>
    g.title?.toLowerCase().includes(term)
  );

  // Filter individual expenses by title, friend name, or friend email
  const filteredIndividuals = individualGroups.filter((g) => {
    if (!term) return true;
    if (g.title?.toLowerCase().includes(term)) return true;
    return g.members?.some(
      (m) =>
        m.name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
    );
  });

  const getInitials = (name?: string, email?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return '1:1';
  };

  const userFirstName = currentUser?.name
    ? currentUser.name.trim().split(/\s+/)[0]
    : currentUser?.email?.split('@')[0] || '';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 
        ========================================================================
        NOT LOGGED IN: Banner / Hero is ONLY visible when NOT logged in
        ========================================================================
      */}
      {!isAuthenticated && (
        <div className="space-y-6">
          <div className="relative rounded-3xl p-6 sm:p-10 md:p-12 overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] transition-all duration-300">
            {/* Subtle internal gradient glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-500/10 to-amber-400/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="flex items-center space-x-3 mb-1">
                <img src={logoImg} alt="Splitzee Logo" className="h-10 sm:h-12 w-auto object-contain" />
                <div className="flex items-center">
                  <img src={titleLightImg} alt="Splitzee" className="h-7 sm:h-8 w-auto object-contain block dark:hidden" />
                  <img src={titleDarkImg} alt="Splitzee" className="h-7 sm:h-8 w-auto object-contain hidden dark:block" />
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                <span>Smart Min-Flow Debt Settlements</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Split Bills & Expenses Effortlessly with Splitzee
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                Track group trips, roommate rent, shared meals, and 1-on-1 individual split.
                Automatically calculate minimal cash transactions required to settle up all debts.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenAuth}
                  className="inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl shadow-sm shadow-amber-500/25 transition-all text-xs sm:text-sm cursor-pointer"
                >
                  <span>Login to Start Splitting</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {onOpenShare && (
                  <button
                    onClick={onOpenShare}
                    className="inline-flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 font-medium rounded-xl backdrop-blur-sm transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 text-amber-500" />
                    <span>Invite Friends</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Minimalist Glass Feature Highlights for Visitors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Group Trips & Rent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create groups for vacations, roommates, and events. Anyone can log expenses and split unevenly or equally.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1-on-1 Direct Splits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Split dinners, groceries, or cabs directly with a friend without needing to create an entire group.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Optimal Settlements</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our algorithm minimizes the total number of cash transfers, settling debts in the fewest possible steps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        LOGGED IN: Directly see groups and individuals with clean dashboard header
        ========================================================================
      */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Clean Dashboard Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {userFirstName ? `Welcome back, ${userFirstName}` : 'Your Expenses'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your active expense groups and personal 1-on-1 splits
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onCreateGroupClick}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Group</span>
              </button>

              {onCreateIndividualClick && (
                <button
                  onClick={onCreateIndividualClick}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 active:scale-95 text-slate-800 dark:text-slate-100 font-semibold rounded-xl text-xs sm:text-sm shadow-sm backdrop-blur-sm transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-indigo-500" />
                  <span>1-on-1 Expense</span>
                </button>
              )}
            </div>
          </div>

          {/* Controls: Search and Glass Segmented Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3.5 top-2.5 sm:top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search groups or friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all"
              />
            </div>

            {/* Glass Filter Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({filteredGroups.length + filteredIndividuals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('groups')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeFilter === 'groups'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Groups ({filteredGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('individuals')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeFilter === 'individuals'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1-on-1 ({filteredIndividuals.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        SECTION 1: EXPENSE GROUPS
        ========================================================================
      */}
      {(activeFilter === 'all' || activeFilter === 'groups') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Expense Groups
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shared balances for trips, roommates, and events
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              {filteredGroups.length}
            </span>
          </div>

          {loading ? (
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center">
              <SplitzeeLoader size="md" text="Loading your expense groups..." />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
              <Users className="h-9 w-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Groups Found
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No groups matching "${searchTerm}".`
                  : "You haven't created or joined any group expenses yet."}
              </p>
              {isAuthenticated && !searchTerm && (
                <button
                  onClick={onCreateGroupClick}
                  className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Group</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGroups.map((g) => (
                <div
                  key={g.groupId}
                  onClick={() => onSelectGroup(g.groupId)}
                  className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:border-amber-500/40 dark:hover:border-amber-400/40 hover:bg-white/90 dark:hover:bg-slate-900/80 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {g.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                        Group
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{g.members?.length || 0} Members</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 
        ========================================================================
        SECTION 2: INDIVIDUAL 1-ON-1 EXPENSES
        ========================================================================
      */}
      {(activeFilter === 'all' || activeFilter === 'individuals') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Individual Splits
                  </h2>
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                    1-on-1 Direct
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct personal splits and debts tracked with friends
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2.5 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                {filteredIndividuals.length}
              </span>
              {isAuthenticated && onCreateIndividualClick && (
                <button
                  onClick={onCreateIndividualClick}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New</span>
                </button>
              )}
            </div>
          </div>

          {individualLoading ? (
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center">
              <SplitzeeLoader size="md" text="Loading 1-on-1 direct expenses..." />
            </div>
          ) : filteredIndividuals.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
              <UserPlus className="h-9 w-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Individual Expenses Yet
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No individual split matching "${searchTerm}".`
                  : 'Split dinner, groceries, or debts directly 1-on-1 with a friend without creating a full group.'}
              </p>
              {isAuthenticated && !searchTerm && onCreateIndividualClick && (
                <button
                  onClick={onCreateIndividualClick}
                  className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Start a 1-on-1 Expense</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredIndividuals.map((ind) => {
                // Identify the friend (the member that is not current user)
                const otherMember = ind.members?.find(
                  (m) => m.email.toLowerCase() !== currentUser?.email?.toLowerCase()
                ) || ind.members?.[0];

                const displayName = otherMember?.name || ind.title;
                const displayEmail = otherMember?.email;
                const initials = getInitials(otherMember?.name, otherMember?.email);

                return (
                  <div
                    key={ind.groupId}
                    onClick={() => onSelectGroup(ind.groupId)}
                    className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:bg-white/90 dark:hover:bg-slate-900/80 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {displayName}
                            </h3>
                            {displayEmail && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {displayEmail}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
                          1-on-1
                        </span>
                      </div>

                      <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Direct Thread</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {ind.expenses?.length || 0} {ind.expenses?.length === 1 ? 'Expense' : 'Expenses'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Individual</span>
                      </div>
                      <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

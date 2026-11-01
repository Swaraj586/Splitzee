import React, { useState, useEffect } from 'react';
import { groupService, expenseService } from '../api/apiClient';
import { Group, Expense, User } from '../types';
import { AddExpenseModal } from './AddExpenseModal';
import { AddMemberModal } from './AddMemberModal';
import { SettlementsView } from './SettlementsView';
import { useAuth } from '../context/AuthContext';
import { SplitzeeLoader } from './SplitzeeLoader';
import {
  ArrowLeft,
  Users,
  Receipt,
  Calculator,
  Plus,
  UserPlus,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  Mail,
  UserCheck,
} from 'lucide-react';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onGroupDeleted: () => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack, onGroupDeleted }) => {
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'members' | 'settlements'>('expenses');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberBalances, setMemberBalances] = useState<Record<string, number>>({});

  const isDirect = Boolean(group?.isDirect || group?.direct);
  const otherMember = isDirect
    ? group?.members?.find((m) => m.email.toLowerCase() !== currentUser?.email?.toLowerCase()) || group?.members?.[0]
    : null;
  const displayTitle = isDirect
    ? otherMember?.name || group?.title || '1-on-1 Expense'
    : group?.title || 'Group Details';

  const fetchGroupData = async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await groupService.getGroup(groupId);
      setGroup(g);
      const exps = await expenseService.getExpenses(groupId);
      setExpenses(exps);

      if (!g.isDirect && !g.direct) {
        try {
          const pending = await groupService.getPendingInvitations(groupId);
          setPendingInvitations(pending);
        } catch {
          setPendingInvitations([]);
        }
      } else {
        setPendingInvitations([]);
      }

      // Fetch member balances
      if (g.members) {
        const bals: Record<string, number> = {};
        for (const m of g.members) {
          try {
            bals[m.email] = await groupService.getUserBalance(groupId, m.email);
          } catch {
            bals[m.email] = 0;
          }
        }
        setMemberBalances(bals);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab('expenses');
    setGroup(null);
    setLoading(true);
    fetchGroupData();
  }, [groupId]);

  const handleDeleteGroup = async () => {
    const confirmMsg = isDirect
      ? 'Are you sure you want to delete this individual expense thread? This cannot be undone.'
      : 'Are you sure you want to delete this group? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    try {
      await groupService.deleteGroup(groupId);
      onGroupDeleted();
    } catch (err: any) {
      alert(err.response?.data?.message || (isDirect ? 'Failed to delete individual expense' : 'Failed to delete group'));
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseService.deleteExpense(groupId, expenseId);
      fetchGroupData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!window.confirm(`Remove member ${email} from group?`)) return;
    try {
      await groupService.removeMember(groupId, email);
      fetchGroupData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member. Ensure balance is settled first.');
    }
  };

  if (error && !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <SplitzeeLoader size="lg" error={error} onRetry={fetchGroupData} />
      </div>
    );
  }

  if (loading && !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <SplitzeeLoader size="lg" text="Loading expense group details..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 dark:border-slate-800/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors flex-shrink-0 mt-0.5 sm:mt-0"
            title="Back to List"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {displayTitle}
              </h1>
              {isDirect && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
                  1-on-1 Expense
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isDirect ? (
                <>
                  <span>Direct split with {otherMember?.email || 'friend'}</span>
                  <span>•</span>
                  <span>{expenses.length} {expenses.length === 1 ? 'Expense' : 'Expenses'}</span>
                  {currentUser?.email && memberBalances[currentUser.email] !== undefined && (
                    <>
                      <span>•</span>
                      <span className={
                        memberBalances[currentUser.email] > 0
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : memberBalances[currentUser.email] < 0
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 font-medium'
                      }>
                        {memberBalances[currentUser.email] > 0
                          ? `You are owed ₹${memberBalances[currentUser.email].toFixed(2)}`
                          : memberBalances[currentUser.email] < 0
                            ? `You owe ₹${Math.abs(memberBalances[currentUser.email]).toFixed(2)}`
                            : 'Settled up'}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span>{group?.members?.length || 0} Active Members</span>
                  {pendingInvitations.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{pendingInvitations.length} Pending Invites</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{expenses.length} Expenses</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddExpenseOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-amber-500/20 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>

          {!isDirect && (
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Mail className="h-4 w-4 text-amber-500" />
              <span>Invite Member</span>
            </button>
          )}

          <button
            onClick={handleDeleteGroup}
            className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
            title={isDirect ? 'Delete Individual Expense' : 'Delete Group'}
          >
            <Trash2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-4 rounded-2xl text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-md p-1 rounded-xl w-full sm:max-w-md border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'expenses'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Expenses ({expenses.length})</span>
        </button>

        {!isDirect && (
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'members'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Users className="h-4 w-4" />
            <span>
              Members ({(group?.members?.length || 0) + pendingInvitations.length})
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'settlements'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Settle Up</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Expenses Yet</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Add your first expense to start tracking and splitting costs among group members.
              </p>
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsAddExpenseOpen(true);
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            expenses.map((exp) => {
              const payer = exp.splits?.find((s) => s.paidAmount > 0);

              return (
                <div
                  key={exp.expenseId}
                  className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg truncate">
                      {exp.title}
                    </h3>

                    {exp.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{exp.description}</p>
                    )}

                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500 pt-0.5">
                      <span className="truncate">Paid by <strong className="text-slate-700 dark:text-slate-300">{payer?.user?.name || payer?.user?.email || 'Unknown'}</strong></span>
                      <span>•</span>
                      <span className="flex-shrink-0">{exp.splits?.length || 0} split members</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        ₹{Number(exp.amount).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <button
                        onClick={() => {
                          setExpenseToEdit(exp);
                          setIsAddExpenseOpen(true);
                        }}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Expense"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.expenseId)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!isDirect && activeTab === 'members' && (
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm space-y-5 sm:space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Active Group Members ({group?.members?.length || 0})
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Invite Member</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group?.members?.map((m) => {
                const bal = memberBalances[m.email] ?? 0;
                const isCurrentUser = m.email.toLowerCase() === currentUser?.email?.toLowerCase();

                return (
                  <div key={m.email} className="py-3 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {m.name || m.email}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            You
                          </span>
                        )}
                        {isDirect && !isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                            Partner
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">{m.email}</div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">Net Balance</div>
                        <div
                          className={`text-xs sm:text-sm font-extrabold ${bal > 0 ? 'text-amber-600 dark:text-amber-400' : bal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          {bal > 0 ? `+ ₹${bal.toFixed(2)}` : bal < 0 ? `- ₹${Math.abs(bal).toFixed(2)}` : '₹0.00'}
                        </div>
                      </div>

                      {!isDirect && (
                        <button
                          onClick={() => handleRemoveMember(m.email)}
                          className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invitations Section (only for non-direct groups) */}
          {!isDirect && pendingInvitations.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Pending Invitations ({pendingInvitations.length})</span>
              </h3>
              <div className="space-y-2">
                {pendingInvitations.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/20 p-2.5 sm:p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs gap-2"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{email}</span>
                    </div>
                    <span className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>Pending</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settlements' && (
        <SettlementsView
          groupId={groupId}
          members={group?.members || []}
          onBalancesUpdated={fetchGroupData}
        />
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        groupId={groupId}
        members={group?.members || []}
        expenseToEdit={expenseToEdit}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseSaved={fetchGroupData}
      />

      {!isDirect && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          groupId={groupId}
          onClose={() => setIsAddMemberOpen(false)}
          onMemberAdded={fetchGroupData}
        />
      )}
    </div>
  );
};

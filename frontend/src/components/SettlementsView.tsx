import React, { useState, useEffect } from 'react';
import { settlementService, groupService } from '../api/apiClient';
import { Transaction, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { SplitzeeLoader } from './SplitzeeLoader';
import { Calculator, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, IndianRupee, Clock } from 'lucide-react';

interface SettlementsViewProps {
  groupId: string;
  members: User[];
  onBalancesUpdated?: () => void;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({ groupId, members, onBalancesUpdated }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettlementsAndBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch computed settlements
      const txns = await settlementService.settleGroup(groupId);
      setTransactions(txns);

      // Fetch balance per member
      const balanceMap: Record<string, number> = {};
      for (const m of members) {
        try {
          const bal = await groupService.getUserBalance(groupId, m.email);
          balanceMap[m.email] = bal;
        } catch {
          balanceMap[m.email] = 0;
        }
      }
      setUserBalances(balanceMap);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to calculate settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchSettlementsAndBalances();
    }
  }, [groupId, members]);

  const handleExecute = async (txnId: string) => {
    setExecutingId(txnId);
    setError(null);
    setSuccessMsg(null);

    try {
      await settlementService.executeTransaction(txnId);
      setSuccessMsg('Payment executed and balances updated successfully!');
      fetchSettlementsAndBalances();
      if (onBalancesUpdated) onBalancesUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to execute settlement');
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-orange-600 dark:text-amber-500" />
            <span>Group Settlements & Net Balances</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Optimized minimal transactions calculated using min-flow settlement algorithm.
          </p>
        </div>

        <button
          onClick={fetchSettlementsAndBalances}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl text-sm font-semibold transition-colors border border-amber-200/60 dark:border-amber-800/60 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-4 rounded-2xl text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start space-x-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 p-4 rounded-2xl text-sm">
          <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Net Balances Overview Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 sm:mb-4">
          Individual Net Balances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m) => {
            const bal = userBalances[m.email] ?? 0;
            const isPositive = bal > 0;
            const isNegative = bal < 0;

            return (
              <div
                key={m.email}
                className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                    {m.name || m.email}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
                    {m.email}
                  </div>
                </div>
                <div
                  className={`font-extrabold text-xs sm:text-sm flex-shrink-0 ${
                    isPositive
                      ? 'text-amber-600 dark:text-amber-400'
                      : isNegative
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isPositive ? `+ ₹${bal.toFixed(2)}` : isNegative ? `- ₹${Math.abs(bal).toFixed(2)}` : '₹0.00'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Settlement Transactions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
          Suggested Settlements to Settle Up
        </h3>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <SplitzeeLoader size="md" text="Calculating optimal min-flow settlements..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">All Settled Up!</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">No outstanding balances or payments required in this group.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => {
              const isCompleted = txn.status === 'COMPLETED';

              const parseUser = (userVal: any): { email?: string; name?: string } => {
                if (!userVal) return {};
                if (typeof userVal === 'string') return { email: userVal, name: userVal };
                return { email: userVal.email, name: userVal.name };
              };

              const fromUserObj = parseUser(txn.fromUser);
              const toUserObj = parseUser(txn.toUser);

              const isPayer = !!(
                currentUser &&
                ((currentUser.email && fromUserObj.email && currentUser.email.trim().toLowerCase() === fromUserObj.email.trim().toLowerCase()) ||
                 (currentUser.name && fromUserObj.name && currentUser.name.trim().toLowerCase() === fromUserObj.name.trim().toLowerCase()))
              );

              const isReceiver = !!(
                currentUser &&
                ((currentUser.email && toUserObj.email && currentUser.email.trim().toLowerCase() === toUserObj.email.trim().toLowerCase()) ||
                 (currentUser.name && toUserObj.name && currentUser.name.trim().toLowerCase() === toUserObj.name.trim().toLowerCase()))
              );

              const fromDisplayName = fromUserObj.name || fromUserObj.email || 'Unknown';
              const toDisplayName = toUserObj.name || toUserObj.email || 'Unknown';

              return (
                <div
                  key={txn.transactionId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all gap-3 sm:gap-4 ${
                    isCompleted
                      ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
                      {fromDisplayName}
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 flex-shrink-0 text-xs">
                      <span>owes</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
                      {toDisplayName}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800/50">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      ₹{Number(txn.amount).toFixed(2)}
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : isReceiver ? (
                      <button
                        onClick={() => handleExecute(txn.transactionId)}
                        disabled={executingId === txn.transactionId}
                        className="flex items-center space-x-1 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                        title="Confirm that you have received this payment"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {executingId === txn.transactionId
                            ? 'Confirming...'
                            : 'Confirm Received'}
                        </span>
                      </button>
                    ) : isPayer ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60" title={`Pay ${toDisplayName} directly, then they will confirm receipt`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Awaiting Confirmation</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

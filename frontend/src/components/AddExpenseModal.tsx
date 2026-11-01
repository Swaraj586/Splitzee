import React, { useState, useEffect } from 'react';
import { expenseService } from '../api/apiClient';
import { User, SplitInput, Expense } from '../types';
import { X, IndianRupee, Receipt, AlertCircle, Check, Users, Trash2 } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  groupId: string;
  members: User[];
  expenseToEdit?: Expense | null;
  onClose: () => void;
  onExpenseSaved: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  groupId,
  members,
  expenseToEdit,
  onClose,
  onExpenseSaved,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedParticipantEmails, setSelectedParticipantEmails] = useState<string[]>([]);
  const [selectedPayerEmails, setSelectedPayerEmails] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');

  const [splits, setSplits] = useState<SplitInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setDescription(expenseToEdit.description || '');
      setAmount(expenseToEdit.amount);
      const participantEmails = expenseToEdit.splits.map((s) => s.user.email);
      const payers = expenseToEdit.splits.filter((s) => s.paidAmount > 0).map((s) => s.user.email);
      setSelectedParticipantEmails(
        participantEmails.length > 0 ? participantEmails : members.map((m) => m.email)
      );
      setSelectedPayerEmails(payers.length > 0 ? payers : members.length > 0 ? [members[0].email] : []);
      setSplitMode('CUSTOM');
      setSplits(
        expenseToEdit.splits.map((s) => ({
          userEmail: s.user.email,
          paidAmount: s.paidAmount,
          owedAmount: s.owedAmount,
        }))
      );
    } else {
      setTitle('');
      setDescription('');
      setAmount('');
      setSplitMode('EQUAL');
      const allEmails = members.map((m) => m.email);
      setSelectedParticipantEmails(allEmails);
      setSelectedPayerEmails(members.length > 0 ? [members[0].email] : []);
    }
  }, [expenseToEdit, isOpen, members]);

  const handleToggleParticipant = (email: string) => {
    if (selectedParticipantEmails.includes(email)) {
      if (selectedParticipantEmails.length === 1) {
        // Enforce keeping at least one member in the expense
        return;
      }
      const updatedParticipants = selectedParticipantEmails.filter((e) => e !== email);
      setSelectedParticipantEmails(updatedParticipants);

      // Keep payers list valid
      const updatedPayers = selectedPayerEmails.filter((e) => e !== email);
      if (updatedPayers.length === 0 && updatedParticipants.length > 0) {
        setSelectedPayerEmails([updatedParticipants[0]]);
      } else {
        setSelectedPayerEmails(updatedPayers);
      }

      // Filter out from splits
      setSplits((prev) => prev.filter((s) => s.userEmail !== email));
    } else {
      const updatedParticipants = [...selectedParticipantEmails, email];
      setSelectedParticipantEmails(updatedParticipants);

      if (splitMode === 'CUSTOM') {
        setSplits((prev) => [...prev, { userEmail: email, paidAmount: 0, owedAmount: 0 }]);
      }
    }
  };

  const handleTogglePayer = (email: string) => {
    // If selecting a non-participant as payer, auto-include them in participants
    if (!selectedParticipantEmails.includes(email)) {
      setSelectedParticipantEmails((prev) => [...prev, email]);
    }

    if (selectedPayerEmails.includes(email)) {
      if (selectedPayerEmails.length === 1) {
        return; // Keep at least one payer
      }
      setSelectedPayerEmails(selectedPayerEmails.filter((e) => e !== email));
    } else {
      setSelectedPayerEmails([...selectedPayerEmails, email]);
    }
  };

  const handleSelectAllParticipants = () => {
    const allEmails = members.map((m) => m.email);
    setSelectedParticipantEmails(allEmails);
  };

  const handleDeselectAllParticipants = () => {
    if (members.length > 0) {
      setSelectedParticipantEmails([members[0].email]);
      setSelectedPayerEmails([members[0].email]);
    }
  };

  // Recalculate equal splits whenever amount, selected payers, or selected participants change in EQUAL mode
  useEffect(() => {
    if (splitMode === 'EQUAL' && typeof amount === 'number' && amount > 0 && selectedParticipantEmails.length > 0) {
      const activeParticipants = members.filter((m) => selectedParticipantEmails.includes(m.email));
      if (activeParticipants.length === 0) return;

      // 1. Owed amounts (split equally among active participants)
      const perPersonOwed = Math.round((amount / activeParticipants.length) * 100) / 100;
      let totalAssignedOwed = perPersonOwed * activeParticipants.length;
      let remainderOwed = Math.round((amount - totalAssignedOwed) * 100) / 100;

      // 2. Paid amounts (split equally among selected active payers)
      const validPayers = selectedPayerEmails.filter((e) => selectedParticipantEmails.includes(e));
      const activePayers = validPayers.length > 0 ? validPayers : [activeParticipants[0].email];

      const perPayerPaid = Math.round((amount / activePayers.length) * 100) / 100;
      let totalAssignedPaid = perPayerPaid * activePayers.length;
      let remainderPaid = Math.round((amount - totalAssignedPaid) * 100) / 100;

      const newSplits = activeParticipants.map((m, idx) => {
        const isPayer = activePayers.includes(m.email);
        let paid = 0;
        if (isPayer) {
          const payerIdx = activePayers.indexOf(m.email);
          paid = payerIdx === activePayers.length - 1 ? perPayerPaid + remainderPaid : perPayerPaid;
        }

        const owed = idx === activeParticipants.length - 1 ? perPersonOwed + remainderOwed : perPersonOwed;

        return {
          userEmail: m.email,
          paidAmount: paid,
          owedAmount: owed,
        };
      });

      setSplits(newSplits);
    }
  }, [amount, selectedPayerEmails, selectedParticipantEmails, members, splitMode]);

  if (!isOpen) return null;

  const handleCustomSplitChange = (email: string, field: 'paidAmount' | 'owedAmount', val: number) => {
    const nonNegativeVal = Math.max(0, val);
    setSplits((prev) =>
      prev.map((s) => (s.userEmail === email ? { ...s, [field]: nonNegativeVal } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (selectedParticipantEmails.length === 0) {
      setError('Please select at least one participating member for this expense.');
      return;
    }

    const cleanAmount = Math.round(numAmount * 100) / 100;
    const cleanSplits = splits.map((s) => ({
      userEmail: s.userEmail,
      paidAmount: Math.round((Number(s.paidAmount) || 0) * 100) / 100,
      owedAmount: Math.round((Number(s.owedAmount) || 0) * 100) / 100,
    }));

    for (const s of cleanSplits) {
      if (s.paidAmount < 0 || s.owedAmount < 0) {
        setError('Split amounts cannot be negative');
        return;
      }
    }

    const groupMemberEmails = new Set(members.map((m) => m.email.toLowerCase()));
    for (const s of cleanSplits) {
      if (!groupMemberEmails.has(s.userEmail.toLowerCase())) {
        setError(`User ${s.userEmail} is not a member of this group`);
        return;
      }
    }

    const totalPaid = Math.round(cleanSplits.reduce((acc, s) => acc + s.paidAmount, 0) * 100) / 100;
    const totalOwed = Math.round(cleanSplits.reduce((acc, s) => acc + s.owedAmount, 0) * 100) / 100;

    if (totalPaid !== cleanAmount) {
      setError(`Total paid (₹${totalPaid.toFixed(2)}) must exactly equal expense amount (₹${cleanAmount.toFixed(2)})`);
      return;
    }
    if (totalOwed !== cleanAmount) {
      setError(`Total owed (₹${totalOwed.toFixed(2)}) must exactly equal expense amount (₹${cleanAmount.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      amount: cleanAmount,
      split: cleanSplits,
    };

    try {
      if (expenseToEdit) {
        await expenseService.editExpense(groupId, expenseToEdit.expenseId, payload);
      } else {
        await expenseService.addExpense(groupId, payload);
      }
      onExpenseSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-orange-600 dark:text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Expense Title
              </label>
              <input
                type="text"
                required
                placeholder="Dinner, Groceries, Taxi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Amount (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Add details about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
            />
          </div>

          {/* Members Involved in Expense Selection */}
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  <span>Split Between ({selectedParticipantEmails.length} of {members.length} members)</span>
                </label>
                <div className="flex items-center space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllParticipants}
                    className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllParticipants}
                    className="text-slate-500 dark:text-slate-400 font-medium hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 max-h-32 overflow-y-auto">
                {members.map((m) => {
                  const isIncluded = selectedParticipantEmails.includes(m.email);
                  return (
                    <label
                      key={m.email}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isIncluded
                          ? 'bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 shadow-sm font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => handleToggleParticipant(m.email)}
                        className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>{m.name || m.email}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Uncheck members who should be excluded from paying/sharing this expense.
              </p>
            </div>

            {/* Multi-Payer Selection Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Paid By (Select Payer(s))
              </label>
              <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 max-h-32 overflow-y-auto">
                {members.map((m) => {
                  const isChecked = selectedPayerEmails.includes(m.email);
                  return (
                    <label
                      key={m.email}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 shadow-sm font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePayer(m.email)}
                        className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>{m.name || m.email}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Select one or multiple members who paid for this expense.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Split Type
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    splitMode === 'EQUAL'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  onClick={() => setSplitMode('EQUAL')}
                >
                  Equally
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    splitMode === 'CUSTOM'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  onClick={() => setSplitMode('CUSTOM')}
                >
                  Custom Amount
                </button>
              </div>
            </div>
          </div>

          {/* Splits Table */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Member Breakdown ({splits.length} Participating)
              </h3>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {splits.map((s) => {
                const memberObj = members.find((m) => m.email === s.userEmail);
                return (
                  <div
                    key={s.userEmail}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 gap-2 text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleParticipant(s.userEmail)}
                        title="Remove member from expense"
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {memberObj?.name || s.userEmail}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 justify-end flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500 dark:text-slate-400">Paid: ₹</span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={splitMode === 'EQUAL'}
                          value={s.paidAmount}
                          onChange={(e) =>
                            handleCustomSplitChange(s.userEmail, 'paidAmount', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-right font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500 dark:text-slate-400">Owes: ₹</span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={splitMode === 'EQUAL'}
                          value={s.owedAmount}
                          onChange={(e) =>
                            handleCustomSplitChange(s.userEmail, 'owedAmount', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-right font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 text-sm flex items-center space-x-1"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

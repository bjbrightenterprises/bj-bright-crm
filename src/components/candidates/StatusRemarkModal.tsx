/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, CandidateStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { MessageSquare, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

const QUICK_CHIPS = [
  'Not reachable',
  'Call back tomorrow',
  'Interested',
  'Not interested',
  'Salary mismatch',
  'Documents pending',
  'Interview rescheduled',
  'Offer accepted',
];

interface StatusRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  newStatus?: CandidateStatus;
  isStatusChange: boolean;
  onSubmitWithRemark: (text: string) => void;
  onSkip?: () => void;
}

export const StatusRemarkModal: React.FC<StatusRemarkModalProps> = ({
  isOpen,
  onClose,
  candidate,
  newStatus,
  isStatusChange,
  onSubmitWithRemark,
  onSkip,
}) => {
  const [remarkText, setRemarkText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRequired = isStatusChange && (newStatus === 'Rejected' || newStatus === 'On Hold');

  useEffect(() => {
    if (isOpen) {
      setRemarkText('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, candidate, newStatus]);

  if (!isOpen || !candidate) return null;

  const handleChipClick = (chip: string) => {
    setRemarkText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}; ${chip}` : chip;
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = remarkText.trim();

    if (isRequired && (!trimmed || trimmed.length < 3)) {
      setError(`Remarks are mandatory (min 3 characters) when status is ${newStatus}.`);
      return;
    }

    if (trimmed && (trimmed.length < 3 || trimmed.length > 500)) {
      setError('Remark must be between 3 and 500 characters.');
      return;
    }

    setIsSubmitting(true);
    onSubmitWithRemark(trimmed);
  };

  const handleSkipAction = () => {
    if (isRequired) {
      setError(`Remarks are mandatory when status is ${newStatus}.`);
      return;
    }
    if (onSkip) {
      onSkip();
    } else {
      onSubmitWithRemark('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isStatusChange ? `Update Status: ${candidate.status} → ${newStatus}` : `Add Remark for ${candidate.fullName}`}
      subtitle={isStatusChange && isRequired ? '⚠️ Mandatory remark required for this status change' : 'Record notes, reasons, or next follow-up details'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isStatusChange && isRequired && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A reason/remark is strictly required when setting candidate status to <strong>{newStatus}</strong>.
            </span>
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Quick-Pick Reason Chips:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Remark / Reason {isRequired ? '*' : '(Optional)'}
            </label>
            <span className={`text-[10px] ${remarkText.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
              {remarkText.length}/500 chars (min 3)
            </span>
          </div>
          <textarea
            rows={3}
            value={remarkText}
            onChange={(e) => {
              setRemarkText(e.target.value);
              setError('');
            }}
            placeholder="Type remark or select chips above (e.g. Candidate accepted another offer in Noida Sector 62)..."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            maxLength={500}
            required={isRequired}
          />
          {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          {!isRequired && (
            <button
              type="button"
              onClick={handleSkipAction}
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Skip & Update
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>{isSubmitting ? 'Saving...' : 'Save Remark'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

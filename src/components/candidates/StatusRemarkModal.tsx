/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, CandidateStatus } from '../../types/crm';
import { MessageSquare, AlertTriangle } from 'lucide-react';

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      subtitle={isStatusChange && isRequired ? 'Mandatory remark required for this status change' : 'Record notes, reasons, or next follow-up details'}
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2 flex-wrap w-full">
          {!isRequired && (
            <button
              type="button"
              onClick={handleSkipAction}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2 font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Skip & Update
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="min-h-[44px] px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#F5A623]" />
            <span>{isSubmitting ? 'Saving...' : 'Save Remark'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-900">
        {isStatusChange && isRequired && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>
              A reason/remark is strictly required when setting candidate status to <strong>{newStatus}</strong>.
            </span>
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-800 mb-2">
            Quick-Pick Reason Chips:
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="min-h-[40px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-slate-800">
              Remark / Reason {isRequired ? '*' : '(Optional)'}
            </label>
            <span className={`text-xs ${remarkText.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
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
            className="w-full p-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            maxLength={500}
            required={isRequired}
          />
          {error && <p className="text-xs text-rose-600 font-bold mt-1">{error}</p>}
        </div>
      </form>
    </Modal>
  );
};

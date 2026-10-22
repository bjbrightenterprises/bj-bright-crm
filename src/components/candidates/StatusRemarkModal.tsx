import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';

interface StatusRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remark?: string) => void;
  candidateName: string;
  oldStatus: string;
  newStatus: string;
  count?: number;
}

export const StatusRemarkModal: React.FC<StatusRemarkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  oldStatus,
  newStatus,
  count,
}) => {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const isMandatory = newStatus === 'Rejected' || newStatus === 'On Hold';

  useEffect(() => {
    if (isOpen) {
      setRemark('');
      setError('');
    }
  }, [isOpen, newStatus]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = remark.trim();
    if (isMandatory && !trimmed) {
      setError(`Remark is mandatory when setting status to "${newStatus}".`);
      return;
    }
    onConfirm(trimmed || undefined);
  };

  const handleSkip = () => {
    if (isMandatory) return;
    onConfirm(undefined);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add remark for this status change"
      subtitle={
        count && count > 1
          ? `Updating status for ${count} candidates`
          : `Candidate: ${candidateName}`
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Status Transition Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {oldStatus || 'Current'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5A623]" />
            <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-[#0B1F4B]/10 dark:bg-amber-400/10 text-[#0B1F4B] dark:text-amber-300">
              {newStatus}
            </span>
          </div>

          {isMandatory && (
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Mandatory Remark
            </span>
          )}
        </div>

        {/* Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Status Change Remark {isMandatory && <span className="text-rose-500">*</span>}
            </label>
            <span
              className={`text-[10px] font-mono ${
                remark.length > 280 ? 'text-rose-500 font-bold' : 'text-slate-400'
              }`}
            >
              {remark.length}/300
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={300}
            autoFocus
            value={remark}
            onChange={(e) => {
              setRemark(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              isMandatory
                ? `Enter reason for ${newStatus} (e.g. salary expectation mismatch, client budget freeze)...`
                : 'Optional remark (e.g. cleared technical round 1, awaiting manager review)...'
            }
            className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] dark:focus:ring-[#F5A623] resize-none ${
              error
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {error && <p className="text-[11px] text-rose-500 mt-1 font-medium">{error}</p>}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isMandatory && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Skip Remark
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0B1F4B] hover:bg-[#163270] dark:bg-[#F5A623] dark:hover:bg-amber-500 text-white dark:text-slate-950 shadow-xs transition-colors cursor-pointer"
            >
              Save Status
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

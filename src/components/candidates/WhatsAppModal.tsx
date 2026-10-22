import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Candidate, WhatsAppTemplate } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  normalizeWhatsAppNumber,
  replaceTemplatePlaceholders,
  suggestTemplateForStatus,
} from '../../lib/whatsappTemplates';
import { MessageSquare, Send, AlertCircle, Phone, User, CheckCircle2, Sparkles } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const { companySettings, currentUser, addCandidateNote, logActivity } = useCRM();

  const templates: WhatsAppTemplate[] =
    companySettings.whatsappTemplates && companySettings.whatsappTemplates.length > 0
      ? companySettings.whatsappTemplates
      : DEFAULT_WHATSAPP_TEMPLATES;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('intro');
  const [messageText, setMessageText] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  useEffect(() => {
    if (candidate && isOpen) {
      const suggestedId = suggestTemplateForStatus(candidate.status);
      const matched = templates.find((t) => t.id === suggestedId) || templates[0];
      setSelectedTemplateId(matched?.id || 'intro');
      if (matched) {
        setMessageText(
          replaceTemplatePlaceholders(matched.body, candidate, currentUser.name)
        );
      }
      setSuccessNotice(false);
    }
  }, [candidate, isOpen, currentUser.name, templates]);

  if (!candidate) return null;

  const { valid, normalized, error: phoneError } = normalizeWhatsAppNumber(candidate.phone);

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setMessageText(
        replaceTemplatePlaceholders(tmpl.body, candidate, currentUser.name)
      );
    }
  };

  const handleSend = () => {
    if (!valid || !messageText.trim()) return;

    const chosenTmpl = templates.find((t) => t.id === selectedTemplateId);
    const tmplTitle = chosenTmpl ? chosenTmpl.title : 'Custom message';

    // 1. Open WhatsApp click-to-chat
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(messageText.trim())}`;
    window.open(url, '_blank');

    // 2. Add Candidate Note and Activity Log
    addCandidateNote(
      candidate.id,
      `WhatsApp message sent (${tmplTitle}): "${messageText.trim().slice(0, 150)}${messageText.length > 150 ? '...' : ''}"`
    );
    logActivity(
      'candidate',
      'WhatsApp Message Sent',
      `Sent WhatsApp message to ${candidate.fullName} (${tmplTitle})`
    );

    setSuccessNotice(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Message"
      subtitle="Click-to-chat WhatsApp direct messaging"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Recipient Details Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidate.fullName}</span>
                {candidate.jobTitle && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    ({candidate.jobTitle})
                  </span>
                )}
              </p>
              <p className="text-slate-500 flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{candidate.phone}</span>
                {valid && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans ml-1">
                    (wa.me/+{normalized})
                  </span>
                )}
              </p>
            </div>
          </div>

          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 self-start sm:self-center">
            Status: {candidate.status}
          </span>
        </div>

        {/* Invalid Phone Warning */}
        {!valid && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{phoneError || 'Invalid WhatsApp phone number.'}</span>
          </div>
        )}

        {/* Template Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Message Template</span>
            </label>
            <span className="text-[10px] text-slate-400">
              Auto-suggested for &ldquo;{candidate.status}&rdquo;
            </span>
          </div>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            {templates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.title}
              </option>
            ))}
          </select>
        </div>

        {/* Editable Message Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Message Preview / Editable Text
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {messageText.length} chars
            </span>
          </div>
          <textarea
            rows={5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your WhatsApp message..."
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none font-sans"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Recruiter can edit any part of the message before opening WhatsApp. Placeholders have been pre-filled automatically.
          </p>
        </div>

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Opening WhatsApp and logged activity entry!</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || !messageText.trim()}
            onClick={handleSend}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

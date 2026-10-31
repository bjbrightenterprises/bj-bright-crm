import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  Client,
  ClientContactPerson,
  ClientSection,
  CLIENT_SECTION_LABELS,
  getClientSection,
  sectionToClientStatus,
} from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Plus, Trash2, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  findSimilarCompanies,
  getSectionBadgeMeta,
} from '../../lib/companySearch';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  initialName?: string;
  onOpenExistingClient?: (client: Client) => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  initialName = '',
  onOpenExistingClient,
}) => {
  const { addClient, updateClient, visibleClients, users, companySettings, currentUser } = useCRM();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Information Technology & Services');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Noida');
  const [website, setWebsite] = useState('https://');
  const [section, setSection] = useState<ClientSection>('Green');
  const [enquiryDate, setEnquiryDate] = useState(todayStr);
  const [lastContactedDate, setLastContactedDate] = useState(todayStr);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [agreementSignedDate, setAgreementSignedDate] = useState(todayStr);
  const [agreementDetails, setAgreementDetails] = useState('');
  const [commissionPercent, setCommissionPercent] = useState<number>(8.33);
  const [paymentTerms, setPaymentTerms] = useState('45 days from candidate joining date');
  const [assignedAccountManagerId, setAssignedAccountManagerId] = useState(currentUser.id);
  const [initialRemark, setInitialRemark] = useState('');
  const [editReason, setEditReason] = useState('');
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactPersons, setContactPersons] = useState<ClientContactPerson[]>([
    {
      id: 'cp_temp_1',
      name: '',
      designation: 'HR Lead / Manager',
      phone: '',
      email: '',
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (clientToEdit) {
      const sec = getClientSection(clientToEdit);
      setName(clientToEdit.name);
      setIndustry(clientToEdit.industry);
      setAddress(clientToEdit.address);
      setCity(clientToEdit.city);
      setWebsite(clientToEdit.website || 'https://');
      setSection(sec);
      setEnquiryDate(clientToEdit.enquiryDate || clientToEdit.createdAt?.slice(0, 10) || today);
      setLastContactedDate(clientToEdit.lastContactedDate || '');
      setNextFollowUpDate(clientToEdit.nextFollowUpDate || '');
      setAgreementSignedDate(
        clientToEdit.agreementSignedDate ||
          (sec === 'Green' ? clientToEdit.createdAt?.slice(0, 10) || today : '')
      );
      setAgreementDetails(clientToEdit.agreementDetails || '');
      setCommissionPercent(clientToEdit.commissionPercent);
      setPaymentTerms(clientToEdit.paymentTerms);
      setAssignedAccountManagerId(clientToEdit.assignedAccountManagerId || currentUser.id);
      setContactPersons(
        clientToEdit.contactPersons.length > 0
          ? clientToEdit.contactPersons
          : [{ id: 'cp_1', name: '', designation: 'HR Lead', phone: '', email: '' }]
      );
      setInitialRemark('');
      setEditReason('');
      setConfirmDuplicate(false);
    } else {
      setName(initialName || '');
      setIndustry(companySettings.availableIndustries[0] || 'Information Technology & Services');
      setAddress('');
      setCity('Noida');
      setWebsite('https://');
      setSection('Green');
      setEnquiryDate(today);
      setLastContactedDate(today);
      setNextFollowUpDate('');
      setAgreementSignedDate(today);
      setAgreementDetails('Standard SLA agreement for corporate recruitment.');
      setCommissionPercent(8.33);
      setPaymentTerms('45 days from candidate joining date');
      setAssignedAccountManagerId(currentUser.id);
      setContactPersons([{ id: 'cp_1', name: '', designation: 'HR Lead', phone: '', email: '' }]);
      setInitialRemark('');
      setEditReason('');
      setConfirmDuplicate(false);
    }
    setErrors({});
    setIsSubmitting(false);
  }, [clientToEdit, isOpen, initialName, currentUser, companySettings.availableIndustries]);

  // Live check for same or similar company name, phone, or email
  const similarMatches = React.useMemo(() => {
    if (clientToEdit) return [];
    return findSimilarCompanies(
      visibleClients,
      {
        name,
        phones: contactPersons.map((cp) => cp.phone),
        emails: contactPersons.map((cp) => cp.email),
      },
      undefined
    );
  }, [visibleClients, name, contactPersons, clientToEdit]);

  if (currentUser.role === 'recruiter') return null;

  const handleAddContact = () => {
    setContactPersons([
      ...contactPersons,
      {
        id: `cp_${Date.now()}`,
        name: '',
        designation: '',
        phone: '',
        email: '',
      },
    ]);
  };

  const handleUpdateContact = (index: number, field: keyof ClientContactPerson, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
    if (field === 'phone' || field === 'email') {
      setConfirmDuplicate(false);
    }
  };

  const handleRemoveContact = (index: number) => {
    if (contactPersons.length <= 1) return;
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const isValidUrl = (urlStr: string): boolean => {
    try {
      const parsed = new URL(urlStr);
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname.includes('.')
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    const trimmedWebsite = website.trim();
    const trimmedTerms = paymentTerms.trim();
    const today = new Date().toISOString().slice(0, 10);

    // 1. Company name required (and on Edit, unique; on Add, live similarity warning requires confirmation tick)
    if (!trimmedName) {
      newErrors.name = 'Company name is required.';
    } else if (clientToEdit) {
      const duplicate = visibleClients.find(
        (c) =>
          c.id !== clientToEdit.id &&
          c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        newErrors.name = `A company named "${duplicate.name}" already exists.`;
      }
    } else if (similarMatches.length > 0 && !confirmDuplicate) {
      newErrors.confirmDuplicate =
        'A company with a similar name, phone, or email already exists. Please tick the confirmation box to continue.';
    }

    if (!trimmedCity) {
      newErrors.city = 'City is required.';
    }

    // 2. Website URL (optional if left empty or default 'https://', otherwise must be valid URL)
    const hasCustomWebsite =
      trimmedWebsite.length > 0 &&
      trimmedWebsite !== 'https://' &&
      trimmedWebsite !== 'http://';
    if (hasCustomWebsite && !isValidUrl(trimmedWebsite)) {
      newErrors.website = 'Enter a valid website or Google Maps URL (e.g. https://company.com).';
    }

    // 3. Date validations (cannot be in the future except Next Follow-up Date)
    if (!enquiryDate) {
      newErrors.enquiryDate = 'Enquiry Received date is required.';
    } else if (enquiryDate > today) {
      newErrors.enquiryDate = 'Enquiry Received date cannot be in the future.';
    }

    if (lastContactedDate && lastContactedDate > today) {
      newErrors.lastContactedDate = 'Last Contacted date cannot be in the future.';
    }

    if (section === 'Blue' && !lastContactedDate) {
      newErrors.lastContactedDate = 'Last Contacted date is required for companies In Discussion.';
    }

    if (section === 'Green') {
      if (!agreementSignedDate) {
        newErrors.agreementSignedDate = 'Agreement Signed date is required for Active Clients.';
      } else {
        if (agreementSignedDate > today) {
          newErrors.agreementSignedDate = 'Agreement Signed date cannot be in the future.';
        } else if (enquiryDate && agreementSignedDate < enquiryDate) {
          newErrors.agreementSignedDate =
            'Agreement Signed date cannot be before the Enquiry Received date.';
        }
      }
    }

    // 4. Contact persons validation (phone 10 digits starting 6-9, valid email)
    const normalizedContacts: ClientContactPerson[] = [];
    contactPersons.forEach((cp, idx) => {
      const cpName = cp.name.trim();
      const cpDesignation = cp.designation.trim() || 'HR Contact';
      const rawDigits = cp.phone.replace(/\D/g, '');
      const phone10 = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
      const cpEmail = cp.email.trim().toLowerCase();

      if (!cpName && idx === 0) {
        newErrors[`cp_name_${idx}`] = 'Primary contact person name is required.';
      }
      if (cpName || cp.phone.trim() || cpEmail) {
        if (!cpName) {
          newErrors[`cp_name_${idx}`] = 'Contact name is required.';
        }
        if (!/^[6-9]\d{9}$/.test(phone10)) {
          newErrors[`cp_phone_${idx}`] = 'Phone must be 10 digits starting with 6-9.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cpEmail)) {
          newErrors[`cp_email_${idx}`] = 'Enter a valid email address.';
        }
        normalizedContacts.push({
          id: cp.id || `cp_${Date.now()}_${idx}`,
          name: cpName,
          designation: cpDesignation,
          phone: phone10,
          email: cpEmail,
        });
      }
    });

    // 5. Optional first remark on Add / Compulsory edit reason on Edit
    if (!clientToEdit && initialRemark.trim().length > 0) {
      if (initialRemark.trim().length < 3 || initialRemark.trim().length > 500) {
        newErrors.initialRemark = 'First remark must be between 3 and 500 characters.';
      }
    }

    if (clientToEdit) {
      if (editReason.trim().length < 10) {
        newErrors.editReason =
          'Reason for this edit is compulsory and must be at least 10 characters.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const assignedUser = users.find((u) => u.id === assignedAccountManagerId);

    if (clientToEdit) {
      updateClient(
        clientToEdit.id,
        {
          name: trimmedName,
          industry,
          address: trimmedAddress,
          city: trimmedCity,
          website: trimmedWebsite,
          section,
          status: sectionToClientStatus(section),
          enquiryDate,
          lastContactedDate: lastContactedDate || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          agreementSignedDate: section === 'Green' ? agreementSignedDate : undefined,
          agreementDetails: agreementDetails.trim(),
          commissionPercent: Number(commissionPercent),
          paymentTerms: trimmedTerms,
          assignedAccountManagerId,
          assignedAccountManagerName: assignedUser?.name || currentUser.name,
          contactPersons: normalizedContacts,
        },
        editReason.trim()
      );
    } else {
      addClient(
        {
          name: trimmedName,
          industry,
          address: trimmedAddress,
          city: trimmedCity,
          website: trimmedWebsite,
          section,
          status: sectionToClientStatus(section),
          enquiryDate,
          lastContactedDate: lastContactedDate || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          agreementSignedDate: section === 'Green' ? agreementSignedDate : undefined,
          agreementDetails: agreementDetails.trim(),
          commissionPercent: Number(commissionPercent),
          paymentTerms: trimmedTerms,
          assignedAccountManagerId,
          assignedAccountManagerName: assignedUser?.name || currentUser.name,
          contactPersons: normalizedContacts,
        },
        initialRemark.trim()
      );
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Company Details' : 'Add New Company'}
      subtitle="BJ Bright Enterprises • Corporate Client Management"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Tata Consultancy Services (TCS), HCLTech, Jubilant FoodWorks"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setConfirmDuplicate(false);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.name && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.name}</p>}
          </div>

          {/* Section (Green / Blue / Red) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Section *
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as ClientSection)}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="Green">GREEN — {CLIENT_SECTION_LABELS.Green} (Agreement Signed)</option>
              <option value="Blue">BLUE — {CLIENT_SECTION_LABELS.Blue} (Spoken, No Agreement Yet)</option>
              <option value="Red">RED — {CLIENT_SECTION_LABELS.Red} (Enquiry Received)</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Industry *
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {companySettings.availableIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              City *
            </label>
            <input
              type="text"
              placeholder="e.g. Noida, Greater Noida, Gurugram"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.city && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.city}</p>}
          </div>

          {/* Website */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Website URL *
            </label>
            <input
              type="text"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.website && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.website}</p>}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Office Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot A-44/45, Sector 62, Noida"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Dates Row */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Enquiry Received Date *
            </label>
            <input
              type="date"
              max={todayStr}
              value={enquiryDate}
              onChange={(e) => setEnquiryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.enquiryDate && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.enquiryDate}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Last Contacted Date {section === 'Blue' ? '*' : ''}
            </label>
            <input
              type="date"
              max={todayStr}
              value={lastContactedDate}
              onChange={(e) => setLastContactedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.lastContactedDate && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.lastContactedDate}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Next Follow-up Date
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {section === 'Green' && (
            <div>
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                Agreement Signed Date * (Active Clients)
              </label>
              <input
                type="date"
                max={todayStr}
                min={enquiryDate || undefined}
                value={agreementSignedDate}
                onChange={(e) => setAgreementSignedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {errors.agreementSignedDate && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  {errors.agreementSignedDate}
                </p>
              )}
            </div>
          )}

          {/* Commission % */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Commission (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="50"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              placeholder="e.g. 45 days from joining date, 30 days net"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Company JD / Hiring Requirement Details */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Company JD / Current Hiring Requirements & Agreement Details
            </label>
            <textarea
              rows={4}
              placeholder="Enter complete Job Description (JD), Role, Eligibility & Skills, Salary & Incentives, Working Hours / Shift, Interview Timings, etc..."
              value={agreementDetails}
              onChange={(e) => setAgreementDetails(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B] leading-relaxed"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Tip: Separate key points with "|" or new lines for clean display on the company card and profile.
            </span>
          </div>
        </div>

        {/* Contact Persons Subsection */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Contact Persons (Name, Designation, 10-digit Phone starting 6-9, Email) *
            </label>
            <button
              type="button"
              onClick={handleAddContact}
              className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact Person</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {contactPersons.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Person Name *"
                    value={contact.name}
                    onChange={(e) => handleUpdateContact(idx, 'name', e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={contact.designation}
                    onChange={(e) => handleUpdateContact(idx, 'designation', e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="10-digit Phone (6-9) *"
                    value={contact.phone}
                    onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      placeholder="Email *"
                      value={contact.email}
                      onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    {contactPersons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {(errors[`cp_name_${idx}`] ||
                  errors[`cp_phone_${idx}`] ||
                  errors[`cp_email_${idx}`]) && (
                  <div className="flex flex-wrap gap-3 text-[11px] text-rose-600 font-semibold">
                    {errors[`cp_name_${idx}`] && <span>• {errors[`cp_name_${idx}`]}</span>}
                    {errors[`cp_phone_${idx}`] && <span>• {errors[`cp_phone_${idx}`]}</span>}
                    {errors[`cp_email_${idx}`] && <span>• {errors[`cp_email_${idx}`]}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Duplicate / Similar Company Warning (when adding a new company) */}
        {!clientToEdit && similarMatches.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-amber-950 dark:text-amber-200">
                  Similar or matching company already exists ({similarMatches.length} found)
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Please check the existing company below before adding a duplicate record.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {similarMatches.map(({ client, reasons }) => {
                const badge = getSectionBadgeMeta(client);
                const mainContact = client.contactPersons?.[0];
                return (
                  <div
                    key={client.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {client.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-slate-500">{client.city}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Contact: {mainContact?.name || '-'} ({mainContact?.phone || '-'})
                      </p>
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                        Match: {reasons.join(' • ')}
                      </p>
                    </div>

                    {onOpenExistingClient && (
                      <button
                        type="button"
                        onClick={() => onOpenExistingClient(client)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>Open Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmDuplicate}
                onChange={(e) => {
                  setConfirmDuplicate(e.target.checked);
                  if (e.target.checked) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.confirmDuplicate;
                      return next;
                    });
                  }
                }}
                className="w-4 h-4 rounded border-amber-400 text-[#0B1F4B] focus:ring-[#0B1F4B]"
              />
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                I confirm this is a separate company and want to add it anyway *
              </span>
            </label>
            {errors.confirmDuplicate && (
              <p className="text-[11px] text-rose-600 font-semibold">{errors.confirmDuplicate}</p>
            )}
          </div>
        )}

        {/* Optional First Remark (when adding) OR Compulsory Reason for Edit (when editing) */}
        {!clientToEdit ? (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              First Remark (Optional — 3 to 500 characters)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g. Spoke with HR Head regarding Q4 hiring requirements..."
              value={initialRemark}
              onChange={(e) => setInitialRemark(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.initialRemark && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.initialRemark}</p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <label className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Reason for this edit * (Minimum 10 characters — saved permanently in Edit History)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Describe why these company details are being updated (minimum 10 characters)..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.editReason ? (
                <p className="text-[11px] text-rose-600 font-semibold">{errors.editReason}</p>
              ) : (
                <span className="text-[10px] text-slate-500">
                  Recorded permanently with your name, timestamp, old value, and new value.
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-400">
                {editReason.trim().length}/10 min
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!clientToEdit && similarMatches.length > 0 && !confirmDuplicate)}
            className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : clientToEdit ? 'Save Changes' : 'Add Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

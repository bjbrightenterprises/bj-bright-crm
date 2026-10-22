import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Client, ClientContactPerson, ClientStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Plus, Trash2, Building2 } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { addClient, updateClient, users, companySettings, currentUser } = useCRM();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Information Technology & Services');
  const [address, setAddress] = useState('Sector 62');
  const [city, setCity] = useState('Noida');
  const [website, setWebsite] = useState('https://');
  const [agreementDetails, setAgreementDetails] = useState('');
  const [commissionPercent, setCommissionPercent] = useState<number>(8.33);
  const [paymentTerms, setPaymentTerms] = useState('45 days from candidate joining date');
  const [status, setStatus] = useState<ClientStatus>('Active');
  const [assignedAccountManagerId, setAssignedAccountManagerId] = useState(currentUser.id);

  const [contactPersons, setContactPersons] = useState<ClientContactPerson[]>([
    {
      id: 'cp_temp_1',
      name: '',
      designation: 'HR Lead / Manager',
      phone: '+91 ',
      email: '',
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setIndustry(clientToEdit.industry);
      setAddress(clientToEdit.address);
      setCity(clientToEdit.city);
      setWebsite(clientToEdit.website);
      setAgreementDetails(clientToEdit.agreementDetails);
      setCommissionPercent(clientToEdit.commissionPercent);
      setPaymentTerms(clientToEdit.paymentTerms);
      setStatus(clientToEdit.status);
      setAssignedAccountManagerId(clientToEdit.assignedAccountManagerId);
      setContactPersons(
        clientToEdit.contactPersons.length > 0
          ? clientToEdit.contactPersons
          : [{ id: 'cp_1', name: '', designation: 'HR Lead', phone: '+91 ', email: '' }]
      );
    } else {
      setName('');
      setIndustry('Information Technology & Services');
      setAddress('Sector 62');
      setCity('Noida');
      setWebsite('https://');
      setAgreementDetails('Standard SLA agreement for corporate recruitment.');
      setCommissionPercent(8.33);
      setPaymentTerms('45 days from candidate joining date');
      setStatus('Active');
      setAssignedAccountManagerId(currentUser.id);
      setContactPersons([{ id: 'cp_1', name: '', designation: 'HR Lead', phone: '+91 ', email: '' }]);
    }
    setErrors({});
  }, [clientToEdit, isOpen, currentUser]);

  const handleAddContact = () => {
    setContactPersons([
      ...contactPersons,
      {
        id: `cp_${Date.now()}`,
        name: '',
        designation: '',
        phone: '+91 ',
        email: '',
      },
    ]);
  };

  const handleUpdateContact = (index: number, field: keyof ClientContactPerson, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const handleRemoveContact = (index: number) => {
    if (contactPersons.length <= 1) return;
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Company name is required';
    if (!city.trim()) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const assignedUser = users.find((u) => u.id === assignedAccountManagerId);

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name: name.trim(),
        industry,
        address: address.trim(),
        city: city.trim(),
        website: website.trim(),
        agreementDetails: agreementDetails.trim(),
        commissionPercent: Number(commissionPercent),
        paymentTerms: paymentTerms.trim(),
        status,
        assignedAccountManagerId,
        assignedAccountManagerName: assignedUser?.name || currentUser.name,
        contactPersons: contactPersons.filter((cp) => cp.name.trim().length > 0),
      });
    } else {
      addClient({
        name: name.trim(),
        industry,
        address: address.trim(),
        city: city.trim(),
        website: website.trim(),
        agreementDetails: agreementDetails.trim(),
        commissionPercent: Number(commissionPercent),
        paymentTerms: paymentTerms.trim(),
        status,
        assignedAccountManagerId,
        assignedAccountManagerName: assignedUser?.name || currentUser.name,
        contactPersons: contactPersons.filter((cp) => cp.name.trim().length > 0),
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Client Company' : 'Onboard New Corporate Client'}
      subtitle="BJ Bright Enterprises • Corporate Partnership Details"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Tata Consultancy Services (TCS), Paytm, Jubilant FoodWorks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Industry */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Industry Vertical
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

          {/* Website */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Company Website URL
            </label>
            <input
              type="url"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              City / NCR Hub *
            </label>
            <input
              type="text"
              placeholder="e.g. Noida, Greater Noida, Gurugram"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Address */}
          <div>
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

          {/* Commission % */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Placement Fee / Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="35"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 8.33)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
            <span className="text-[10px] text-slate-400">Standard Indian industry rate is 8.33% (1 month CTC)</span>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Payment Terms SLA
            </label>
            <input
              type="text"
              placeholder="e.g. 45 days from joining date, 30 days net"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Partnership Status */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Assigned Account Manager */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Key Account Manager
            </label>
            <select
              value={assignedAccountManagerId}
              onChange={(e) => setAssignedAccountManagerId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Agreement details */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Agreement & Contract SLA Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Tier-1 vendor partner, replacement guarantee 90 days, exclusive IT mandates."
              value={agreementDetails}
              onChange={(e) => setAgreementDetails(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>
        </div>

        {/* Contact Persons Subsection */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Client Contact Persons (HR, TA Heads, Hiring Managers)
            </label>
            <button
              type="button"
              onClick={handleAddContact}
              className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact Person</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {contactPersons.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
              >
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
                  placeholder="Phone (+91)"
                  value={contact.phone}
                  onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    placeholder="Email"
                    value={contact.email}
                    onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  {contactPersons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold shadow-md transition-colors"
          >
            {clientToEdit ? 'Save Changes' : 'Save Client Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

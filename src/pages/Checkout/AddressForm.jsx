import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateAddressForm } from '../../utils/validations';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { ShieldCheck } from 'lucide-react';

const AddressForm = ({ onSubmit, loading = false }) => {
  const { profile, user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState({});

  // Load from sessionStorage or fallback to profile
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('checkout_address_form');
      if (saved) {
        setFormData(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error('Error loading saved checkout form:', e);
    }

    if (profile) {
      const dbAddress = profile.address || {};
      setFormData({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        addressLine: dbAddress.addressLine || '',
        city: dbAddress.city || '',
        state: dbAddress.state || '',
        postalCode: dbAddress.postalCode || ''
      });
    }
  }, [profile, user]);

  // Save form state to sessionStorage on change
  useEffect(() => {
    if (formData.name || formData.addressLine || formData.phone) {
      sessionStorage.setItem('checkout_address_form', JSON.stringify(formData));
    }
  }, [formData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const validation = validateAddressForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    sessionStorage.removeItem('checkout_address_form');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 font-sans tracking-wide">
        Shipping Address
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Full Name"
          id="name"
          placeholder="Recipient Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          disabled={loading}
        />

        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          disabled={loading}
        />

        <Input
          label="Mobile Number"
          id="phone"
          placeholder="10-digit number"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
          disabled={loading}
        />
      </div>

      <Input
        label="Street Address"
        id="addressLine"
        placeholder="Flat, House no., Building, Company, Street"
        value={formData.addressLine}
        onChange={handleChange}
        error={errors.addressLine}
        required
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="City"
          id="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
          required
          disabled={loading}
        />

        <Input
          label="State"
          id="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          error={errors.state}
          required
          disabled={loading}
        />

        <Input
          label="Postal Code (PIN)"
          id="postalCode"
          placeholder="6-digit ZIP"
          value={formData.postalCode}
          onChange={handleChange}
          error={errors.postalCode}
          required
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        className="w-full mt-4"
        loading={loading}
        disabled={loading}
      >
        Deliver to this Address
      </Button>

      <div className="flex items-center justify-center space-x-1.5 pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Your data is securely stored for order processing</span>
      </div>
    </form>
  );
};

export default AddressForm;

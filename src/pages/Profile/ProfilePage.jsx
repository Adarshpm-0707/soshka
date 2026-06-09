import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { validatePhone, validateZipCode } from '../../utils/validations';
import { showToast } from '../../components/Reusable/Toast';
import { User, Phone, MapPin, Upload, Camera, ShieldAlert } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, updateProfile, uploadAvatar } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync state with profile once loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      const addr = profile.address || {};
      setAddressLine(addr.addressLine || '');
      setCity(addr.city || '');
      setState(addr.state || '');
      setPostalCode(addr.postalCode || '');
    }
  }, [profile]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File limit check (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be under 2MB.', 'error');
      return;
    }

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      showToast('Avatar updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Avatar upload failed. Make sure bucket avatars is public.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (phone && !validatePhone(phone)) newErrors.phone = 'Please enter a valid 10-digit phone number.';
    if (postalCode && !validateZipCode(postalCode)) newErrors.postalCode = 'Please enter a valid 6-digit postal code.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix validation errors.', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: {
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim()
        }
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Error updating profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Loader fullScreen text="Loading user profile..." />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      {/* Required SectionTitle */}
      <SectionTitle
        title="Account Settings"
        subtitle="Manage your personal details, configure shipping addresses, and upload profile pictures."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Left Side: Avatar Upload details */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center h-fit">
          <div className="relative group cursor-pointer mb-4">
            {avatarLoading ? (
              <div className="h-28 w-28 rounded-full border border-slate-200 dark:border-slate-750 flex items-center justify-center">
                <Loader size="sm" />
              </div>
            ) : (
              <>
                <img
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt="Profile Avatar"
                  className="h-28 w-28 rounded-full object-cover border-2 border-primary-500 dark:border-primary-600 shadow-sm group-hover:brightness-75 transition"
                />
                <label
                  htmlFor="avatar-file"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full bg-black/40 text-white cursor-pointer"
                >
                  <Camera size={20} />
                </label>
                <input
                  type="file"
                  id="avatar-file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white font-sans text-base">{profile.name}</h4>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 truncate mt-0.5 max-w-[200px]">{user?.email}</p>
          </div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-4">
            Click avatar to upload image
          </span>
        </div>

        {/* Right Side: Form inputs */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-sm">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                disabled={loading}
              />

              <Input
                label="Mobile Phone"
                id="phone"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                disabled={loading}
              />
            </div>

            <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 pt-4 uppercase tracking-wider text-sm">
              Default Shipping Address
            </h3>

            <Input
              label="Street Address"
              id="addressLine"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loading}
              />

              <Input
                label="State"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={loading}
              />

              <Input
                label="ZIP / Postal Code"
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                error={errors.postalCode}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
              loading={loading}
              disabled={loading}
            >
              Save Details
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

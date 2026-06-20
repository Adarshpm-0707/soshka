import React, { useState, useEffect } from 'react';
import { paymentSettingsService } from '../../services/paymentSettingsService';
import { ShieldAlert, CreditCard, Lock, Eye, EyeOff, Loader2, Save, Calendar, CheckCircle } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const PaymentSettingsPage = () => {
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for the selected gateway
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Toggle eye show secret
  const [showSecret, setShowSecret] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await paymentSettingsService.fetchPaymentSettings();
      setSettingsList(data || []);
      
      // Load selected gateway settings into form if they exist
      const existing = data.find(s => s.gateway === selectedGateway);
      if (existing) {
        setApiKey(existing.api_key || '');
        setApiSecret(existing.api_secret || '');
        setIsActive(existing.is_active !== false);
      } else {
        setApiKey('');
        setApiSecret('');
        setIsActive(true);
      }
    } catch (err) {
      console.error('Error loading payment configurations:', err);
      showToast(err.message || 'Error loading payment settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [selectedGateway]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = settingsList.find(s => s.gateway === selectedGateway);
      const payload = {
        id: existing?.id || null,
        gateway: selectedGateway,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        is_active: isActive
      };

      await paymentSettingsService.updatePaymentSettings(payload);
      showToast(`${selectedGateway.toUpperCase()} payment configurations updated successfully!`, 'success');
      await fetchSettings();
    } catch (err) {
      console.error('Error saving payment settings:', err);
      showToast(err.message || 'Failed to update payment configurations.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentSettings = settingsList.find(s => s.gateway === selectedGateway);

  return (
    <div className="space-y-6 text-white max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Payment Gateways Settings</h1>
        <p className="text-slate-450 text-xs mt-1 font-semibold">
          Configure API credentials, public/private secret keys, and status triggers for transaction providers.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-500/20 text-amber-300 rounded-2xl text-xs font-semibold leading-relaxed">
        <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="font-bold text-amber-200">Critical Access Control Notice</p>
          <p className="text-amber-400/80 mt-0.5">
            Only verified Super Administrators have RLS clearance to modify these keys. All changes are logged globally inside the security audit trails.
          </p>
        </div>
      </div>

      {/* Settings Form Wrapper */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Retrieving credentials safely...</p>
        </div>
      ) : (
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 text-[#ff2a85] border-b border-[#1c1c1e] pb-4">
            <CreditCard size={22} />
            <h2 className="text-sm uppercase font-extrabold tracking-widest text-slate-200">Gateway configuration</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Choose Gateway */}
            <div className="space-y-1.5">
              <label htmlFor="gtw-type" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Payment Provider
              </label>
              <select
                id="gtw-type"
                value={selectedGateway}
                onChange={(e) => {
                  setSelectedGateway(e.target.value);
                  setShowSecret(false);
                }}
                disabled={saving}
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-slate-300 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              >
                <option value="razorpay">Razorpay Checkout</option>
                <option value="stripe">Stripe Payments</option>
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label htmlFor="gtw-key" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Public API Key (Client ID)
              </label>
              <input
                id="gtw-key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedGateway === 'stripe' ? 'pk_live_...' : 'rzp_live_...'}
                disabled={saving}
                required
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655 font-mono text-xs"
              />
            </div>

            {/* API Secret */}
            <div className="space-y-1.5">
              <label htmlFor="gtw-secret" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Secret API Key (Secret Token)
              </label>
              <div className="relative">
                <input
                  id="gtw-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  disabled={saving}
                  required
                  className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-slate-655 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Is Active toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-[#1c1c1e] rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-205 block">Enable checkout gateway</span>
                <span className="text-[10px] text-slate-505 block mt-0.5">Activate this provider to accept transactions on checkout.</span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                disabled={saving}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-pink-600 border-[#26262a] rounded bg-slate-950 focus:ring-[#ff2a85] focus:ring-opacity-50"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 mt-2 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:opacity-95 text-white transition-all duration-200 shadow-lg shadow-pink-500/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Storing Keys Safely...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Configurations
                </>
              )}
            </button>
          </form>

          {/* Last Updated Footer */}
          {currentSettings && (
            <div className="border-t border-[#1c1c1e] pt-4 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-500 gap-2">
              <span className="flex items-center">
                <Calendar size={12} className="mr-1.5 shrink-0" />
                Updated at: {new Date(currentSettings.updated_at).toLocaleString()}
              </span>
              <span>
                Updated by: <code className="text-pink-400 font-bold font-mono">{currentSettings.profile?.name || currentSettings.profile?.email || 'N/A'}</code>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsPage;
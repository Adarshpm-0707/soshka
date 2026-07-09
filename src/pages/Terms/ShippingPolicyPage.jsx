import React from 'react';
import SectionTitle from '../../components/Reusable/SectionTitle';

const ShippingPolicyPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      <SectionTitle
        title="Shipping & Delivery Policy"
        subtitle="Last Updated: June 29, 2026"
        align="left"
      />

      <div className="mt-8 bg-white dark:bg-slate-850 p-6 sm:p-10 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-sm font-semibold">
          Soshka is committed to delivering your premium anti-tarnish jewelry across India safely, quickly, and securely. Below are the terms and conditions that constitute our Shipping & Delivery Policy.
        </p>

        <hr className="border-slate-200 dark:border-slate-850" />

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">1.</span> Shipping Rates & Charges
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We are pleased to offer:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li><strong>Free Shipping</strong> on all orders nationwide!</li>
            <li>No minimum purchase requirement for standard shipping.</li>
            <li>Cash on Delivery (COD) is available with no extra processing fees.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">2.</span> Delivery Timelines
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Orders are processed and dispatched within 24 to 48 hours of verification.
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li><strong>Metro Cities:</strong> 2 to 4 business days.</li>
            <li><strong>Rest of India:</strong> 3 to 5 business days.</li>
            <li>Please note that deliveries may be slightly delayed during public holidays, festivals, extreme weather conditions, or local lockdowns.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">3.</span> Shipment Tracking
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Once your order is shipped, you will receive a confirmation email and WhatsApp message containing your tracking number and logistics link. You can track your shipment live using the carrier website (Delhivery, BlueDart, or Shiprocket).
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">4.</span> Non-Delivery & Return to Origin (RTO)
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Our shipping partners will attempt delivery up to 3 times before returning the parcel to our warehouse. Please ensure your contact details, pin code, and shipping address are correct and you are reachable on call.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            If a package is returned to origin due to incorrect details or repeated customer unavailability, shipping charges for re-sending the order may be applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">5.</span> Damaged Shipments
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            If your package is visibly damaged, crushed, or tampered with at the time of delivery, please refuse the delivery and contact our customer support team immediately at <a href="mailto:soshka.in@gmail.com" className="text-[#ff2a85] hover:underline font-bold">soshka.in@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;

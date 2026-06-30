import React from 'react';
import SectionTitle from '../../components/Reusable/SectionTitle';

const RefundPolicyPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      <SectionTitle
        title="Return, Replacement & Refund Policy"
        subtitle="At Soshka, every product undergoes strict quality inspection before dispatch."
        align="left"
      />

      <div className="mt-8 bg-white dark:bg-slate-850 p-6 sm:p-10 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Refund Policy
          </h3>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
            As a general policy: Products once sold shall not be eligible for refunds.
          </p>
          <div className="space-y-2 mt-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Refunds will only be considered if:</p>
            <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
              <li>The product contains a verified manufacturing defect.</li>
              <li>The wrong product has been delivered.</li>
              <li>The product has been damaged during transit (subject to verification).</li>
            </ul>
          </div>
        </section>

        <hr className="border-slate-200 dark:border-slate-850" />

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Replacement Requests
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Customers must report any issue within 48 hours of delivery by providing:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Order number.</li>
            <li>Clear photographs.</li>
            <li>A complete, uninterrupted unboxing video starting before opening the package.</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Failure to provide sufficient evidence may result in rejection of the claim.
          </p>
        </section>

        <hr className="border-slate-200 dark:border-slate-850" />

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Returns will NOT be accepted for:
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 pl-2">
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Change of mind.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Personal dislike.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Incorrect size selected by the customer.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Minor colour differences.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Skin-related tarnishing.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Normal wear and tear.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Products showing signs of use.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">•</span> Damage caused after delivery.
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
};

export default RefundPolicyPage;

import React from 'react';
import SectionTitle from '../../components/Reusable/SectionTitle';

const PrivacyPolicyPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      <SectionTitle
        title="Privacy Policy"
        subtitle="Last Updated: June 29, 2026"
        align="left"
      />

      <div className="mt-8 bg-white dark:bg-slate-850 p-6 sm:p-10 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-sm font-semibold">
          At Soshka, accessible from Soshka.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Soshka and how we use it.
        </p>

        <hr className="border-slate-200 dark:border-slate-850" />

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">1.</span> Information We Collect
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We collect personal information that you provide to us when placing an order, registering an account, subscribing to newsletters, or contacting us. This information may include:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Name, billing address, shipping address, and email address</li>
            <li>Phone number and contact details</li>
            <li>Payment information (processed securely through Razorpay; we do not store card details)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">2.</span> How We Use Your Information
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Process, fulfill, and ship your orders</li>
            <li>Understand and analyze how you use our website to improve our services</li>
            <li>Communicate order status updates, customer service queries, and promotional offers</li>
            <li>Detect and prevent fraudulent activities</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">3.</span> Cookies and Tracking Technology
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka.in uses 'cookies' to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">4.</span> Third-Party Service Providers
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We share necessary information with reputable third-party companies to perform operations on our behalf:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Payment Gateways (Razorpay) for processing transactions securely</li>
            <li>Logistics & Delivery Partners (Delhivery, Shiprocket) for shipping packages</li>
            <li>Analytics services (Google Analytics) to measure site performance</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">5.</span> Data Security
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We use industry-standard physical, administrative, and technical measures to protect your personal data from unauthorized access, use, or disclosure. However, no electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">6.</span> Consent
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

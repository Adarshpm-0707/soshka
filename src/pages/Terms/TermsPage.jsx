import React from 'react';
import SectionTitle from '../../components/Reusable/SectionTitle';

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      <SectionTitle
        title="Terms & Conditions"
        subtitle="Last Updated: June 29, 2026"
        align="left"
      />

      <div className="mt-8 bg-white dark:bg-slate-850 p-6 sm:p-10 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-sm font-semibold">
          Welcome to Soshka.in. By accessing or placing an order on our website, you agree to be bound by the following Terms & Conditions. Please read them carefully before making a purchase.
        </p>

        <hr className="border-slate-200 dark:border-slate-850" />

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">1.</span> General
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka.in is an online store specializing in anti-tarnish fashion jewelry. By using our website, you agree to comply with these Terms & Conditions, our Privacy Policy, and any other policies published on our website.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We reserve the right to update or modify these Terms & Conditions at any time without prior notice.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">2.</span> Product Information
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We strive to display our products, colors, and descriptions as accurately as possible. However:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Product colors may slightly vary due to screen settings, lighting, and photography.</li>
            <li>Minor variations in finish, texture, or size may occur as each product is individually manufactured.</li>
            <li>Product measurements mentioned on the website are approximate.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">3.</span> Anti-Tarnish Jewelry
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Our jewelry is manufactured using high-quality anti-tarnish technology designed to resist discoloration under normal usage.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            However, the lifespan of the anti-tarnish coating may vary depending on factors such as:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Skin chemistry (body pH)</li>
            <li>Sweat and humidity</li>
            <li>Exposure to perfumes, deodorants, lotions, cosmetics, or chemicals</li>
            <li>Water exposure</li>
            <li>Storage conditions</li>
            <li>Frequency of use</li>
          </ul>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <strong>Important:</strong> Certain skin types naturally react differently with metal finishes. If tarnishing occurs due to an individual’s skin chemistry or body composition, it shall not be considered a manufacturing defect and will not qualify for replacement, refund, or warranty.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">4.</span> Warranty Policy
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka provides a 3-month limited warranty from the date of delivery against manufacturing defects only.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">The warranty covers:</p>
            <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
              <li>Manufacturing defects</li>
              <li>Defects in plating caused by manufacturing issues</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">The warranty does not cover:</p>
            <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
              <li>Normal wear and tear</li>
              <li>Tarnishing due to skin type or body chemistry</li>
              <li>Damage caused by perfumes, water, sweat, chemicals, cosmetics, or improper storage</li>
              <li>Scratches, dents, accidental damage, misuse, or negligence</li>
              <li>Broken chains, clasps, stones, or other damage caused after delivery</li>
              <li>Products modified or repaired by third parties</li>
            </ul>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Warranty claims are subject to inspection by our quality team. The company’s decision shall be final.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">5.</span> Return, Replacement & Refund Policy
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We maintain strict quality checks before dispatch.
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Products once sold are not eligible for refund.</li>
            <li>Refunds shall only be considered in cases where a manufacturing defect is confirmed.</li>
            <li>Replacement requests must be reported within 48 hours of delivery with clear photographs and an unboxing video.</li>
            <li>Claims submitted after this period may not be accepted.</li>
          </ul>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Refunds or replacements shall not be provided for:</p>
            <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
              <li>Change of mind</li>
              <li>Wrong size selected by the customer</li>
              <li>Personal preference</li>
              <li>Slight color differences</li>
              <li>Tarnishing caused by skin type</li>
              <li>Improper handling or misuse</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">6.</span> Damaged or Incorrect Products
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            If you receive:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>A damaged product</li>
            <li>An incorrect item</li>
            <li>A manufacturing defective item</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Please contact our customer support within 48 hours of receiving your order along with:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Order number</li>
            <li>Photos of the product</li>
            <li>Unboxing video showing the package being opened</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Failure to provide sufficient evidence may result in rejection of the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">7.</span> Order Acceptance
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            All orders placed on Soshka.in are subject to acceptance.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We reserve the right to:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Cancel any order</li>
            <li>Refuse service</li>
            <li>Limit quantities</li>
            <li>Cancel orders due to pricing errors, inventory issues, suspected fraud, or other unforeseen circumstances.</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            In such cases, eligible payments will be refunded.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">8.</span> Pricing
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            All prices displayed are in Indian Rupees (INR) unless stated otherwise.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Prices may change without prior notice.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Applicable taxes and shipping charges, if any, will be shown during checkout.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">9.</span> Shipping & Delivery
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            We offer delivery across eligible serviceable locations.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Estimated delivery timelines are provided for convenience only. Actual delivery may vary due to:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Customer location</li>
            <li>Courier partner delays</li>
            <li>Weather conditions</li>
            <li>Public holidays</li>
            <li>Natural disasters</li>
            <li>Government restrictions</li>
            <li>Other unforeseen circumstances</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka shall not be liable for delays caused by third-party logistics providers or events beyond our control.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">10.</span> Customer Responsibilities
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Customers are responsible for providing:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Correct shipping address</li>
            <li>Accurate contact details</li>
            <li>Correct pin code</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka shall not be responsible for delays or failed deliveries resulting from incorrect information provided by the customer.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Additional shipping charges arising from incorrect addresses may be borne by the customer.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">11.</span> Jewelry Care
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            To maximize the life of your jewelry:
          </p>
          <ul className="list-disc list-inside pl-4 text-sm font-semibold text-slate-500 dark:text-slate-400 space-y-1">
            <li>Keep away from water and moisture.</li>
            <li>Avoid perfumes, deodorants, lotions, and cosmetics.</li>
            <li>Remove jewelry before bathing, swimming, exercising, or sleeping.</li>
            <li>Store in a dry pouch or airtight box after use.</li>
            <li>Clean gently using a soft, dry cloth.</li>
          </ul>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Improper care may reduce the lifespan of the anti-tarnish finish.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">12.</span> Intellectual Property
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            All content on Soshka.in, including logos, product images, designs, graphics, text, and website content, is the intellectual property of Soshka and may not be copied, reproduced, distributed, or used without prior written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">13.</span> Limitation of Liability
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka shall not be liable for any indirect, incidental, consequential, or special damages arising from the use of our products or website.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Our maximum liability shall not exceed the purchase price of the product in question.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">14.</span> Force Majeure
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka shall not be held responsible for delays or failure to perform obligations due to circumstances beyond our reasonable control, including but not limited to natural disasters, pandemics, strikes, transportation disruptions, government actions, or technical failures.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">15.</span> Governing Law
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.
          </p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Any disputes arising from the use of this website or purchase of products shall be subject to the exclusive jurisdiction of the competent courts where Soshka conducts its principal business operations.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">16.</span> Contact Us
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            For any questions regarding these Terms & Conditions, warranty, returns, or your order, please contact our customer support through the contact details provided on Soshka.in.
          </p>
        </section>

        <section id="editorial-policy" className="space-y-3 scroll-mt-20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">17.</span> Editorial Policy &amp; Standards
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Soshka is committed to providing clear, accurate, and helpful information about jewellery styles, sizing guides, materials, and product care guidelines. Our design and curation team reviews all descriptions and blog posts to ensure compliance with quality standards. Soshka's editorial content is updated regularly, and all publication/modification dates are noted transparently.
          </p>
        </section>

        <section id="disclaimers" className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">18.</span> Shopping &amp; Product Disclaimers (YMYL)
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            <strong>Important:</strong> All jewellery items sold on Soshka.in are intended as fashion accessories. Unless explicitly specified otherwise in writing, our products are not manufactured from solid precious gold, sterling silver, or precious gemstones. Sizing measurements, weights, and finishes may vary slightly. Please review care instructions carefully before purchase. Skin chemistry reactions (tarnishing caused by unique pH/perspiration acidity levels) are not considered manufacturing defects and are not covered under warranty.
          </p>
        </section>

        <hr className="border-slate-200 dark:border-slate-850" />

        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center">
          By placing an order on Soshka.in, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;

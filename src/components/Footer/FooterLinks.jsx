import React from 'react';
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  const sections = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', path: '/products' },
        { label: 'Rings', path: '/products?category=rings' },
        { label: 'Necklaces & Pendants', path: '/products?category=necklaces' },
        { label: 'Earrings', path: '/products?category=earrings' },
        { label: 'Bracelets & Bangles', path: '/products?category=bracelets' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Reviews', path: '/reviews' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Store Locator', path: '/about' },
        { label: 'Careers', path: '/about' },
      ]
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'FAQs', path: '/contact' },
        { label: 'Shipping & Delivery', path: '/about' },
        { label: 'Returns & Refund', path: '/about' },
        { label: 'Order Tracking', path: '/orders' },
      ]
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
            {section.title}
          </h4>
          <ul className="space-y-2">
            {section.links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.path}
                  className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FooterLinks;

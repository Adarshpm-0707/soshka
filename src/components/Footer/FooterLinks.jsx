import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const FooterLinks = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories for footer:', err);
      }
    };
    fetchCategories();
  }, []);

  const shopLinks = [
    { label: 'All Products', path: '/products' },
    ...(categories.length > 0
      ? categories.map(cat => ({
        label: cat.name,
        path: `/products?category=${encodeURIComponent(cat.name)}`
      }))
      : [
        { label: 'Rings', path: '/products?category=Rings' },
        { label: 'Necklaces', path: '/products?category=Necklaces' },
        { label: 'Earrings', path: '/products?category=Earrings' },
        { label: 'Bracelets', path: '/products?category=Bracelets' },
      ])
  ];

  const sections = [
    {
      title: 'Shop',
      links: shopLinks
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Reviews', path: '/reviews' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' }
      ]
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'Returns & Refund', path: '/returns-refunds' },
        { label: 'Refund Policy', path: '/refund-policy' },
        { label: 'Privacy Policy', path: '/privacy-policy' },
        { label: 'Shipping Policy', path: '/shipping-policy' },
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Editorial Policy', path: '/terms#editorial-policy' },
        { label: 'Shopping Cart', path: '/cart' },
        { label: 'Order Tracking', path: 'https://soshka.shiprocket.co', isExternal: true }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
            {section.title}
          </h3>
          <ul className="space-y-2">
            {section.links.map((link) => (
              <li key={link.label}>
                {link.isExternal ? (
                  <a
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.path}
                    className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FooterLinks;

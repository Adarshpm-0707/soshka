import React, { useState } from 'react';
import { reviewService } from '../../services/reviewService';
import { validateContactForm } from '../../utils/validations';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { Mail, Phone, MapPin, Send, ShieldCheck, ShieldAlert } from 'lucide-react';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const validation = validateContactForm({ name, email, message });
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Validation failed', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Save to Supabase Database
      await reviewService.submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });

      // 2. Dispatch email notification via Vercel serverless function
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            message: message.trim()
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'SMTP failed');
        }

        showToast('Message sent successfully!', 'success');
      } catch (emailErr) {
        console.warn('Email dispatch failed:', emailErr.message);
        // Toast info since db save succeeded, but email failed
        showToast('Message saved, but email notification failed to deliver.', 'info');
      }

      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setGeneralError(err.message || 'Failed to submit contact request.');
      showToast('Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const contactDetails = [
    { 
      title: 'Email Us', 
      desc: 'soshka.in@gmail.com',  
      icon: <Mail className="text-primary-600 dark:text-primary-450 h-5 w-5" />,
      link: 'mailto:soshka.in@gmail.com'
    },
    { 
      title: 'WhatsApp Us', 
      desc: '+91 94964 65949',  
      icon: <Phone className="text-primary-600 dark:text-primary-450 h-5 w-5" />,
      link: 'https://wa.me/919496465949'
    },
    { 
      title: 'Visit Us', 
      desc: 'Aleef Global', 
      info: 'kannur , kerala , India', 
      icon: <MapPin className="text-primary-600 dark:text-primary-450 h-5 w-5" />,
      link: 'https://www.google.com/maps?q=11°52\'44.9"N+75°22\'33.4"E'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Required SectionTitle */}
      <SectionTitle
        title="Get in Touch"
        subtitle="Have questions about product details, delivery routes, or business partnerships? Send us a message."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Left column: Contact info cards */}
        <div className="lg:col-span-1 space-y-4">
          {contactDetails.map((detail) => {
            const CardWrapper = detail.link ? 'a' : 'div';
            const extraProps = detail.link 
              ? { href: detail.link, target: '_blank', rel: 'noopener noreferrer' } 
              : {};
            
            return (
              <CardWrapper
                key={detail.title}
                {...extraProps}
                className={`flex items-start space-x-4 p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm ${
                  detail.link 
                    ? 'cursor-pointer hover:border-primary-500/40 dark:hover:border-primary-500/40 hover:shadow-md transition-all duration-300 block' 
                    : ''
                }`}
              >
                <div className="p-3 bg-primary-50/20 dark:bg-primary-950/20 rounded-xl">
                  {detail.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wide font-sans">{detail.title}</h4>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{detail.desc}</p>
                  {detail.info && <p className="text-xs text-slate-400 font-semibold">{detail.info}</p>}
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* Right column: Form submits */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-4">
            
            <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-sm">
              Send Message
            </h3>

            {generalError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                id="name"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                disabled={loading}
              />

              <Input
                label="Email Address"
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
                disabled={loading}
              />
            </div>

            <Input
              label="Your Message (min 10 characters)"
              id="message"
              type="textarea"
              placeholder="Describe your inquiry..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={errors.message}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full mt-4"
              loading={loading}
              disabled={loading}
              icon={Send}
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

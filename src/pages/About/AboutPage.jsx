import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const AboutPage = () => {
  return (
    <div className="bg-white dark:bg-black text-slate-900 dark:text-white min-h-screen">

      {/* ── PAGE HEADER ── */}
      <div className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#080809]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-4"
          >
            About Soshka
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight"
          >
            A store built on{' '}
            <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              true curation.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            Founded by designers and product lovers. Every item in our catalog has been physically reviewed and chosen by our team.
          </motion.p>
        </div>
      </div>

     

      {/* ── OUR STORY ── */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* Mobile: stacked. Desktop: sidebar + content */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Label */}
            <motion.div {...fadeUp()} className="lg:col-span-3">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-rose-500">Our Story</span>
              <div className="mt-3 w-8 h-0.5 bg-rose-500" />
            </motion.div>

            {/* Content */}
            <div className="lg:col-span-9 space-y-5">
              <motion.h2
                {...fadeUp(0.05)}
                className="text-2xl sm:text-3xl font-extrabold leading-tight"
              >
                We were tired of settling for "good enough."
              </motion.h2>

              <motion.p
                {...fadeUp(0.1)}
                className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed"
              >
                Soshka was founded in 2026 by a small team of designers and product enthusiasts who believed every object in your life should be intentional. We skip the generic marketplace model — every product is hand-reviewed, tested, and chosen by people who genuinely care about craft and quality.
              </motion.p>

              <motion.ul
                {...fadeUp(0.15)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
              >
                {[
                  'Hand-reviewed by our design team',
                  'Sourced from verified artisan makers',
                  'Quality-tested before every listing',
                  'Full return & warranty included',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <CheckCircle2 size={15} className="text-rose-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION CLOSE ── */}
      <section className="py-14 sm:py-20 border-t border-slate-100 dark:border-white/5 mt-10 sm:mt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp()}>
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-5">
              Our Mission
            </span>
            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              "To make the world's finest objects accessible to people who care about quality as much as we do."
            </blockquote>
            <div className="mt-7 flex items-center justify-center gap-3">
            
            
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;

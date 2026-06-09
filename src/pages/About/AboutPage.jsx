import React from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '../../components/Reusable/SectionTitle';
import { Heart, Globe, Award, Sparkles } from 'lucide-react';

const AboutPage = () => {
  const team = [
    { name: 'Sarah Jenkins', role: 'CEO & Founder', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
    { name: 'Marcus Chen', role: 'Chief Designer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    { name: 'Elena Rostova', role: 'Lead Developer', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80' },
    { name: 'David Miller', role: 'Procurement Lead', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
  ];

  const valueCards = [
    { title: 'Premium Quality', icon: <Sparkles className="text-primary-500 h-6 w-6" />, desc: 'We procure materials from checked craftsmen globally to ensure unmatched durability and elegance.' },
    { title: 'Global Delivery', icon: <Globe className="text-primary-500 h-6 w-6" />, desc: 'Shipping coordinates across international shipping routes to reach you wherever you reside.' },
    { title: 'Craftsmanship', icon: <Award className="text-primary-500 h-6 w-6" />, desc: 'Bridging modern design methodologies with age-old authentic crafting traditions.' }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white text-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&auto=format&fit=crop&q=70"
            alt="About Banner"
            className="object-cover w-full h-full opacity-15 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 font-sans"
          >
            The Soshka Narrative
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm sm:text-base text-slate-400 font-semibold max-w-xl mx-auto leading-relaxed"
          >
            Redefining shopping selections since 2026. We build digital spaces that showcase the highest-tier design goods.
          </motion.p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <SectionTitle
              title="Elegance in Simplicity"
              subtitle=""
              align="left"
              className="!mb-0"
            />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              At Soshka, we believe shopping should be a curated process, not a chore. We skip generic marketplace models in favor of handpicked premium lists. Each product in our catalogs goes through rigorous validation stages.
            </p>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Founded in 2026 by design enthusiasts, our goal is to deliver beautiful, functional tools, apparel, and furniture that elevate daily routines. No cheap plastics, no filler products. Just authentic design language.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg h-96 relative group"
          >
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80"
              alt="Narrative graphic"
              className="object-cover w-full h-full group-hover:scale-102 transition duration-500"
            />
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900 border-y border-slate-200/50 dark:border-slate-800/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Our Core Values"
            subtitle="The philosophies guiding how we curate, list, and deliver customer items."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            {valueCards.map((val, idx) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-850 p-8 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="p-3 bg-primary-50/20 dark:bg-primary-950/20 rounded-xl w-fit">
                  {val.icon}
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white font-sans">{val.title}</h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Meet Our Designers"
          subtitle="The brilliant minds curating the Soshka collections."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-6">
          {team.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-205 dark:border-slate-800 shadow-sm flex flex-col items-center p-6 text-center"
            >
              <img
                src={member.image}
                alt={member.name}
                className="h-24 w-24 rounded-full object-cover border-2 border-primary-500/20 shadow mb-4"
              />
              <h4 className="text-sm font-bold text-slate-850 dark:text-white font-sans">{member.name}</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

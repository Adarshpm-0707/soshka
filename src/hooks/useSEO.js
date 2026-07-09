import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useSEO = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage,
} = {}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Set Title
    if (title) {
      document.title = title;
    }

    // 2. Set Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    // 3. Set Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const currentCanonicalUrl = canonicalUrl || `https://soshka.in${location.pathname}`;
    canonical.setAttribute('href', currentCanonicalUrl);

    // 4. Set Open Graph Tags
    const setOgTag = (property, value) => {
      if (!value) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', value);
    };

    setOgTag('og:title', ogTitle || title);
    setOgTag('og:description', ogDescription || description);
    setOgTag('og:image', ogImage || 'https://soshka.in/og-image.jpg');
    setOgTag('og:url', `https://soshka.in${location.pathname}`);
    setOgTag('og:type', ogType || 'website');
    setOgTag('og:site_name', 'Soshka');
    setOgTag('og:locale', 'en_IN');

    // 5. Set Twitter Tags
    const setTwitterTag = (name, value) => {
      if (!value) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', value);
    };

    setTwitterTag('twitter:card', twitterCard || 'summary_large_image');
    setTwitterTag('twitter:title', twitterTitle || title);
    setTwitterTag('twitter:description', twitterDescription || description);
    setTwitterTag('twitter:image', twitterImage || ogImage || 'https://soshka.in/og-image.jpg');

  }, [
    title,
    description,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    location.pathname,
  ]);
};

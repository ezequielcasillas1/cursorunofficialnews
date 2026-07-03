import { useEffect } from 'react';
import { buildBreadcrumbJsonLd, buildCanonicalUrl } from '../seo/pageMeta.js';

const META_IDS = {
  description: 'meta-description',
  canonical: 'link-canonical',
  ogTitle: 'meta-og-title',
  ogDescription: 'meta-og-description',
  ogUrl: 'meta-og-url',
  twitterTitle: 'meta-twitter-title',
  twitterDescription: 'meta-twitter-description',
};

function ensureMeta(name, id, attribute = 'name') {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('meta');
    el.id = id;
    if (attribute === 'name') el.setAttribute('name', name);
    else el.setAttribute('property', name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureCanonical(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  return el;
}

function ensureJsonLdScript(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  return el;
}

export function PageMeta({ title, description, path = '/', breadcrumbLabel = null }) {
  useEffect(() => {
    document.title = title;

    ensureMeta('description', META_IDS.description).setAttribute('content', description);
    ensureCanonical(META_IDS.canonical).setAttribute('href', buildCanonicalUrl(path));
    ensureMeta('og:title', META_IDS.ogTitle, 'property').setAttribute('content', title);
    ensureMeta('og:description', META_IDS.ogDescription, 'property').setAttribute('content', description);
    ensureMeta('og:url', META_IDS.ogUrl, 'property').setAttribute('content', buildCanonicalUrl(path));
    ensureMeta('twitter:title', META_IDS.twitterTitle).setAttribute('content', title);
    ensureMeta('twitter:description', META_IDS.twitterDescription).setAttribute('content', description);

    const jsonLd = buildBreadcrumbJsonLd(path, breadcrumbLabel);
    const jsonLdEl = ensureJsonLdScript('page-breadcrumb-jsonld');
    if (jsonLd) {
      jsonLdEl.textContent = JSON.stringify(jsonLd);
      jsonLdEl.hidden = false;
    } else {
      jsonLdEl.textContent = '';
      jsonLdEl.hidden = true;
    }
  }, [title, description, path, breadcrumbLabel]);

  return null;
}

import { useEffect } from 'react';

interface StructuredDataProps {
  data: any;
}

export const StructuredData = ({ data }: StructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
};

// Common structured data templates
export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MyEcclesia",
  "url": "https://myecclesia.com",
  "logo": "https://myecclesia.com/logo.png",
  "description": "MyEcclesia - Bringing the UK Christian community together through meaningful events, worship services, and fellowship opportunities.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://facebook.com/myecclesia",
    "https://twitter.com/myecclesia",
    "https://instagram.com/myecclesia"
  ]
});

export const createEventSchema = (event: any) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.title,
  "description": event.description,
  "startDate": `${event.date}T${event.time}`,
  "location": {
    "@type": "Place",
    "name": event.location,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": event.location
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "MyEcclesia",
    "url": "https://myecclesia.com"
  },
  "offers": {
    "@type": "Offer",
    "price": event.price,
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "validFrom": new Date().toISOString()
  }
});

export const createBlogPostSchema = (post: any) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.excerpt,
  "author": {
    "@type": "Person",
    "name": post.author
  },
  "datePublished": post.created_at,
  "dateModified": post.updated_at,
  "publisher": {
    "@type": "Organization",
    "name": "MyEcclesia",
    "logo": {
      "@type": "ImageObject",
      "url": "https://myecclesia.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://myecclesia.com/blog/${post.id}`
  }
});
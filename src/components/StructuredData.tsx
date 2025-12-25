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
  "alternateName": "MyEcclesia Christian Events Platform",
  "url": "https://myecclesia.uk",
  "logo": {
    "@type": "ImageObject",
    "url": "https://myecclesia.uk/myecclesia-logo.png",
    "width": "200",
    "height": "200"
  },
  "description": "The UK's premier Christian events platform connecting believers across denominations. Discover, book, and attend Christian conferences, worship nights, and community gatherings.",
  "foundingDate": "2024",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "GB",
    "addressRegion": "United Kingdom"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://myecclesia.uk/contact",
    "availableLanguage": "English"
  },
  "offers": {
    "@type": "Offer",
    "description": "Free and paid Christian event tickets",
    "availability": "https://schema.org/InStock"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://myecclesia.uk/events?search={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "sameAs": []
});

export const createEventSchema = (event: any) => {
  const eventUrl = `https://myecclesia.uk/events/${event.slug || event.id}`;
  const startDateTime = `${event.date}T${event.time || '00:00'}`;
  
  // Calculate end date (default to same day if no duration)
  const endDateTime = event.duration 
    ? `${event.date}T${event.end_time || '23:59'}` 
    : `${event.date}T23:59`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description || `${event.title} - Christian event at ${event.location}`,
    "startDate": startDateTime,
    "endDate": endDateTime,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "image": event.image || "https://myecclesia.uk/og-image.png",
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location,
        "addressCountry": "GB"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": event.organizer || "MyEcclesia",
      "url": "https://myecclesia.uk"
    },
    "performer": {
      "@type": "PerformingGroup",
      "name": event.organizer || event.title
    },
    "offers": {
      "@type": "Offer",
      "price": event.price || 0,
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock",
      "url": eventUrl,
      "validFrom": event.created_at || new Date().toISOString()
    }
  };
};

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
      "url": "https://myecclesia.uk/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://myecclesia.uk/blog/${post.id}`
  }
});

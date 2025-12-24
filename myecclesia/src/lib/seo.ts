const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myecclesiahub.com";

export const siteMetadata = {
  name: "MyEcclesia",
  title: "MyEcclesia – Christian Events & Tickets",
  ogTitle: "MyEcclesia - Christian Events Platform",
  description:
    "Discover, book, and attend top Christian events with MyEcclesia—your go-to platform for church gatherings, conferences, and community activities across the UK.",
  keywords: [
    "MyEcclesia",
    "Christian events",
    "church tickets",
    "event platform",
    "UK Christian community",
    "Christian conferences",
    "worship nights",
    "faith events",
  ],
  url: defaultSiteUrl.replace(/\/$/, ""),
  author: "MyEcclesia",
  themeColor: "#2563eb",
  twitterHandle: "@MyEcclesia",
  ogImage: "/og-image.png",
};

export const marketingPages = [
  "/",
  "/events",
  "/calendar",
  "/blog",
  "/about",
  "/contact",
  "/donate",
  "/help-centre",
  "/event-guidelines",
  "/privacy-policy",
  "/terms-and-conditions",
  "/partnership",
  "/community",
];

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
};

export type FeaturedEvent = {
  slug: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  location: {
    name: string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  organizer?: string;
  image?: string;
  offer?: {
    price: string;
    priceCurrency: string;
    availability: string;
  };
  category?: string;
};

export const featuredEvents: FeaturedEvent[] = [
  {
    slug: "kingdom-worship-summit-2025",
    name: "Kingdom Worship Summit 2025",
    description:
      "Two-day worship immersion featuring prophetic ministry, practical workshops, and collaboration between UK churches.",
    startDate: "2025-03-07T18:00:00+00:00",
    endDate: "2025-03-08T21:30:00+00:00",
    timeZone: "Europe/London",
    location: {
      name: "Emmanuel Centre",
      streetAddress: "9-23 Marsham Street",
      addressLocality: "London",
      addressRegion: "England",
      postalCode: "SW1P 3DW",
      addressCountry: "GB",
    },
    organizer: "MyEcclesia",
    image: "/og-image.png",
    offer: {
      price: "95.00",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
    category: "Conference",
  },
  {
    slug: "northern-prayer-gathering",
    name: "Northern Prayer Gathering",
    description:
      "Regional night of intercession for church planters and ministry leaders across Manchester and Leeds.",
    startDate: "2025-04-12T17:00:00+01:00",
    endDate: "2025-04-12T22:00:00+01:00",
    timeZone: "Europe/London",
    location: {
      name: "Audacious Church",
      streetAddress: "Trinity Way",
      addressLocality: "Manchester",
      addressRegion: "England",
      postalCode: "M3 7BB",
      addressCountry: "GB",
    },
    organizer: "MyEcclesia",
    image: "/og-image.png",
    offer: {
      price: "25.00",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
    category: "Prayer",
  },
  {
    slug: "youth-fire-retreat",
    name: "Youth Fire Retreat",
    description:
      "Immersive discipleship weekend for youth pastors, worship leaders, and young evangelists.",
    startDate: "2025-05-23T15:00:00+01:00",
    endDate: "2025-05-25T12:00:00+01:00",
    timeZone: "Europe/London",
    location: {
      name: "Whitemoor Lakes",
      streetAddress: "Barley Green Ln",
      addressLocality: "Lichfield",
      addressRegion: "England",
      postalCode: "WS13 8QT",
      addressCountry: "GB",
    },
    organizer: "MyEcclesia",
    image: "/og-image.png",
    offer: {
      price: "135.00",
      priceCurrency: "GBP",
      availability: "https://schema.org/LimitedAvailability",
    },
    category: "Retreat",
  },
];

const buildEventSchema = (event: FeaturedEvent) => ({
  "@type": "Event",
  name: event.name,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate,
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: event.location.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: event.location.streetAddress,
      addressLocality: event.location.addressLocality,
      addressRegion: event.location.addressRegion,
      postalCode: event.location.postalCode,
      addressCountry: event.location.addressCountry,
    },
  },
  image: [`${siteMetadata.url}${event.image ?? "/og-image.png"}`],
  organizer: {
    "@type": "Organization",
    name: event.organizer ?? siteMetadata.name,
    url: siteMetadata.url,
  },
  offers: event.offer && {
    "@type": "Offer",
    price: event.offer.price,
    priceCurrency: event.offer.priceCurrency,
    availability: event.offer.availability,
    url: `${siteMetadata.url}/events/${event.slug}`,
  },
  category: event.category,
  url: `${siteMetadata.url}/events/${event.slug}`,
  inLanguage: "en-GB",
});

export const organizationSchema = {
  "@type": "Organization",
  name: siteMetadata.name,
  alternateName: "MyEcclesia Christian Events Platform",
  url: siteMetadata.url,
  logo: `${siteMetadata.url}/og-image.png`,
  description: siteMetadata.description,
  sameAs: [
    "https://www.facebook.com/myecclesia",
    "https://www.instagram.com/myecclesia",
    "https://x.com/MyEcclesia",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@myecclesiahub.com",
    url: `${siteMetadata.url}/contact`,
    availableLanguage: "en",
  },
};

export const buildEventsJsonLd = (events: FeaturedEvent[] = featuredEvents) => ({
  "@context": "https://schema.org",
  "@graph": [organizationSchema, ...events.map(buildEventSchema)],
});

export const buildSitemapEntries = (): SitemapEntry[] => {
  const now = new Date();
  const staticEntries = marketingPages.map((path) => ({
    url: `${siteMetadata.url}${path}`,
    lastModified: now,
    changeFrequency: (path === "/" ? "daily" : "weekly") as ChangeFrequency,
    priority: path === "/" ? 1 : 0.7,
  }));

  const eventEntries = featuredEvents.map((event) => ({
    url: `${siteMetadata.url}/events/${event.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.6,
  }));

  return [...staticEntries, ...eventEntries];
};

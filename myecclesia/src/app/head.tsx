import { StructuredData } from "@/components/structured-data";
import { buildEventsJsonLd, siteMetadata } from "@/lib/seo";

export default function Head() {
  return (
    <>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteMetadata.name} />
      <meta name="msapplication-TileColor" content={siteMetadata.themeColor} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="twitter:site" content={siteMetadata.twitterHandle} />
      <meta name="twitter:creator" content={siteMetadata.twitterHandle} />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <StructuredData data={buildEventsJsonLd()} />
    </>
  );
}

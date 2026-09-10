import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

/**
 * The static tags in index.html act as fallback for crawlers that don't run JS.
 * Once a route provides its own tags, drop the static duplicates from the DOM
 * so JS-executing crawlers only see one of each.
 */
const DUPLICATE_SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:url"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
];

function useStripStaticDuplicates() {
  useEffect(() => {
    DUPLICATE_SELECTORS.forEach((selector) => {
      document
        .querySelectorAll(`${selector}:not([data-rh])`)
        .forEach((el) => el.remove());
    });
  });
}

const SITE_URL = "https://darocodeia.com";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

/** Per-route title, description, canonical and Open Graph tags. */
export const Seo = ({ title, description, path, noindex }: SeoProps) => {
  useStripStaticDuplicates();
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Helmet>
  );
};

export default Seo;

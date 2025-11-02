/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

export default {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapBaseFileName: 'sitemap-index',
  exclude: ['/**'], // We serve section sitemaps via routes; index links them below
  additionalSitemaps: [
    `${siteUrl}/pages-sitemap.xml`,
    `${siteUrl}/filetypes-sitemap.xml`,
    `${siteUrl}/mimetypes-sitemap.xml`,
    `${siteUrl}/codecs-sitemap.xml`,
    `${siteUrl}/categories-sitemap.xml`,
  ],
};


import test from 'node:test';
import assert from 'node:assert/strict';

try {
  const { buildSitemapXml } = await import('../src/modules/sitemap/sitemap.generator.js');

  test('buildSitemapXml includes homepage, service pages, and blog entries', () => {
    const xml = buildSitemapXml([
      'https://easemyweb.in/',
      'https://easemyweb.in/services',
      'https://easemyweb.in/blog',
      'https://easemyweb.in/blog/ai-trends'
    ]);

    assert.match(xml, /<loc>https:\/\/easemyweb\.in\/<\/loc>/);
    assert.match(xml, /<loc>https:\/\/easemyweb\.in\/blog\/ai-trends<\/loc>/);
    assert.match(xml, /<urlset/i);
  });
} catch (error) {
  test('sitemap generator module should exist', () => {
    throw error;
  });
}

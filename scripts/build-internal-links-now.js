/**
 * 🕸️ BUILD INTERNAL LINKS SCRIPT
 * Connects all blog posts with rich internal linking networks
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InternalLinkingWebBuilder from '../src/services/internal-linking-web-builder.js';
import Blog from '../src/modules/blog/blog.model.js';

dotenv.config();

console.log('🕸️ Starting Internal Linking Web Builder...');
console.log('═══════════════════════════════════════════════════\n');

async function main() {
  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB!\n');

    const linkingBuilder = new InternalLinkingWebBuilder();

    console.log('🔍 Analyzing all published blog posts in database...');
    const allBlogs = await Blog.find({ published: true });
    console.log(`Found ${allBlogs.length} published blogs.\n`);

    console.log('🕸️ Injecting internal links across all blog posts...');
    let updatedCount = 0;

    for (let i = 0; i < allBlogs.length; i++) {
      const blog = allBlogs[i];
      try {
        const internalLinks = await linkingBuilder.buildInternalLinks(blog, blog.keywords || []);
        const originalLength = blog.content.length;
        const enhancedContent = linkingBuilder.injectLinksIntoContent(blog.content, internalLinks);

        if (enhancedContent.length !== originalLength || !blog.content.includes('/blog/')) {
          blog.content = enhancedContent;
          await blog.save();
          updatedCount++;
        }

        if ((i + 1) % 20 === 0 || i === allBlogs.length - 1) {
          console.log(`Progress: ${i + 1}/${allBlogs.length} processed (${updatedCount} updated)`);
        }
      } catch (err) {
        console.error(`Error linking blog "${blog.title}":`, err.message);
      }
    }

    console.log(`\n✅ Internal linking injected into ${updatedCount} blog posts!\n`);

    console.log('📊 Generating Internal Linking Network Audit Report...');
    const report = await linkingBuilder.generateLinkingReport();

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 INTERNAL LINKING COMPLETE REPORT:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Total Blogs: ${report.total_blogs}`);
    console.log(`✅ Total Internal Links in Network: ${report.total_internal_links}`);
    console.log(`✅ Average Links Per Blog: ${report.average_links_per_page}`);
    console.log(`✅ Well-Linked Pages: ${report.well_linked_pages.length}`);
    console.log(`✅ Linking Distribution:`, report.linking_distribution);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Internal linking builder failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

main();

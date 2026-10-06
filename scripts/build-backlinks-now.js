/**
 * 🔗 BUILD EXTERNAL BACKLINKS CAMPAIGN SCRIPT
 * Executes real Google SerpAPI discovery and Gemini outreach generation
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AutoBacklinkBuilder from '../src/services/auto-backlink-builder.js';
import Blog from '../src/modules/blog/blog.model.js';

dotenv.config();

console.log('🚀 Starting Real External Backlink Discovery & Outreach Campaign...');
console.log('═════════════════════════════════════════════════════════════════════\n');

async function main() {
  try {
    console.log('📊 Connecting to MongoDB to fetch live blog URLs and target keywords...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB!\n');

    const recentBlogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title slug keywords');

    if (recentBlogs.length === 0) {
      console.error('❌ No published blogs found to build backlinks for.');
      return;
    }

    const domain = 'easemyweb.in';
    const contentUrls = recentBlogs.map(b => `https://${domain}/blog/${b.slug}`);
    const targetKeywords = [
      'AI web development',
      'mobile app development services',
      'web development tutorial',
      'GraphQL services'
    ];

    console.log(`🎯 Target Keywords (${targetKeywords.length}):`);
    targetKeywords.forEach(k => console.log(`   • ${k}`));
    console.log(`\n📄 Content URLs to Promote (${contentUrls.length}):`);
    contentUrls.slice(0, 5).forEach(u => console.log(`   • ${u}`));
    console.log('   ...\n');

    const backlinkBuilder = new AutoBacklinkBuilder();

    console.log('🔍 Executing Google SerpAPI searches for high-authority targets, guest posts & resource pages...');
    const campaignResult = await backlinkBuilder.executeBacklinkCampaign(targetKeywords, contentUrls);

    if (campaignResult.campaign_status !== 'SUCCESS') {
      throw new Error(campaignResult.error || 'Campaign execution failed');
    }

    // Save outputs to file
    const outputDir = path.resolve(process.cwd(), 'data');
    await fs.mkdir(outputDir, { recursive: true });

    const jsonPath = path.join(outputDir, 'backlink-outreach-campaign.json');
    await fs.writeFile(jsonPath, JSON.stringify(campaignResult, null, 2), 'utf8');

    // Create a readable Markdown dossier
    let mdContent = `# 🚀 External Backlink & Outreach Campaign Dossier\n\n`;
    mdContent += `**Generated At:** ${new Date().toISOString()}\n`;
    mdContent += `**Target Domain:** https://${domain}\n`;
    mdContent += `**Target Keywords:** ${targetKeywords.join(', ')}\n\n`;
    mdContent += `---\n\n`;

    mdContent += `## 📊 Campaign Summary\n\n`;
    mdContent += `- **High-Authority Resource Targets:** ${campaignResult.link_opportunities?.length || 0}\n`;
    mdContent += `- **AI Outreach Pitches Ready:** ${campaignResult.outreach_campaigns?.length || 0}\n`;
    mdContent += `- **Guest Post Opportunities:** ${campaignResult.guest_post_opportunities?.length || 0}\n`;
    mdContent += `- **Broken Link Replacement Targets:** ${campaignResult.broken_link_opportunities?.length || 0}\n\n`;
    mdContent += `---\n\n`;

    mdContent += `## ✉️ Ready-to-Send Outreach Pitches\n\n`;
    (campaignResult.outreach_campaigns || []).forEach((c, idx) => {
      mdContent += `### Pitch ${idx + 1}: [${c.target_domain}](${c.target_url})\n`;
      mdContent += `- **Keyword:** \`${c.keyword}\`\n`;
      mdContent += `- **Subject:** ${c.email_subject}\n`;
      mdContent += `- **Pitch Body:**\n\n\`\`\`\n${c.email_body}\n\`\`\`\n\n`;
      mdContent += `- **Follow-ups:**\n`;
      c.follow_up_sequence?.forEach((f, fIdx) => {
        mdContent += `  ${fIdx + 1}. *${f}*\n`;
      });
      mdContent += `\n---\n\n`;
    });

    mdContent += `## 📝 Top Guest Post & Contributor Sites\n\n`;
    (campaignResult.guest_post_opportunities || []).forEach((gp, idx) => {
      mdContent += `${idx + 1}. **[${gp.blog_title || gp.domain}](${gp.blog_url})** (Domain: \`${gp.domain}\`)\n`;
      mdContent += `   - **Guidelines/Context:** ${gp.guest_post_guidelines || 'Open contributor site'}\n`;
      if (gp.suggested_topics?.length > 0) {
        mdContent += `   - **Suggested Topics:** ${gp.suggested_topics.join(', ')}\n`;
      }
      mdContent += `\n`;
    });

    const reportPath = path.resolve(process.cwd(), 'BACKLINK_OUTREACH_REPORT.md');
    await fs.writeFile(reportPath, mdContent, 'utf8');

    console.log('═════════════════════════════════════════════════════════════════════');
    console.log('🎉 EXTERNAL BACKLINK CAMPAIGN COMPLETED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════════════════════════════════');
    console.log(`✅ High-Authority Opportunities: ${campaignResult.link_opportunities?.length || 0}`);
    console.log(`✅ Outreach Campaigns Generated: ${campaignResult.outreach_campaigns?.length || 0}`);
    console.log(`✅ Guest Post Portals Found: ${campaignResult.guest_post_opportunities?.length || 0}`);
    console.log(`✅ Broken Link Opportunities: ${campaignResult.broken_link_opportunities?.length || 0}`);
    console.log(`📁 Saved Campaign Data: ${jsonPath}`);
    console.log(`📄 Saved Outreach Dossier: ${reportPath}`);
    console.log('═════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Backlink campaign failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

main();

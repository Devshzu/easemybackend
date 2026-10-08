import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from '../src/modules/blog/blog.model.js';
import { saveImage } from '../src/modules/blog/blog.generator.js';

dotenv.config();

async function fixDuplicateBlogImages() {
  console.log('🔄 Connecting to MongoDB to update duplicate blog images...');
  await mongoose.connect(process.env.DATABASE_URI);
  console.log('✅ Connected to MongoDB!\n');

  // Find blogs with duplicate unsplash image or missing image
  const filter = {
    $or: [
      { image: { $regex: 'unsplash', $options: 'i' } },
      { image: { $exists: false } },
      { image: '' },
      { image: null }
    ]
  };

  const blogs = await Blog.find(filter).select('_id title keywords category image');
  console.log(`Found ${blogs.length} blogs needing unique Gemini images.`);

  if (blogs.length === 0) {
    console.log('No blogs found with duplicate images! All blogs have unique images.');
    await mongoose.disconnect();
    return;
  }

  let updatedCount = 0;
  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    console.log(`\n[${i + 1}/${blogs.length}] Generating unique Gemini image for: "${blog.title}"...`);

    try {
      const newImageUrl = await saveImage({
        title: blog.title,
        keywords: blog.keywords,
        category: blog.category,
      });

      blog.image = newImageUrl;
      await Blog.updateOne({ _id: blog._id }, { $set: { image: newImageUrl } });
      updatedCount++;
      console.log(`   ✅ Updated! Image URL: ${newImageUrl}`);
    } catch (err) {
      console.error(`   ❌ Failed for "${blog.title}":`, err.message);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount}/${blogs.length} blogs with unique Gemini images!`);
  await mongoose.disconnect();
}

fixDuplicateBlogImages().catch(console.error);

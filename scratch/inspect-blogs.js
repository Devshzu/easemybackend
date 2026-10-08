import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from '../src/modules/blog/blog.model.js';

dotenv.config();

async function inspectBlogs() {
  await mongoose.connect(process.env.DATABASE_URI);
  const total = await Blog.countDocuments();
  const unsplashCount = await Blog.countDocuments({ image: { $regex: 'unsplash', $options: 'i' } });
  const noImageCount = await Blog.countDocuments({ $or: [{ image: { $exists: false } }, { image: '' }, { image: null }] });
  
  console.log('Total blogs:', total);
  console.log('Blogs with Unsplash image:', unsplashCount);
  console.log('Blogs with no image:', noImageCount);
  
  const sample = await Blog.find({ image: { $regex: 'unsplash', $options: 'i' } }).limit(5).select('title image category').lean();
  console.log('Sample matching blogs:', sample);

  await mongoose.disconnect();
}

inspectBlogs().catch(console.error);

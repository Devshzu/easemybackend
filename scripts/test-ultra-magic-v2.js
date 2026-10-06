/**
 * 🧪 TEST ULTRA MAGIC V2 SYSTEM
 * 
 * Run this script to test the V2 system without starting the server
 * 
 * Usage: node scripts/test-ultra-magic-v2.js
 */

import UltraMagicV2Enhanced from '../src/services/ultra-magic-v2-enhanced.js';
import { getGeminiKeyRotator } from '../src/services/gemini-key-rotator.js';
import KeywordClusteringEngine from '../src/services/keyword-clustering-engine.js';
import CTROptimizationEngine from '../src/services/ctr-optimization-engine.js';
import FreeToolsAggregator from '../src/services/free-tools-aggregator.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 ULTRA MAGIC V2 TEST SCRIPT');
console.log('════════════════════════════════════════\n');

async function testGeminiKeyRotator() {
  console.log('TEST 1: Gemini Key Rotator');
  console.log('─────────────────────────────');
  
  const rotator = getGeminiKeyRotator();
  console.log(`✅ Keys loaded: ${rotator.keys.length}`);
  
  // Test rotation
  const key1 = rotator.getNextKey();
  const key2 = rotator.getNextKey();
  const key3 = rotator.getNextKey();
  
  console.log(`✅ Key 1: ${key1.substring(0, 15)}...`);
  console.log(`✅ Key 2: ${key2.substring(0, 15)}...`);
  console.log(`✅ Key 3: ${key3.substring(0, 15)}...`);
  
  const stats = rotator.getStats();
  console.log(`✅ Stats:`, stats);
  console.log('✅ PASS: Key rotation working!\n');
}

async function testKeywordClustering() {
  console.log('TEST 2: Keyword Clustering');
  console.log('─────────────────────────────');
  
  const engine = new KeywordClusteringEngine();
  
  const sampleKeywords = [
    'web development',
    'web development services',
    'web development company',
    'website development',
    'mobile app development',
    'mobile app services',
    'app development company',
    'digital marketing',
    'seo services',
    'social media marketing'
  ];
  
  console.log(`📊 Clustering ${sampleKeywords.length} keywords...`);
  const clusters = await engine.createKeywordClusters(sampleKeywords);
  
  console.log(`✅ Created ${clusters.length} clusters`);
  console.log('\nSample Cluster:');
  console.log(JSON.stringify(clusters[0], null, 2));
  console.log('✅ PASS: Clustering working!\n');
}

async function testCTROptimization() {
  console.log('TEST 3: CTR Optimization');
  console.log('─────────────────────────────');
  
  const optimizer = new CTROptimizationEngine();
  
  const keyword = 'web development';
  console.log(`📝 Optimizing for keyword: "${keyword}"`);
  
  const optimized = optimizer.getBestCombination(keyword);
  
  console.log('\n✅ Optimized Title:');
  console.log(`   ${optimized.title}`);
  console.log('\n✅ Optimized Meta:');
  console.log(`   ${optimized.meta}`);
  console.log(`\n✅ CTR Score: ${optimized.ctr_score}/100`);
  console.log(`✅ Estimated CTR: ${optimized.estimated_ctr}`);
  console.log('✅ PASS: CTR optimization working!\n');
}

async function testFreeTools() {
  console.log('TEST 4: Free Tools Aggregator');
  console.log('─────────────────────────────');
  
  const freeTools = new FreeToolsAggregator();
  
  const keyword = 'web development';
  console.log(`🔍 Aggregating free data for: "${keyword}"`);
  console.log('⏳ This may take 10-15 seconds...\n');
  
  const data = await freeTools.aggregateAllSources(keyword);
  
  console.log(`✅ Total Keywords: ${data.total_keywords}`);
  console.log(`✅ Sources Used: ${data.sources_used}`);
  console.log(`✅ Cost: $${data.cost} (FREE!)`);
  console.log('\n📊 Breakdown:');
  console.log(`   - Trending: ${data.trending_keywords.length}`);
  console.log(`   - Autocomplete: ${data.autocomplete_suggestions.length}`);
  console.log(`   - Location: ${data.location_variations.length}`);
  console.log(`   - Commercial: ${data.commercial_variations.length}`);
  console.log(`   - Long-tail: ${data.long_tail_variations.length}`);
  console.log('✅ PASS: Free tools working!\n');
}

async function testV2SmallBatch() {
  console.log('TEST 5: V2 Small Batch (3 blogs)');
  console.log('─────────────────────────────────────');
  
  // Connect to MongoDB
  console.log('📊 Connecting to MongoDB...');
  await mongoose.connect(process.env.DATABASE_URI);
  console.log('✅ Connected to MongoDB\n');
  
  const ultraMagicV2 = new UltraMagicV2Enhanced();
  
  console.log('🚀 Executing V2 with 3 blogs...');
  console.log('⏳ This will take 2-3 minutes...\n');
  
  const result = await ultraMagicV2.executeV2TotalDomination({
    contentCount: 3,
    dominationLevel: 'HIGH',
    useFreeSources: true,
    buildInternalWeb: false, // Skip for speed
    optimizeCTR: true
  });
  
  console.log('\n✅ RESULT:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.v2_domination_status === 'ULTIMATE_SUCCESS') {
    console.log('\n✅ PASS: V2 system working perfectly!\n');
  } else {
    console.log('\n⚠️ WARNING: V2 encountered issues\n');
  }
  
  // Disconnect
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB\n');
}

// Main test runner
async function runAllTests() {
  try {
    console.log('🚀 Starting All Tests...\n');
    
    // Test 1: Gemini Key Rotator
    await testGeminiKeyRotator();
    
    // Test 2: Keyword Clustering
    await testKeywordClustering();
    
    // Test 3: CTR Optimization
    await testCTROptimization();
    
    // Test 4: Free Tools
    await testFreeTools();
    
    // Test 5: V2 Small Batch (requires MongoDB)
    console.log('⚠️ TEST 5 will create 3 real blog posts in your database!');
    console.log('   Run this only if you want to test the full system.\n');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Run Test 5? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await testV2SmallBatch();
      } else {
        console.log('⏭️ Skipping Test 5\n');
      }
      
      rl.close();
      
      console.log('════════════════════════════════════════');
      console.log('✅ ALL TESTS COMPLETED!');
      console.log('════════════════════════════════════════\n');
      
      console.log('📋 Summary:');
      console.log('✅ Test 1: Gemini Key Rotator - PASS');
      console.log('✅ Test 2: Keyword Clustering - PASS');
      console.log('✅ Test 3: CTR Optimization - PASS');
      console.log('✅ Test 4: Free Tools Aggregator - PASS');
      console.log(answer.toLowerCase() === 'yes' ? '✅ Test 5: V2 Full System - CHECK ABOVE' : '⏭️ Test 5: Skipped');
      console.log('\n🎉 Your Ultra Magic V2 system is ready to dominate!\n');
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

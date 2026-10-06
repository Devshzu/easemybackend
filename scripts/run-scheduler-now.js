/**
 * ⏰ RUN SCHEDULER NOW
 * 
 * Manually triggers the Ultra Magic scheduler tasks
 * (normally runs automatically on schedule)
 * 
 * Usage: node scripts/run-scheduler-now.js
 */

import AutoRankingScheduler from '../src/services/auto-ranking-scheduler.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('⏰ ULTRA MAGIC SCHEDULER - MANUAL TRIGGER');
console.log('═══════════════════════════════════════════\n');

async function runSchedulerNow() {
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected!\n');
    
    // Initialize scheduler
    const scheduler = new AutoRankingScheduler();
    
    console.log('Choose what to run:\n');
    console.log('1. Golden Opportunity Ranking (normally every 6 hours)');
    console.log('   → Finds trending keywords and creates 3 strategic posts\n');
    
    console.log('2. Daily Ranking Optimization (normally daily at 2 AM)');
    console.log('   → Full SEO audit and optimization of existing posts\n');
    
    console.log('3. Weekly Strategy Update (normally Sundays at 1 AM)');
    console.log('   → Competitor analysis and strategy refresh\n');
    
    console.log('4. Content Monitoring (normally every 2 hours)');
    console.log('   → Updates existing blogs with new trends\n');
    
    console.log('5. Run ALL tasks\n');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter choice (1-5): ', async (answer) => {
      console.log('\n');
      
      try {
        switch(answer) {
          case '1':
            console.log('🌟 Running: Golden Opportunity Ranking...\n');
            await scheduler.executeGoldenOpportunityRanking();
            console.log('\n✅ Golden Opportunity Ranking completed!');
            break;
            
          case '2':
            console.log('📈 Running: Daily Ranking Optimization...\n');
            await scheduler.executeDailyRankingOptimization();
            console.log('\n✅ Daily Ranking Optimization completed!');
            break;
            
          case '3':
            console.log('🎯 Running: Weekly Strategy Update...\n');
            await scheduler.executeWeeklyRankingStrategy();
            console.log('\n✅ Weekly Strategy Update completed!');
            break;
            
          case '4':
            console.log('🔍 Running: Content Monitoring...\n');
            await scheduler.monitorAndOptimizeExistingContent();
            console.log('\n✅ Content Monitoring completed!');
            break;
            
          case '5':
            console.log('🚀 Running: ALL TASKS...\n');
            
            console.log('1/4: Golden Opportunity Ranking...');
            await scheduler.executeGoldenOpportunityRanking();
            console.log('✅ Done\n');
            
            console.log('2/4: Daily Ranking Optimization...');
            await scheduler.executeDailyRankingOptimization();
            console.log('✅ Done\n');
            
            console.log('3/4: Weekly Strategy Update...');
            await scheduler.executeWeeklyRankingStrategy();
            console.log('✅ Done\n');
            
            console.log('4/4: Content Monitoring...');
            await scheduler.monitorAndOptimizeExistingContent();
            console.log('✅ Done\n');
            
            console.log('✅ ALL TASKS completed!');
            break;
            
          default:
            console.log('❌ Invalid choice');
        }
        
        rl.close();
        
        console.log('\n═══════════════════════════════════════════');
        console.log('✅ SCHEDULER TASKS COMPLETED!');
        console.log('═══════════════════════════════════════════\n');
        
        console.log('💡 TIP: These tasks run automatically when scheduler is enabled');
        console.log('   Set AUTO_RANKING_SCHEDULER=true in .env to enable\n');
        
        await mongoose.disconnect();
        process.exit(0);
        
      } catch (error) {
        console.error('\n❌ Task failed:', error.message);
        rl.close();
        await mongoose.disconnect();
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  }
}

runSchedulerNow();

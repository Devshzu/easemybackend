import AutoRankingScheduler from './auto-ranking-scheduler.js';

let scheduler = null;

/**
 * Initialize and start the Ultra Magic SEO Scheduler
 */
export function initializeUltraMagicScheduler() {
  try {
    const enabled = process.env.AUTO_RANKING_SCHEDULER === 'true';
    
    if (!enabled) {
      console.log('⏸️  Ultra Magic Auto-Ranking Scheduler is DISABLED');
      console.log('   Set AUTO_RANKING_SCHEDULER=true in .env to enable');
      return;
    }

    console.log('🚀 Initializing Ultra Magic SEO Domination Scheduler...');
    
    scheduler = new AutoRankingScheduler();
    scheduler.start();
    
    console.log('✅ Ultra Magic SEO Scheduler initialized successfully!');
    console.log('📊 Scheduled tasks:');
    console.log('   - Golden Opportunity Ranking: Every 6 hours');
    console.log('   - Daily Ranking Optimization: Daily at 2 AM');
    console.log('   - Weekly Strategy Update: Sundays at 1 AM');
    console.log('   - Content Monitoring: Every 2 hours');
    
  } catch (error) {
    console.error('❌ Failed to initialize Ultra Magic Scheduler:', error);
  }
}

/**
 * Stop the Ultra Magic SEO Scheduler
 */
export function stopUltraMagicScheduler() {
  if (scheduler) {
    scheduler.stop();
    console.log('🛑 Ultra Magic Scheduler stopped');
  }
}

/**
 * Get scheduler instance
 */
export function getScheduler() {
  return scheduler;
}

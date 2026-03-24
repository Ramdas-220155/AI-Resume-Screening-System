// backend/scripts/import_google_jobs.js
require('dotenv').config({ path: '../.env' });
const { getCol, nowUTC } = require('../config/database');

async function importJobs() {
  console.log('🚀 Starting Google Jobs Import...');
  try {
    const jobs = await getCol('jobs');
    const googleJobs = [
      { 
        title: 'Software Engineer, Infrastructure, Quantum AI', 
        company: 'Google', 
        logo_emoji: '🔍', 
        type: 'full-time', 
        loc: 'Mountain View, CA', 
        level: 'mid', 
        salary: '$150K–$220K/yr', 
        skills: ['Python', 'Quantum Computing', 'C++', 'AI'],
        description: 'Develop next-generation infrastructure for Quantum AI at Google. Work on large-scale distributed systems and specialized hardware optimization.'
      },
      { 
        title: 'Senior Software Engineer, AI/ML (Ads Strategy)', 
        company: 'Google', 
        logo_emoji: '📈', 
        type: 'full-time', 
        loc: 'New York, NY', 
        level: 'senior', 
        salary: '$180K–$260K/yr', 
        skills: ['TensorFlow', 'Java', 'Machine Learning', 'BigQuery'],
        description: 'Join the Google Ads team to build and deploy advanced ML models that impact global commerce.'
      },
      { 
        title: 'Software Engineer III, Cloud Performance', 
        company: 'Google', 
        logo_emoji: '☁️', 
        type: 'full-time', 
        loc: 'Bangalore, India', 
        level: 'mid', 
        salary: '₹25L–₹45L/yr', 
        skills: ['Performance Tuning', 'Go', 'Linux', 'Distributed Systems'],
        description: 'Optimize the performance of Google’s Cloud infrastructure.'
      },
      { 
        title: 'Mobile Engineer, Google Translate', 
        company: 'Google', 
        logo_emoji: '🌐', 
        type: 'remote', 
        loc: 'Remote', 
        level: 'mid', 
        salary: '$140K–$200K/yr', 
        skills: ['Android', 'Kotlin', 'Mobile NLP'],
        description: 'Build real-time translation features for the Translate mobile team.'
      }
    ];

    let count = 0;
    for (const job of googleJobs) {
      const exists = await jobs.findOne({ title: job.title, company: 'Google' });
      if (!exists) {
        await jobs.insertOne({
          ...job,
          openings: 1,
          deadline: new Date(Date.now() + 60 * 86400000),
          score: Math.floor(Math.random() * 20) + 80,
          status: 'active',
          posted_by: 'system',
          posted_at: nowUTC(),
          updated_at: nowUTC(),
          is_aggregated: true
        });
        count++;
        console.log(`✅ [ADDED] ${job.title}`);
      } else {
        console.log(`ℹ️ [SKIPPED] ${job.title} (Already exists)`);
      }
    }
    console.log(`\n🎉 Successfully imported ${count} new Google jobs!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during import:', err);
    process.exit(1);
  }
}

importJobs();

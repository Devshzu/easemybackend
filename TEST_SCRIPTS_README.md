# 🧪 TEST SCRIPTS - QUICK GUIDE

Easy guide to test your Ultra Magic V2 system!

---

## 🎯 3 EASY TEST SCRIPTS

### **1. Quick Test** ⚡ (RECOMMENDED FIRST)
**Creates 3 blogs in 2-3 minutes**

```bash
npm run quick-test
```

**Perfect for:** First-time testing, quick verification

---

### **2. Full Component Test** 🧪
**Tests each component individually**

```bash
npm run test:ultra-magic
```

**Perfect for:** Detailed testing, debugging issues

---

### **3. Manual Scheduler** ⏰
**Run scheduler tasks on demand**

```bash
npm run run-scheduler
```

**Perfect for:** Testing automation, content updates

---

## 🚀 QUICK START (3 STEPS)

### **Step 1: Install**
```bash
cd backend
npm install cheerio
```

### **Step 2: Test**
```bash
npm run quick-test
```

### **Step 3: Verify**
- Check console for "✅ SUCCESS!"
- Look for 3 new blogs in MongoDB
- Verify no error messages

---

## ✅ WHAT EACH SCRIPT TESTS

### **Quick Test (`npm run quick-test`)**
- ✅ MongoDB connection
- ✅ Gemini API keys (all 4)
- ✅ Keyword discovery (2,000+ keywords)
- ✅ Keyword clustering (100 clusters)
- ✅ CTR optimization
- ✅ Content generation
- ✅ Schema markup
- ✅ Database saving
- ✅ Creates 3 complete blogs

**Time:** 2-3 minutes  
**Creates:** 3 blog posts  
**Database:** Yes, writes to MongoDB

---

### **Full Test (`npm run test:ultra-magic`)**
- ✅ Test 1: Gemini Key Rotator
  - Loads 4 keys
  - Tests round-robin rotation
  - Shows usage stats

- ✅ Test 2: Keyword Clustering
  - Takes 10 sample keywords
  - Groups into clusters
  - Shows cluster structure

- ✅ Test 3: CTR Optimization
  - Optimizes title for "web development"
  - Generates meta description
  - Shows CTR score

- ✅ Test 4: Free Tools Aggregator
  - Collects from 8 free sources
  - Shows keyword counts
  - Displays breakdown

- ✅ Test 5: V2 Full System (optional)
  - Creates 3 real blogs
  - Full integration test
  - Asks permission first

**Time:** 5-10 minutes (all tests)  
**Creates:** 3 blogs (if you say yes to Test 5)  
**Database:** Only if you run Test 5

---

### **Scheduler Test (`npm run run-scheduler`)**
Interactive menu:

**1. Golden Opportunity Ranking**
- Finds trending keywords
- Creates 3 strategic posts
- Time: 5-7 minutes

**2. Daily Ranking Optimization**
- Audits existing posts
- Optimizes content
- Fixes issues
- Time: 3-5 minutes

**3. Weekly Strategy Update**
- Analyzes competitors
- Updates strategy
- Finds content gaps
- Time: 2-3 minutes

**4. Content Monitoring**
- Updates old blogs
- Adds new trends
- Refreshes content
- Time: 1-2 minutes

**5. Run ALL Tasks**
- Runs all 4 above
- Time: 10-15 minutes

**Time:** Varies by choice  
**Creates:** New blogs (option 1 only)  
**Database:** Yes, reads and writes

---

## 📊 EXPECTED OUTPUT

### **Quick Test Success:**
```
⚡ ULTRA MAGIC V2 - QUICK TEST
═══════════════════════════════════════════

📊 Connecting to MongoDB...
✅ Connected!

🚀 Creating 3 ultra-optimized blog posts...
⏳ This will take 2-3 minutes...

Progress:
🔑 Gemini Key Rotator initialized with 4 keys
📊 PHASE 1: Mega Keyword Discovery...
✅ Discovered 2000 mega keywords
🎯 PHASE 2: Advanced Keyword Clustering...
✅ Created 100 keyword clusters
📝 PHASE 3: Ultra-Optimized Content Generation...

[1/3] Generated: 10 Ultimate Web Development Secrets | 2026
[2/3] Generated: Best Mobile App Development Guide | 2026
[3/3] Generated: Complete Digital Marketing Strategies

═══════════════════════════════════════════
✅ QUICK TEST COMPLETED!
═══════════════════════════════════════════

📊 RESULTS:
   Status: ULTIMATE_SUCCESS
   Blogs Created: 3
   Keywords Targeted: 45
   Avg Keywords/Post: 15.0

🎉 SUCCESS! Your V2 system is working perfectly!
```

---

## ❌ COMMON ERRORS & FIXES

### **Error 1: "Cannot find module 'cheerio'"**
```bash
npm install cheerio
```

### **Error 2: "MongoDB connection failed"**
Check `.env` file:
```env
DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### **Error 3: "Gemini API error 401"**
Check Gemini keys in `.env`:
```env
GEMINI_KEY_1=your_key_here
GEMINI_KEY_2=your_key_here
GEMINI_KEY_3=your_key_here
GEMINI_KEY_4=your_key_here
```

### **Error 4: "Request timed out"**
- Slow internet connection
- Gemini API slow (normal)
- Try again during off-peak hours

---

## 🎯 WHICH TEST SHOULD I USE?

### **Use Quick Test When:**
- ✅ First time testing
- ✅ Quick verification needed
- ✅ Want to see actual blog posts
- ✅ Testing before full run

### **Use Full Test When:**
- ✅ Debugging issues
- ✅ Testing specific components
- ✅ Detailed analysis needed
- ✅ Component-by-component verification

### **Use Scheduler Test When:**
- ✅ Testing automation
- ✅ Running scheduler manually
- ✅ Want specific task only
- ✅ Testing content updates

---

## 📋 TESTING WORKFLOW

**Recommended testing order:**

```
1. Install dependencies
   → npm install cheerio

2. Run Quick Test
   → npm run quick-test
   → Verify 3 blogs created

3. Check blogs in MongoDB
   → Verify content quality
   → Check all fields present

4. Run Full Test (optional)
   → npm run test:ultra-magic
   → Skip Test 5 if Quick Test passed

5. Test Scheduler (optional)
   → npm run run-scheduler
   → Try option 1 (fastest)

6. Ready for production!
   → Start server: npm start
   → Run full: 100 blogs
```

---

## 🚀 AFTER SUCCESSFUL TESTING

### **Next Steps:**

1. **Enable Auto-Scheduler:**
   ```env
   AUTO_RANKING_SCHEDULER=true
   ```

2. **Start Server:**
   ```bash
   npm start
   ```

3. **Run Full Domination:**
   ```bash
   curl -X POST http://localhost:8080/api/ultra-magic-v2/execute-v2-domination \
     -H "Content-Type: application/json" \
     -d '{"contentCount":100}'
   ```

4. **Monitor Results:**
   ```bash
   curl http://localhost:8080/api/ultra-magic-v2/v2-dashboard
   ```

---

## 💡 PRO TIPS

1. **Always test with 3 blogs first**
   - Quick verification
   - Low risk
   - Fast feedback

2. **Check MongoDB during test**
   - Open MongoDB Compass
   - Watch blogs being created
   - Verify in real-time

3. **Save test output**
   - Copy console output
   - Useful for debugging
   - Compare with expected

4. **Test during off-peak**
   - Faster Gemini API
   - Better performance
   - Quicker results

5. **Backup before testing**
   - Export MongoDB database
   - Can restore if needed
   - Safety first

---

## 📞 QUICK COMMANDS

```bash
# Install
npm install cheerio

# Test (pick one)
npm run quick-test           # Fastest, 3 blogs
npm run test:ultra-magic     # Detailed, components
npm run run-scheduler        # Manual scheduler

# Start server
npm start

# Check dashboard (after server starts)
curl http://localhost:8080/api/ultra-magic-v2/v2-dashboard

# Check blogs
curl http://localhost:8080/api/blogs?limit=10
```

---

## 🎊 YOU'RE READY TO TEST!

**Choose your test script and start dominating!** 🚀💪🔥

**Recommended:** Start with `npm run quick-test`!

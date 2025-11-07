# 🚀 Quick Start: Manual Testing T067-T073

## ⚡ 5-Minute Setup

### 1. Verify Environment
```bash
cd /home/lunareclipse/zakapp/specs/008-nisab-year-record
./manual-testing-helper.sh
# Select option 1: Check environment
```

### 2. Open Testing Guide
```bash
# In VS Code
code MANUAL_TESTING_EXECUTION_GUIDE.md

# Or in browser
xdg-open MANUAL_TESTING_EXECUTION_GUIDE.md
```

### 3. Verify Servers Running
- Backend: http://localhost:5000 (check health endpoint)
- Frontend: http://localhost:3000 (should load dashboard)

### 4. Test User Login
- Navigate to: http://localhost:3000/login
- If no user exists: http://localhost:3000/register

---

## 📋 Test Execution Order

### ✅ Prerequisites (5 min)
- [ ] Servers running
- [ ] Test user created
- [ ] Assets ready (need >$6000 total)

### 🔬 Core Tests (~45 min)
1. **T067** - Nisab Achievement (10 min)
   - Add assets until total > Nisab
   - Verify DRAFT record created
   - Check Dashboard shows Hawl

2. **T068** - Live Tracking (8 min)
   - Edit asset value
   - Verify wealth updates in real-time
   - Confirm not persisted

3. **T069** - Hawl Interruption (7 min)
   - Delete high-value asset
   - Verify interruption detected
   - Check Dashboard updated

4. **T070** - Finalization (10 min)
   - Simulate Hawl completion (helper script option 5)
   - Test finalization workflow
   - Verify record locked

5. **T071** - Unlock & Edit (8 min)
   - Unlock with reason
   - Make edits
   - Re-finalize
   - Check audit trail

6. **T072** - Invalid Operations (5 min)
   - Test premature finalization
   - Test invalid transitions
   - Verify error messages

7. **T073** - Nisab Calculation (7 min)
   - Test gold/silver standards
   - Verify price caching
   - Check API fallback

### 🎯 Validation (~45 min)
- [ ] Performance tests (15 min)
- [ ] Accessibility checks (20 min)
- [ ] Islamic compliance (10 min)

---

## 🛠️ Helper Script Commands

```bash
./manual-testing-helper.sh

Menu Options:
1. Check environment (servers, database)
2. Show test users
3. Show Nisab Year Records
4. Show precious metal prices cache
5. Simulate Hawl completion (for T070) ⭐
6. Trigger Hawl detection job
7. Open testing guide
8. View backend logs
0. Exit
```

---

## 🐛 Quick Troubleshooting

### Servers Not Running
```bash
cd /home/lunareclipse/zakapp
npm run server:dev   # Terminal 1
npm run client:dev   # Terminal 2
```

### No DRAFT Record Created
```bash
# Option A: Use helper script
./manual-testing-helper.sh
# Select option 6: Trigger Hawl detection

# Option B: Manual trigger
curl -X POST http://localhost:5000/api/jobs/hawl-detection/trigger
```

### Can't Finalize (T070)
```bash
# Use helper script
./manual-testing-helper.sh
# Select option 5: Simulate Hawl completion
```

---

## 📊 Success Checklist

- [ ] All 7 scenarios passed
- [ ] No critical bugs found
- [ ] Performance targets met
- [ ] Accessibility verified
- [ ] Islamic compliance confirmed
- [ ] Test report completed
- [ ] Issues logged (if any)
- [ ] Sign-off completed

---

## 📝 After Testing

### Update Tasks
```bash
cd /home/lunareclipse/zakapp
# Mark T067-T073 as complete in tasks.md
```

### Create Commit
```bash
git add specs/008-nisab-year-record/MANUAL_TESTING_EXECUTION_GUIDE.md
git commit -m "test(008): Complete manual testing T067-T073 - All passed"
```

---

## 🎯 Critical Success Factors

1. **Hawl Start**: DRAFT record auto-created when wealth > Nisab
2. **Live Tracking**: Values update <5s, no DB persistence
3. **Finalization**: Only after 354 days, becomes immutable
4. **Audit Trail**: All unlock/edit events logged
5. **Error Handling**: Clear messages for invalid operations

---

## 📞 Get Help

- **Full Guide**: `MANUAL_TESTING_EXECUTION_GUIDE.md`
- **Helper Script**: `./manual-testing-helper.sh`
- **Spec**: `spec.md`
- **Backend Logs**: `/tmp/zakapp-backend.log`

---

**Time Required**: ~90 minutes  
**Can Split**: Yes (do T067-T069 in session 1, T070-T073 in session 2)  
**Priority**: HIGH (required before production)

Good luck! 🚀

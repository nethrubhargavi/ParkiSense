# Testing Checklist - Parkinson's Physical Examination Module

## Pre-Testing Setup
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Webcam connected and functional
- [ ] Microphone connected and functional
- [ ] Testing in supported browser (Chrome/Firefox/Edge)

---

## Backend API Testing

### Health Check
- [ ] Navigate to `http://localhost:8000`
- [ ] Verify JSON response shows "status": "online"
- [ ] Verify all endpoints are listed

### Hand Tremor Endpoint
- [ ] POST to `http://localhost:8000/run-tremor-test`
- [ ] Verify response contains "status" field
- [ ] Verify response contains "console_output" or error details

### Voice Test Endpoint
- [ ] POST to `http://localhost:8000/run-voice-test`
- [ ] Verify response contains "status" field
- [ ] Verify response contains "console_output" or error details

### Face Test Endpoint
- [ ] POST to `http://localhost:8000/run-face-test` with video file
- [ ] Verify response contains "blink_rate"
- [ ] Verify response contains "blink_count"
- [ ] Verify response contains "confidence"
- [ ] Verify response contains "interpretation"

---

## Frontend UI Testing

### Page Load
- [ ] Navigate to `http://localhost:5173`
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Three assessment cards visible
- [ ] Footer disclaimer visible

### Responsive Design
- [ ] Test on full screen
- [ ] Test on tablet size (768px)
- [ ] Test on mobile size (375px)
- [ ] Cards stack properly on smaller screens

---

## Hand Tremor Assessment

### Camera Access
- [ ] Click "Start Camera"
- [ ] Browser prompts for camera permission
- [ ] Grant permission
- [ ] Video preview appears
- [ ] Status shows "Camera ready"

### Camera Controls
- [ ] Video displays live feed
- [ ] "Stop Camera" button works
- [ ] Stopping camera releases device
- [ ] Can restart camera successfully

### Test Execution
- [ ] "Run Tremor Test" button is clickable when camera is active
- [ ] Status changes to "Processing..."
- [ ] Button is disabled during processing
- [ ] Results panel appears after processing
- [ ] Console output is displayed
- [ ] Can run test multiple times

### Error Handling
- [ ] Test without starting camera (should show appropriate message)
- [ ] Test with backend offline (should show network error)
- [ ] Deny camera permission (should show access denied message)

---

## Voice Tremor Assessment

### Microphone Access
- [ ] Click "Start Recording"
- [ ] Browser prompts for microphone permission
- [ ] Grant permission
- [ ] Recording indicator appears
- [ ] Status shows "Recording..."

### Recording Controls
- [ ] Timer counts from 0 to 5 seconds
- [ ] Recording stops automatically at 5 seconds
- [ ] "Stop Recording" button works manually
- [ ] Recording indicator animation is visible
- [ ] Status updates appropriately

### Audio Analysis
- [ ] "Analyze Voice" button appears after recording
- [ ] Button is clickable
- [ ] Status changes to "Processing..."
- [ ] Results panel appears
- [ ] Metrics are displayed (Jitter, Shimmer, F0, Confidence)
- [ ] Console output is shown

### Error Handling
- [ ] Test without recording (should show "No recording available")
- [ ] Test with backend offline (should show network error)
- [ ] Deny microphone permission (should show access denied)
- [ ] Can record and analyze multiple times

---

## Facial Assessment

### Camera Setup
- [ ] Click "Start Camera"
- [ ] Front camera is used (user-facing)
- [ ] Video preview appears
- [ ] Status shows "Camera ready"

### Recording
- [ ] Click "Start Recording"
- [ ] Recording indicator appears (red REC badge)
- [ ] Timer counts from 0 to 10 seconds
- [ ] Recording stops automatically at 10 seconds
- [ ] Can manually stop recording
- [ ] Video is captured for analysis

### Face Analysis
- [ ] "Run Face Analysis" button appears after recording
- [ ] Button is clickable
- [ ] Status shows "Processing..."
- [ ] Progress indicator visible during processing
- [ ] Results panel appears after processing

### Results Display
- [ ] Blink rate displayed (blinks/min)
- [ ] Total blink count shown
- [ ] Confidence percentage shown
- [ ] Duration in seconds shown
- [ ] Clinical interpretation displayed
- [ ] Reference ranges shown (Normal: 15-20 blinks/min)
- [ ] Technical details visible

### Error Handling
- [ ] Test without recording (should show "No recording available")
- [ ] Test with backend offline (should show network error)
- [ ] Test with no face visible (should handle gracefully)
- [ ] Can record and analyze multiple times

---

## Cross-Component Testing

### Multiple Tests
- [ ] Run hand tremor test
- [ ] Run voice test
- [ ] Run face assessment
- [ ] All three can run independently
- [ ] Results persist when viewing other components

### State Management
- [ ] Camera/microphone resources released properly
- [ ] No memory leaks during repeated tests
- [ ] UI remains responsive

### Navigation
- [ ] All components visible simultaneously
- [ ] Scrolling works on smaller screens
- [ ] No overlapping elements

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] Camera/microphone access works
- [ ] Video recording works
- [ ] UI renders correctly

### Firefox
- [ ] All features work
- [ ] Camera/microphone access works
- [ ] Video recording works
- [ ] UI renders correctly

### Edge
- [ ] All features work
- [ ] Camera/microphone access works
- [ ] Video recording works
- [ ] UI renders correctly

### Safari (if applicable)
- [ ] All features work
- [ ] Camera/microphone access works
- [ ] Video recording works
- [ ] UI renders correctly

---

## Performance Testing

### Backend
- [ ] API responds within 2 seconds for health check
- [ ] Tremor test completes within reasonable time
- [ ] Voice test completes within reasonable time
- [ ] Face test completes within 30 seconds

### Frontend
- [ ] Page loads within 3 seconds
- [ ] Camera starts within 2 seconds
- [ ] UI remains responsive during processing
- [ ] No console errors during normal operation

---

## Security Testing

### Camera/Microphone Privacy
- [ ] Permissions requested appropriately
- [ ] Streams stopped when not in use
- [ ] No background recording

### Data Handling
- [ ] No data sent to external servers
- [ ] Recordings not saved persistently
- [ ] CORS configured correctly for localhost only

---

## Error Recovery

### Network Interruption
- [ ] Test with backend stopped
- [ ] Appropriate error messages shown
- [ ] Can recover when backend restarts

### Device Disconnect
- [ ] Unplug camera during operation
- [ ] Appropriate error shown
- [ ] Can reconnect when device available

### Browser Refresh
- [ ] Refresh page during operation
- [ ] State resets cleanly
- [ ] No hanging connections

---

## Accessibility

### Keyboard Navigation
- [ ] Can tab through all buttons
- [ ] Enter key activates buttons
- [ ] Focus indicators visible

### Screen Reader (if applicable)
- [ ] Labels are descriptive
- [ ] Status messages announced
- [ ] Error messages clear

### Visual
- [ ] Text is readable (minimum 14px)
- [ ] Color contrast sufficient
- [ ] Status indicators clear

---

## Documentation Verification

### README.md
- [ ] Installation instructions accurate
- [ ] Run commands work as documented
- [ ] API endpoints documented correctly
- [ ] Troubleshooting section helpful

### VS_CODE_QUICKSTART.md
- [ ] Step-by-step instructions work
- [ ] Screenshots/descriptions accurate
- [ ] Common issues addressed

### Code Comments
- [ ] Python code has docstrings
- [ ] React components have explanatory comments
- [ ] Complex logic is explained

---

## Production Readiness Checklist

### Code Quality
- [ ] No console.log statements in production code
- [ ] Error handling implemented throughout
- [ ] No hardcoded values (use constants)
- [ ] Code follows consistent style

### Configuration
- [ ] Environment variables documented
- [ ] CORS configured appropriately
- [ ] API endpoints configurable

### Deployment Preparation
- [ ] Build process documented
- [ ] Dependencies version-locked
- [ ] Production build tested (`npm run build`)

---

## Sign-Off

| Test Category | Status | Tester | Date | Notes |
|--------------|--------|--------|------|-------|
| Backend API | ⬜ | | | |
| Frontend UI | ⬜ | | | |
| Hand Tremor | ⬜ | | | |
| Voice Test | ⬜ | | | |
| Face Assessment | ⬜ | | | |
| Cross-Browser | ⬜ | | | |
| Performance | ⬜ | | | |
| Documentation | ⬜ | | | |

**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ NEEDS REVISION

**Critical Issues:**
- 

**Recommended Improvements:**
- 

**Approved for:** ⬜ Development / ⬜ Staging / ⬜ Production

---

**Tester Signature:** _________________ **Date:** _________

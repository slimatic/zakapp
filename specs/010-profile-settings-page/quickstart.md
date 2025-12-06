# Quickstart: Profile Settings Page Verification

**Feature**: 010-profile-settings-page  
**Date**: 2025-12-05  
**Purpose**: Manual verification guide for all profile settings functionality

---

## Prerequisites

1. **Start the development servers**:
   ```bash
   cd /home/agentx/github-repos/zakapp
   npm run dev:backend    # Terminal 1: Start backend on port 5000
   npm run dev:frontend   # Terminal 2: Start frontend on port 3000
   ```

2. **Create or use test account**:
   - Navigate to http://localhost:3000/register
   - Register with test credentials (e.g., testuser / test@example.com / Test1234!)
   - Or login with existing test account

3. **Navigate to Profile Settings**:
   - Click user avatar/menu in top-right
   - Select "Profile Settings" or navigate to http://localhost:3000/profile

---

## Tab 1: Profile Information (T005)

### Test Scenario 1.1: View Current Profile
**Steps**:
1. Open Profile Information tab (should be default)
2. Verify username field shows current username
3. Verify email field shows current email
4. Verify currency dropdown shows saved preference
5. Verify Zakat methodology dropdown shows saved preference
6. Verify calendar type dropdown shows saved preference
7. Verify language dropdown shows saved preference

**Expected**: All fields populated with current user data

### Test Scenario 1.2: Edit Username
**Steps**:
1. Change username to a new unique value
2. Click "Save Changes"
3. Wait for success message

**Expected**: 
- ✅ Success message appears for 5 seconds
- ✅ Username is updated

### Test Scenario 1.3: Username Already Taken (Edge Case)
**Steps**:
1. Change username to "admin" or another known existing username
2. Click "Save Changes"

**Expected**: Error message "Username already taken" displayed

### Test Scenario 1.4: Edit Preferences
**Steps**:
1. Change currency to SAR
2. Change Zakat methodology to Hanafi
3. Change calendar type to Hijri (Lunar)
4. Change language to Arabic
5. Click "Save Changes"

**Expected**:
- ✅ Success message appears
- ✅ All preferences saved
- ✅ Calendar explanation text visible ("354 days/year")

---

## Tab 2: Security (T006)

### Test Scenario 2.1: Change Password Successfully
**Steps**:
1. Click Security tab
2. Enter current password
3. Enter new password (8+ characters)
4. Enter matching confirm password
5. Click "Change Password"

**Expected**:
- ✅ Success message "Password changed successfully!"
- ✅ All password fields cleared
- ✅ Can login with new password

### Test Scenario 2.2: Wrong Current Password
**Steps**:
1. Enter incorrect current password
2. Enter valid new password
3. Enter matching confirm password
4. Click "Change Password"

**Expected**: Error message "Current password is incorrect"

### Test Scenario 2.3: Password Mismatch
**Steps**:
1. Enter correct current password
2. Enter new password
3. Enter different confirm password
4. Click "Change Password"

**Expected**: Alert/error "New passwords do not match"

### Test Scenario 2.4: Password Too Short
**Steps**:
1. Enter correct current password
2. Enter new password with only 5 characters
3. Enter matching confirm password
4. Click "Change Password"

**Expected**: Alert/error about minimum 8 characters

### Test Scenario 2.5: Two-Factor Authentication
**Steps**:
1. View 2FA section
2. Check SMS Authentication option
3. Check Authenticator App option

**Expected**:
- ✅ Both options show "Coming Soon" button
- ✅ Buttons are disabled

---

## Tab 3: Privacy & Data (T007)

### Test Scenario 3.1: View Privacy Status
**Steps**:
1. Click Privacy & Data tab
2. View Data Encryption status
3. View Local Data Storage status

**Expected**:
- ✅ Data Encryption shows "✅ Enabled"
- ✅ Local Data Storage shows "✅ Active"
- ✅ Both are read-only (no toggle)

### Test Scenario 3.2: Toggle Usage Statistics
**Steps**:
1. Locate Anonymous Usage Statistics toggle
2. Toggle on/off

**Expected**:
- ✅ Toggle is interactive
- ✅ State changes visually

### Test Scenario 3.3: Export Data
**Steps**:
1. Click "Export Data" button
2. Wait for processing

**Expected**:
- ✅ Loading/processing message appears
- ✅ JSON file downloads automatically
- ✅ File contains user profile, assets, calculations, payments

### Test Scenario 3.4: View Data Retention Policy
**Steps**:
1. Scroll to Data Retention section
2. Read policy information

**Expected**:
- ✅ Yellow warning box visible
- ✅ Explains data retained indefinitely
- ✅ Mentions account deletion as removal method

---

## Tab 4: Danger Zone (T008)

### Test Scenario 4.1: View Deletion Warning
**Steps**:
1. Click Danger Zone tab
2. View warning content

**Expected**:
- ✅ Red/danger styling visible
- ✅ Warning about irreversible action
- ✅ List of considerations (export, calculations, history)

### Test Scenario 4.2: Cancel First Confirmation
**Steps**:
1. Click "Delete Account Permanently"
2. Click "Cancel" on confirmation dialog

**Expected**: Dialog closes, no action taken

### Test Scenario 4.3: Cancel Second Confirmation
**Steps**:
1. Click "Delete Account Permanently"
2. Click "OK" on first confirmation
3. Type something other than "DELETE"
4. Click OK or Cancel

**Expected**: Deletion cancelled, account remains

### Test Scenario 4.4: Complete Account Deletion
**Steps**:
1. Click "Delete Account Permanently"
2. Click "OK" on first confirmation
3. Type exactly "DELETE"
4. Click OK

**Expected**:
- ✅ Account deleted
- ✅ Redirected to home page
- ✅ Cannot login with deleted credentials

---

## Tab Navigation & General UX (T009)

### Test Scenario 5.1: Tab Navigation
**Steps**:
1. Click each tab in sequence: Profile → Security → Privacy → Danger

**Expected**:
- ✅ Content switches correctly
- ✅ Active tab visually indicated (blue border/text)
- ✅ Previous tab content hidden

### Test Scenario 5.2: Authentication Requirement
**Steps**:
1. Logout
2. Try to access /profile directly

**Expected**: Redirected to login page

### Test Scenario 5.3: Loading States
**Steps**:
1. Trigger a save operation (profile update, password change)
2. Observe button during processing

**Expected**:
- ✅ Loading spinner visible
- ✅ Button disabled during operation

### Test Scenario 5.4: Error Display
**Steps**:
1. Disconnect network or stop backend
2. Try to save changes

**Expected**:
- ✅ Error message displayed clearly
- ✅ User can retry operation

---

## Verification Checklist

| Task | Scenarios | Status |
|------|-----------|--------|
| T005 | 1.1, 1.2, 1.3, 1.4 | ⬜ |
| T006 | 2.1, 2.2, 2.3, 2.4, 2.5 | ⬜ |
| T007 | 3.1, 3.2, 3.3, 3.4 | ⬜ |
| T008 | 4.1, 4.2, 4.3, 4.4 | ⬜ |
| T009 | 5.1, 5.2, 5.3, 5.4 | ⬜ |

---

## Issue Reporting

If any scenario fails, document:
1. **Scenario ID**: e.g., 2.2
2. **Expected behavior**: What should happen
3. **Actual behavior**: What happened
4. **Screenshots**: If applicable
5. **Console errors**: Browser developer tools output

Report issues as new tasks with prefix T010+.

---

*Quickstart guide created as part of /plan command execution*

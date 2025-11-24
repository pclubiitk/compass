# Pull Request Review Summary

## Overview
This document provides a comprehensive review of all open pull requests in the pclubiitk/compass repository as of November 24, 2025.

---

## PR #17: Implemented HEIC Issue Solution and Image Storage After Moderation
**Status:** Open (Non-Draft) | **Author:** ritgit24 | **Created:** Nov 2, 2025

### Summary
Implements HEIC image format support using go-webp encoder and adds automated image moderation workflow with email notifications.

### Key Changes
1. **HEIC Image Conversion**
   - Uses `github.com/kolesa-team/go-webp/encoder` and `github.com/strukturag/libheif`
   - Decodes HEIC files in-memory and converts directly to WebP format
   - Stores converted images in tmp folder for moderation

2. **Moderation Workflow**
   - Images are automatically sent for moderation after upload
   - Rejected images: flagged in DB, user receives violation warning email, image stays in tmp
   - Approved images: moved from tmp to public folder, user receives thank you email

3. **Docker Changes**
   - Added libheif dependencies (libde265, libx265, libheif1)
   - Built libheif v1.18.2 from source in multi-stage Dockerfile

4. **Email Templates**
   - Removed username from email templates (changed from `Hi {username}` to `Hi`)

### Concerns & Recommendations

#### 🔴 Critical Issues
1. **Security Vulnerabilities in Dependencies**
   - The PR adds `github.com/MaestroError/go-libheif v0.3.0` and `github.com/strukturag/libheif v1.16.2`
   - These dependencies should be checked for known vulnerabilities
   - **Action Required:** Run security audit before merging

2. **Indentation & Formatting Issues**
   - File: `server/workers/moderator.go`
   - Inconsistent indentation (mix of spaces and tabs)
   - Missing error handling in some paths
   - **Action Required:** Run `go fmt` and fix formatting

3. **Duplicate Code**
   - User lookup code is duplicated in both flagged and approved paths
   - **Recommendation:** Extract into helper function

#### 🟡 Medium Priority
1. **Error Handling**
   - Missing proper error handling for `json.Marshal(mailJob)`
   - Should check error before calling `PublishJob`
   
2. **Database Transaction Safety**
   - Image status updates and file movements should be atomic
   - Consider using DB transactions to prevent inconsistent state

3. **Configuration**
   - Hardcoded moderation queue name ("moderation")
   - Should be configurable via environment variable

#### 🟢 Positive Aspects
- Solves a real problem (HEIC format not supported)
- Well-documented with clear commit messages
- Implements complete workflow from upload to moderation

### Recommendation: **Request Changes**
- Fix formatting and indentation issues
- Add proper error handling
- Refactor duplicate code
- Add tests for HEIC conversion logic

---

## PR #16: Fix Build Errors
**Status:** Open (Non-Draft) | **Author:** Muragesh-24 | **Created:** Nov 2, 2025

### Summary
Fixes TypeScript build errors, adds email validation for IIT Kanpur addresses, and improves code quality with proper typing.

### Key Changes
1. **TypeScript Fixes**
   - Fixed `window.mapRef` and `window.markerRef` type declarations in `global.d.ts`
   - Added proper typing for `CustomEvent<{ lng: number; lat: number }>`
   - Removed unused variables and imports

2. **Email Validation**
   - Added client-side validation to restrict logins/signups to `@iitk.ac.in` emails
   - Added server-side validation in signup handler

3. **Component Improvements**
   - Wrapped pages in `Suspense` with proper loader fallbacks
   - Fixed ESLint warnings with proper type annotations
   - Improved error handling with proper error type checking

### Concerns & Recommendations

#### 🟡 Medium Priority
1. **Duplicate Validation Logic**
   - Email validation exists in both client and server
   - Frontend: `components/signup/Step1Register.tsx`
   - Backend: `server/auth/handler.signup.go`
   - Backend also has login validation that frontend doesn't have
   - **Recommendation:** Ensure consistency across all validation points

2. **Type Safety**
   - Some places still use `any` type with ESLint disable comments
   - Example: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
   - **Recommendation:** Create proper interfaces instead of using `any`

3. **Unused Variable**
   - In `app/(maps)/noticeboard/ShareDialog.tsx`: removed `shareText` but it might be needed
   - **Recommendation:** Verify this was intentional

#### 🟢 Positive Aspects
- Comprehensive TypeScript fixes
- Good use of Suspense for loading states
- Added both client and server-side validation
- Proper global type declarations

### Recommendation: **Approve with Minor Suggestions**
- Consider creating shared validation utilities
- Replace remaining `any` types with proper interfaces
- Otherwise, this is a solid improvement

---

## PR #15: Implemented Add Location Drawer Caching and Incremental Location API
**Status:** Open (Non-Draft) | **Author:** Utk1896 | **Created:** Nov 2, 2025

### Summary
Major refactor of the maps feature with SWR caching, incremental API fetching, and improved UI with color-coded markers.

### Key Changes
1. **SWR Integration**
   - Added `SWRProvider.tsx` with localStorage cache persistence
   - Created `useLocations.ts` custom hook for data fetching
   - Implements incremental updates with `?since` parameter

2. **Backend Incremental API**
   - New endpoint: `/api/maps/locations` with `since` query parameter
   - Returns `{locations, deleted, lastFetchTime}`
   - Tracks updates and deletions efficiently

3. **Map Improvements**
   - Color-coded markers by location type (food, lecturehall, hostel, admin, recreation)
   - Pulsating user location marker
   - Zoom-based marker scaling
   - Animated marker clicks

4. **Layout Changes**
   - Moved map to layout component for persistence
   - AddLocationDrawer portal rendered outside map tree
   - Drawer isolation prevents map re-renders

5. **Location Detail Page**
   - Responsive grid layout (5 columns on large screens)
   - Better image gallery display
   - Improved mobile experience

### Concerns & Recommendations

#### 🔴 Critical Issues
1. **Gitignore Corruption**
   - File: `.gitignore`
   - Last line changed from `/server/parser/*.sql` to `/server/parser/*.sql package-lock.json`
   - This looks like an accidental merge/edit
   - **Action Required:** Fix this immediately

2. **Type Safety Issues**
   - Heavy use of `any` types:
     - `window.mapRef` cast as `any`
     - `locations: any[]` in Map component
     - `data.updated || data.locations || []` could have type issues
   - **Recommendation:** Create proper interfaces for all API responses

3. **localStorage Dependencies**
   - Heavy reliance on localStorage without error handling
   - If localStorage is full or disabled, app may break
   - **Recommendation:** Add try-catch blocks and fallback behavior

#### 🟡 Medium Priority
1. **Performance Concerns**
   - `renderMarkers` creates React roots for every marker icon
   - This could be slow with many locations
   - **Recommendation:** Consider using canvas or WebGL for marker rendering, or cache the icon elements

2. **Cache Staleness**
   - 5-minute refresh interval might be too long for real-time updates
   - No manual refresh option for users
   - **Recommendation:** Add pull-to-refresh or manual refresh button

3. **Error Handling**
   - Missing error handling in many places:
     - SWR fallback doesn't handle network errors well
     - Map initialization failures not handled
   - **Recommendation:** Add error boundaries and user-friendly error messages

4. **Incremental API Logic**
   - Backend merges updated and deleted locations
   - Frontend also does merging in `useLocations`
   - This duplicates logic and could cause bugs
   - **Recommendation:** Simplify by doing merge in one place only

#### 🟢 Positive Aspects
- Excellent UX improvements with color-coded markers
- Smart caching strategy with incremental updates
- Clean separation of concerns
- Good use of React hooks and SWR
- Responsive design improvements

### Recommendation: **Request Changes**
- **Must fix:** `.gitignore` corruption
- Add proper TypeScript interfaces
- Improve error handling
- Add tests for cache merging logic

---

## PR #14: Implemented Refresh Token Feature
**Status:** Open (Non-Draft) | **Author:** Muragesh-24 | **Created:** Oct 27, 2025

### Summary
Implements JWT refresh token pattern for better security and user experience.

### Key Changes
1. **Token Generation**
   - Split token generation into `GenerateAccessToken` and `GenerateRefreshToken`
   - Access token: 5-minute lifetime
   - Refresh token: 7-day lifetime

2. **Cookie Management**
   - Added `SetRefreshCookie` function
   - Both tokens stored as HTTP-only cookies
   - `ClearAuthCookie` now clears both tokens

3. **Authentication Flow**
   - `UserAuthenticator` middleware tries refresh token if access token fails
   - `tryRefresh` function validates refresh token and issues new access token
   - Login and verify handlers now return both tokens

### Concerns & Recommendations

#### 🔴 Critical Issues
1. **Code Quality Issues**
   - Missing semicolons in Go code (unusual for Go)
   - Commented-out code left in:
     ```go
     // claims, ok := token.Claims.(jwt.MapClaims)
     // if !ok {
     // 	c.AbortWithStatusJSON(...)
     // }
     ```
   - **Action Required:** Remove commented code and fix formatting

2. **Security Concerns**
   - `tryRefresh` uses hardcoded role: `role := int(model.UserRole)`
   - Should fetch actual role from database
   - Refresh token doesn't include role or verified status
   - **Action Required:** Fetch user data from DB during refresh

3. **Error Handling**
   - Multiple error assignments to same variable without checking:
     ```go
     accessToken, err := middleware.GenerateAccessToken(...)
     refreshToken, err := middleware.GenerateRefreshToken(...) // overwrites err!
     ```
   - **Action Required:** Use different variable names or check err after each call

#### 🟡 Medium Priority
1. **Token Revocation**
   - No mechanism to revoke refresh tokens
   - If token is stolen, it remains valid for 7 days
   - **Recommendation:** Add refresh token to database with revocation support

2. **Token Rotation**
   - Refresh tokens are not rotated on use
   - Industry best practice is to issue new refresh token on each refresh
   - **Recommendation:** Implement refresh token rotation

3. **Rate Limiting**
   - No rate limiting on token refresh endpoint
   - Could be abused for DoS attacks
   - **Recommendation:** Add rate limiting middleware

4. **Testing**
   - No tests for token refresh logic
   - This is critical authentication code
   - **Recommendation:** Add comprehensive tests

#### 🟢 Positive Aspects
- Solves real UX problem (session timeouts)
- Follows JWT best practices (short-lived access tokens)
- Good separation of concerns

### Recommendation: **Request Changes**
- Fix critical error handling bugs
- Fetch role from database instead of hardcoding
- Remove commented code
- Add token revocation mechanism
- Add tests

---

## PR #7: Added Calendar Component
**Status:** Open (Non-Draft) | **Author:** Muragesh-24 | **Created:** Oct 14, 2025

### Summary
Adds calendar component integrated with noticeboard events.

### Key Changes
1. **Calendar Component**
   - New calendar UI in `calendar` folder
   - Integrated into profile page
   - Shows notices/events from noticeboard

2. **Notice Model Update**
   - Added `eventendtime` field
   - Updated add event form to include end time

### Concerns & Recommendations

#### 🟡 Medium Priority
1. **Incomplete Information**
   - PR description is brief
   - No clear indication of which files were changed
   - Unable to see full changeset from API response

2. **Model Changes**
   - Database migration implications not mentioned
   - Need to verify backward compatibility

#### 🟢 Positive Aspects
- Adds useful calendar functionality
- Integrates with existing noticeboard

### Recommendation: **Need More Information**
- Request file changes details
- Check database migration strategy
- Review calendar component implementation

---

## Summary of Recommendations

### Priority Order for Merging

1. **PR #16** (Build Errors) - **Ready to merge** with minor suggestions
   - Low risk, fixes critical build issues
   - Good code quality improvements

2. **PR #14** (Refresh Tokens) - **Request changes first**
   - Important security feature but has bugs
   - Must fix error handling before merge

3. **PR #15** (Location Caching) - **Request changes first**
   - Excellent features but has critical .gitignore issue
   - Needs better error handling

4. **PR #17** (HEIC Support) - **Request changes first**
   - Solves real problem but code quality needs improvement
   - Security audit needed for dependencies

5. **PR #7** (Calendar) - **Need more review**
   - Need to see full changeset
   - Verify database migrations

### General Recommendations

1. **Add CI/CD Checks**
   - Automated linting (ESLint, go fmt)
   - Type checking (TypeScript)
   - Security scanning (npm audit, gosec)
   - Test coverage requirements

2. **PR Template**
   - Add PR template with checklist:
     - [ ] Tests added/updated
     - [ ] Documentation updated
     - [ ] Breaking changes documented
     - [ ] Security implications considered

3. **Code Review Guidelines**
   - Require at least one approval
   - Require passing CI before merge
   - Encourage smaller, focused PRs

4. **Testing Strategy**
   - Add test requirements for critical paths
   - Authentication logic must have tests
   - API endpoints should have integration tests

---

## Conclusion

The repository has several high-quality PRs with valuable features, but most need some work before merging:

- **Critical bugs** in error handling (PR #14)
- **Configuration issues** in .gitignore (PR #15)
- **Code quality** improvements needed (PR #17)
- **Type safety** can be improved across the board

The team is making good progress on important features like HEIC support, better caching, refresh tokens, and UX improvements. With the recommended changes, these PRs will significantly improve the application.

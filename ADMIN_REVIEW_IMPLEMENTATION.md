# Admin Review Button Implementation Summary

## Changes Made

### 1. Backend Implementation

**File: [server/maps/handler.adminActions.go](server/maps/handler.adminActions.go)**

- Implemented `locationAction()` function to handle approve/reject actions on pending location requests
- Accepts `action` parameter: "approved" or "rejected"
- Requires rejection message for rejected status
- Sends email notifications to contributors via RabbitMQ
- **Updated**: Changed from `Save()` to `Model().Update()` for proper GORM updates
- **Added**: Comprehensive logging with logrus for debugging

### Bug Fixes Applied

1. **GORM Update Issue**: Changed from `DB.Save(&location)` to `DB.Model(&model.Location{}).Where("location_id = ?", locationID).Update("status", status)` - Save() wasn't updating properly
2. **Added extensive logging**: Backend now logs request receipt, location ID, action, current status, and success/failure
3. **Frontend error handling**: Added console.log and better error messages to identify API issues
4. **Auto-refresh**: List refreshes after approve/reject to show updated status

### 2. Frontend Components

#### Created AdminReviewModal Component

**File: [components/profile/AdminReviewModal.tsx](components/profile/AdminReviewModal.tsx)**

- Dialog modal displaying all pending location requests
- Features:
  - Fetches pending locations from `/api/maps/newLocation` endpoint
  - Lists each location with details (name, type, coordinates, contributor email)
  - Click to select a location
  - Provides textarea for rejection message
  - Two action buttons: Accept and Reject
  - Notification toasts for user feedback
  - Automatic refresh on modal open
  - **Updated**: Console logging for debugging, better error messages, auto-refresh after actions

#### Updated SocialProfileCard Component

**File: [components/profile/SocialProfileCard.tsx](components/profile/SocialProfileCard.tsx)**

- Added `userRole` prop to component
- Added admin check: `isAdmin = userRole >= 100`
- Conditionally renders `<AdminReviewModal />` only for admins
- Button displays clipboard icon for review functionality

#### Updated Profile Page

**File: [app/(auth)/profile/page.tsx](<app/(auth)/profile/page.tsx>)**

- Passes `userRole={userData.role}` to `SocialProfileCard`
- Enables admin-only button visibility

## API Endpoints Used

### Fetch Pending Locations (GET)

```
GET /api/maps/newLocation
Authorization: Required (Admin)
Response: { requests: Location[] }
```

### Approve/Reject Location (POST)

```
POST /api/maps/location/{locationId}
Body: {
  action: "approved" | "rejected",
  message: string (required for rejected)
}
Authorization: Required (Admin)
```

## Location Object Structure

```typescript
{
  locationId: uuid
  name: string
  latitude: number
  longitude: number
  locationType: string
  description: string
  status: "pending" | "approved" | "rejected"
  contributedBy: uuid
  user?: { email: string }
}
```

## UI/UX Flow

1. **Admin logs in** to profile page
2. **Review button** appears in empty space (next to Map and Mode toggle)
3. **Clicks Review button** → Modal opens with pending locations
4. **Selects a location** → Details expand with action buttons and message textarea
5. **Approve**: Sends approval request, location is activated
6. **Reject**: Requires rejection message, sends rejection with reason
7. **Auto-refresh**: List updates immediately, removed item disappears
8. **Status visible to user**: User sees updated status (approved/rejected) on their profile

## Role Check

- Only users with `role >= 100` (AdminRole = 100) see the Review button
- Non-admins don't see the button at all

## Debugging

- Backend logs all actions with logrus
- Frontend logs API calls to browser console
- Check logs: `docker logs server-server-1 -f`
- Browser console shows request/response data

## Testing

To verify database updates work:

```bash
# Connect to database
docker exec -it server-postgres-1 psql -U this_is_mjk -d compass

# Check location statuses
SELECT location_id, name, status FROM locations ORDER BY created_at DESC LIMIT 10;
```

## Installation

All components use existing imports from the UI library. No additional dependencies needed.

## Rebuild Instructions

After code changes:

```bash
cd d:/compass/server
docker-compose up -d --build server
```

# Admin Role Functionality Test Guide

## Overview
This guide provides step-by-step testing procedures for all Admin role functionalities in the InsPecPro system.

## Prerequisites
1. System is running (Backend: http://localhost:8000, Frontend: http://localhost:3000)
2. Admin user credentials: `admin` / `admin123`

## 🔐 Admin Login Test
1. Navigate to http://localhost:3000
2. Enter credentials: `admin` / `admin123`
3. ✅ Should redirect to dashboard
4. ✅ Should show admin role in navigation

## 📊 Admin Dashboard Test
1. ✅ Verify dashboard shows all statistics (total, submitted, accepted, rejected, draft)
2. ✅ Verify quick actions show: "Create Form", "Add User"
3. ✅ Navigation should show: Dashboard, Forms, Users, Inspections

## 👥 User Management Tests

### Add User Test
1. Navigate to `/users`
2. Click "Add User" button
3. Fill in the form:
   - User ID: `test001`
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Role: Select from dropdown (User/Supervisor/Management/Admin)
   - Plant: `Plant A`
   - Line Process: `Line 1`
4. Click "Create User"
5. ✅ Should show success message
6. ✅ Should refresh user list
7. ✅ New user should appear in the list

### Edit User Test
1. In users list, click edit (pencil) icon on a user
2. Modify user details:
   - Change username
   - Change email
   - Change role
   - Change plant/line process
   - Toggle active status
3. Click "Update User"
4. ✅ Should show success message
5. ✅ Should refresh user list
6. ✅ Changes should be reflected

### Delete User Test
1. In users list, click delete (trash) icon on a user
2. Confirm deletion in popup
3. ✅ Should show success message
4. ✅ User should be removed from list (soft delete)

## 📝 Form Management Tests

### Create Form Test
1. Navigate to `/forms`
2. Click "Create Form" button
3. Fill form information:
   - Form Name: `Quality Check Form`
   - Description: `Standard quality inspection form`
4. Add fields using "Add Field" button:

#### Text Field
- Field Name: `Inspector Name`
- Field Type: `Text`
- Required: ✅ checked

#### Dropdown Field
- Field Name: `Product Type`
- Field Type: `Dropdown`
- Required: ✅ checked
- Add options: `Product A`, `Product B`, `Product C`

#### Measurement Field
- Field Name: `Dimension Check`
- Field Type: `Measurement`
- Measurement Type: `Between`
- Min Value: `10.0`
- Max Value: `20.0`
- Required: ✅ checked

#### Photo Field
- Field Name: `Product Photo`
- Field Type: `Photo`
- Required: ❌ unchecked

#### Signature Field
- Field Name: `Inspector Signature`
- Field Type: `Signature`
- Required: ✅ checked

5. Test field reordering using up/down arrows
6. Click "Create Form"
7. ✅ Should show success message
8. ✅ Should redirect to forms list
9. ✅ New form should appear

### View Form Test
1. In forms list, click "View" on a form
2. ✅ Should show form details
3. ✅ Should show all fields with correct information
4. ✅ Should show field types, options, and requirements
5. ✅ Admin should see "Edit Form" and "Delete Form" buttons

### Edit Form Test
1. From form view page, click "Edit Form"
2. Modify form information:
   - Change form name
   - Change description
3. Modify existing fields:
   - Change field names
   - Change field types
   - Add/remove dropdown options
   - Change measurement ranges
   - Toggle required status
4. Add new fields
5. Remove some fields using trash icon
6. Reorder fields using up/down arrows
7. Click "Save Changes"
8. ✅ Should show success message
9. ✅ Should redirect to form view
10. ✅ Changes should be reflected

### Delete Form Test
1. From form view page, click "Delete Form"
2. Confirm deletion
3. ✅ Should show success message
4. ✅ Should redirect to forms list
5. ✅ Form should be marked as inactive or removed

## 🔍 Inspection Review Tests

### Review Submitted Inspections
1. Navigate to `/inspections`
2. Filter by "Submitted" status
3. For submitted inspections, admin should see:
   - ✅ View (eye) icon
   - ✅ Accept (check) icon
   - ✅ Reject (X) icon
   - ✅ Edit (pencil) icon
   - ✅ Delete (trash) icon

### Accept Inspection Test
1. Click accept (check) icon on a submitted inspection
2. ✅ Should show success message
3. ✅ Inspection status should change to "Accepted"

### Reject Inspection Test
1. Click reject (X) icon on a submitted inspection
2. Enter rejection reason in modal
3. Click "Reject Inspection"
4. ✅ Should show success message
5. ✅ Inspection status should change to "Rejected"
6. ✅ Rejection reason should be visible

### Edit Any Inspection Test
1. Click edit (pencil) icon on any inspection
2. ✅ Admin should be able to edit any inspection regardless of status
3. ✅ Should be able to modify responses
4. ✅ Should be able to upload/change files

### Delete Any Inspection Test
1. Click delete (trash) icon on any inspection
2. Confirm deletion
3. ✅ Should show success message
4. ✅ Inspection should be removed

## 🎯 Admin-Specific Features Test

### Access Control Test
1. ✅ Admin should have access to all pages:
   - `/dashboard`
   - `/forms` (with create/edit/delete)
   - `/users` (with full CRUD)
   - `/inspections` (with full CRUD and review)
2. ✅ All admin-only buttons should be visible
3. ✅ All admin-only actions should work

### Navigation Test
1. ✅ Navigation should show all relevant links for admin
2. ✅ Current page should be highlighted
3. ✅ All navigation links should work

### Error Handling Test
1. Try creating user with duplicate email/username
2. ✅ Should show appropriate error message
3. Try creating form without fields
4. ✅ Should show validation error
5. Try accessing non-existent form/user
6. ✅ Should show "not found" message

## 🔧 Integration Tests

### End-to-End Workflow Test
1. **Create User**: Add a new inspector user
2. **Create Form**: Create a comprehensive inspection form
3. **User Login**: Login as the new inspector (separate browser/incognito)
4. **Fill Inspection**: Complete the form as inspector
5. **Submit**: Submit the inspection
6. **Admin Review**: Login back as admin and review the inspection
7. **Accept/Reject**: Test both accept and reject workflows
8. ✅ Complete workflow should work seamlessly

### Data Persistence Test
1. Create users and forms
2. Restart the application
3. ✅ All data should persist
4. ✅ All functionality should continue to work

## 📋 Checklist Summary

### User Management
- [ ] ✅ Add user with all roles
- [ ] ✅ Edit user details
- [ ] ✅ Delete user (soft delete)
- [ ] ✅ View all users with role indicators
- [ ] ✅ Access control (admin only)

### Form Management
- [ ] ✅ Create form with multiple field types
- [ ] ✅ View form details
- [ ] ✅ Edit form (metadata and fields)
- [ ] ✅ Delete form
- [ ] ✅ Field reordering
- [ ] ✅ Field validation settings

### Inspection Management
- [ ] ✅ View all inspections
- [ ] ✅ Review submitted inspections
- [ ] ✅ Accept inspections
- [ ] ✅ Reject inspections with reason
- [ ] ✅ Edit any inspection
- [ ] ✅ Delete any inspection

### System Features
- [ ] ✅ Dashboard statistics
- [ ] ✅ Navigation consistency
- [ ] ✅ Error handling
- [ ] ✅ Success notifications
- [ ] ✅ Access control enforcement

## 🚨 Common Issues & Solutions

### Issue: Form edit not saving fields
**Solution**: Ensure backend endpoint `/api/forms/{id}/complete` is working

### Issue: User creation fails
**Solution**: Check for duplicate email/username, verify required fields

### Issue: Navigation not showing admin options
**Solution**: Verify user role is correctly set to "admin"

### Issue: File uploads not working
**Solution**: Check backend file upload configuration and permissions

## 📞 Support
If any test fails, check:
1. Browser console for JavaScript errors
2. Backend logs for API errors
3. Network tab for failed requests
4. Database for data consistency

All admin functionality should work seamlessly. If issues persist, refer to the system documentation or contact the development team.

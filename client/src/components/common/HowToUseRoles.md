# Role-Based Access Control System Guide

## Understanding the Role Management System

The Role-Based Access Control (RBAC) system gives you fine-grained control over what users can access in the application. Each role has two types of permissions:

1. **Entity Permissions**: Control CRUD operations on data (create, read, update, delete)
2. **Page Access Permissions**: Control which pages/features users can access

## Core Roles

The system has three protected core roles that cannot be deleted or modified extensively:

- **Admin (role_id=1)**: Has full access to all features
- **Supervisor (role_id=3)**: Can access supervisor-specific feedback tests
- **Candidate (role_id=4)**: Can access candidate-specific features like taking tests

## Creating Custom Roles

To create a custom role:

1. Navigate to **Administration → Role Management**
2. Click **Add New Role**
3. Fill in the basic details:
   - **Role ID**: A unique number (avoid using 1, 3, or 4)
   - **Role Name**: Descriptive name for the role
   - **Description**: Purpose of the role
   - **Status**: Active or Inactive

4. Configure entity permissions by toggling access to:
   - Users
   - Roles
   - Organizations
   - Institutes
   - Departments
   - Candidates
   - Tests

5. Configure page access permissions:
   - **Common Pages**: Dashboard, User Profile, etc.
   - **Administration Pages**: User Management, Role Management, etc. 
   - **Assessment Pages**: Test Management, Question Management, etc.
   - **Candidate Pages**: Candidate Management, etc.
   - **Job Pages**: Job Management
   - **Role-Specific Pages**: Supervisor Tests, My Tests, Results

6. Save the role

## Assigning Roles to Users

To assign a role to a user:

1. Navigate to **Administration → User Management**
2. Edit an existing user or create a new one
3. Select the appropriate role from the dropdown
4. Save changes

## Best Practices

1. **Start with minimum permissions**: Only grant the permissions needed for each role
2. **Test before deployment**: After creating a role, test it with a sample user
3. **Keep roles organized**: Use clear naming conventions
4. **Review permissions regularly**: Update roles as responsibilities change

## Notes on Page Access

When a user logs in, their navigation menu will only show the pages they have access to based on their role permissions. If a user attempts to access a URL directly without permission, they will be redirected to the appropriate page based on their role.

For example:
- If a Supervisor tries to access `/users`, they will be redirected to `/supervisor-tests`
- If a Candidate tries to access `/tests`, they will be redirected to `/my-tests`

## Troubleshooting

If a user reports they cannot access a feature:

1. Check their assigned role in User Management
2. Verify that the role has the appropriate permissions
3. Have the user log out and log back in to refresh their permissions
4. If the issue persists, contact a system administrator 
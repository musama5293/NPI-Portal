# NUST Personality Index (NPI) Portal

## System Defaults
- Fallback password for candidate users: `Test@123`
- Fallback OTP: `135791`

## Overview
The NPI Portal is a comprehensive HR management system designed for managing candidates through the entire hiring lifecycle, from initial application to permanent employment.

## Candidate Lifecycle Management

### Candidate Status Flow
The system supports tracking candidates through the following stages:

1. **Initial** - Candidates who have just been added to the system
2. **Probation** - Candidates who have been hired on a probation period
3. **Hired** - Candidates who have successfully completed probation and been permanently hired
4. **Rejected** - Candidates who were rejected at any stage

### Hiring Status Flow
The hiring status tracks more granular steps in the hiring process:
- applied -> shortlisted -> interviewed -> test_assigned -> test_completed -> board_assigned -> board_completed -> probation -> hired/rejected

### Probation Management
The system provides a dedicated Probation Dashboard to:
- View candidates whose probation periods are ending soon
- Create evaluation boards for probation reviews
- Track probation periods with configurable durations
- Allow supervisors to evaluate probation candidates
- Update candidate status with comprehensive histories

### Evaluation Boards
Three types of boards can be created:
- **Initial Interview Boards** - For initial candidate evaluation
- **Probation Evaluation Boards** - For evaluating candidates at the end of their probation
- **Other Assessment Boards** - For other types of candidate evaluation

### Board Evaluation Workflow
1. Create a board with the appropriate type and assigned panel members
2. For probation boards, select relevant supervisors for evaluation
3. Assign candidates to the board
4. Conduct evaluations
5. Update candidate status based on evaluation results
6. All status changes are tracked in the candidate's evaluation history

## Using the Probation Dashboard
1. Navigate to the "Probation Dashboard" from the sidebar
2. View candidates with probation periods ending within the selected timeframe
3. Select candidates to create an evaluation board
4. Create a probation evaluation board and assign supervisors
5. After evaluation, update candidate status to hired or extend probation

## Viewing Candidate History
1. Navigate to any candidate's detail page
2. Scroll down to the Status section
3. View full evaluation history including:
   - Status changes
   - Dates of evaluation
   - Comments from evaluators
   - Board information

## Technical Details
The system maintains a comprehensive history of all status changes in the `evaluation_history` field of each candidate, recording:
- Previous and new status
- Date of change
- Comments/notes
- The user who made the change
- The board associated with the evaluation (if applicable)

---
For more information, please contact the system administrator.

const Notification = require('../models/Notification');
const EmailService = require('./emailService');

class NotificationHelper {
  constructor(io) {
    this.io = io;
  }

  // Helper method to create notification for candidate registration
  async notifyCandidateRegistration(candidateData, adminUsers, userCredentials = null) {
    try {
      const notifications = [];
      
      for (const admin of adminUsers) {
        const notificationData = {
          user_id: admin._id,
          title: 'New Candidate Registered',
          message: `${candidateData.cand_name} has registered and is awaiting approval.`,
          type: 'candidate_registration',
          priority: 'medium',
          category: 'candidates',
          data: {
            candidate_id: candidateData._id,
            candidate_name: candidateData.cand_name,
            candidate_email: candidateData.cand_email
          },
          action_url: `/candidates/${candidateData._id}`,
          action_text: 'View Candidate'
        };

        const notification = await Notification.createAndSend(notificationData, this.io);
        notifications.push(notification);
      }

      // Send welcome email to candidate
      if (candidateData.cand_email) {
        try {
          await EmailService.sendCandidateRegistrationEmail(candidateData, userCredentials);
          console.log(`Registration confirmation email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending candidate registration email:', emailError);
          // Don't throw error, just log it as notification is more critical
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating candidate registration notifications:', error);
      throw error;
    }
  }

  // Helper method to create notification for test completion
  async notifyTestCompletion(testData, supervisors) {
    try {
      const notifications = [];
      
      for (const supervisor of supervisors) {
        const notificationData = {
          user_id: supervisor._id,
          title: 'Test Completed',
          message: `${testData.candidate_name} has completed the ${testData.test_name} test.`,
          type: 'test_completion',
          priority: 'high',
          category: 'tests',
          data: {
            test_id: testData.test_id,
            candidate_id: testData.candidate_id,
            candidate_name: testData.candidate_name,
            test_name: testData.test_name,
            score: testData.score
          },
          action_url: `/results/${testData.result_id}`,
          action_text: 'View Results'
        };

        const notification = await Notification.createAndSend(notificationData, this.io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating test completion notifications:', error);
      throw error;
    }
  }

  // Helper method to create notification for board creation
  async notifyBoardCreation(boardData, users) {
    try {
      const notifications = [];
      
      for (const user of users) {
        const notificationData = {
          user_id: user._id,
          title: 'New Evaluation Board Created',
          message: `A new evaluation board "${boardData.board_name}" has been created for ${boardData.job_name}.`,
          type: 'board_creation',
          priority: 'medium',
          category: 'boards',
          data: {
            board_id: boardData._id,
            board_name: boardData.board_name,
            job_name: boardData.job_name,
            candidate_count: boardData.candidate_count
          },
          action_url: `/boards/${boardData._id}`,
          action_text: 'View Board'
        };

        const notification = await Notification.createAndSend(notificationData, this.io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating board creation notifications:', error);
      throw error;
    }
  }

  // Helper method to create system notifications
  async notifySystemUpdate(title, message, users, priority = 'medium') {
    try {
      const notifications = [];
      
      for (const user of users) {
        const notificationData = {
          user_id: user._id,
          title: title,
          message: message,
          type: 'system',
          priority: priority,
          category: 'system',
          data: {
            timestamp: new Date()
          }
        };

        const notification = await Notification.createAndSend(notificationData, this.io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating system notifications:', error);
      throw error;
    }
  }

  // Helper method to create reminder notifications
  async notifyReminder(userData, reminderData) {
    try {
      const notificationData = {
        user_id: userData._id,
        title: reminderData.title,
        message: reminderData.message,
        type: 'reminder',
        priority: reminderData.priority || 'medium',
        category: reminderData.category || 'general',
        data: reminderData.data || {},
        action_url: reminderData.action_url,
        action_text: reminderData.action_text,
        expires_at: reminderData.expires_at
      };

      const notification = await Notification.createAndSend(notificationData, this.io);
      return notification;
    } catch (error) {
      console.error('Error creating reminder notification:', error);
      throw error;
    }
  }

  // Helper method to create bulk notifications
  async notifyBulk(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const data = {
          ...notificationData,
          user_id: userId
        };

        const notification = await Notification.createAndSend(data, this.io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Helper method to notify test assignment
  async notifyTestAssignment(assignmentData, candidate, candidateData = null, testData = null) {
    try {
      const notificationData = {
        user_id: candidate._id,
        title: 'New Test Assigned',
        message: `You have been assigned a new test: ${assignmentData.test_name}. Please complete it by ${assignmentData.due_date}.`,
        type: 'test_assignment',
        priority: 'medium', // Changed from 'high' to prevent admin broadcast
        category: 'tests',
        data: {
          assignment_id: assignmentData._id,
          test_name: assignmentData.test_name,
          due_date: assignmentData.due_date,
          test_id: assignmentData.test_id
        },
        action_url: `/take-test/${assignmentData._id}`,
        action_text: 'Take Test',
        expires_at: assignmentData.due_date
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email notification if candidate data is provided
      if (candidateData && testData) {
        try {
          await EmailService.sendTestAssignmentEmail(candidateData, testData, assignmentData);
          console.log(`Test assignment email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending test assignment email:', emailError);
          // Don't throw error, just log it as notification is more critical
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating test assignment notification:', error);
      throw error;
    }
  }

  // Helper method to notify board assignment
  async notifyBoardAssignment(boardData, candidateData, assignmentData, sentBy) {
    try {
      const notificationData = {
        user_id: candidateData.user_account,
        title: 'Board Interview Scheduled',
        message: `You have been scheduled for a board interview: ${boardData.board_name}. Scheduled for ${assignmentData.scheduled_date}.`,
        type: 'board_assignment',
        priority: 'high',
        category: 'boards',
        data: {
          board_id: boardData._id,
          board_name: boardData.board_name,
          scheduled_date: assignmentData.scheduled_date,
          venue: assignmentData.venue || 'TBD'
        },
        action_url: `/board-interview/${boardData._id}`,
        action_text: 'View Details',
        expires_at: assignmentData.scheduled_date
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email notification
      if (candidateData.cand_email) {
        try {
          await EmailService.sendBoardAssignmentEmail(candidateData, boardData, assignmentData);
          console.log(`Board assignment email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending board assignment email:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating board assignment notification:', error);
      throw error;
    }
  }

  // Helper method to notify test completion and send results
  async notifyTestCompletion(testData, candidateData, resultData, sentBy) {
    try {
      const notificationData = {
        user_id: candidateData.user_account,
        title: 'Test Results Available',
        message: `Your test results for ${testData.test_name} are now available. Score: ${resultData.score}/${resultData.max_score}`,
        type: 'test_completion',
        priority: 'medium',
        category: 'tests',
        data: {
          test_id: testData._id,
          test_name: testData.test_name,
          score: resultData.score,
          max_score: resultData.max_score,
          percentage: resultData.percentage,
          status: resultData.status
        },
        action_url: `/test-results/${testData._id}`,
        action_text: 'View Results'
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email notification with results
      if (candidateData.cand_email) {
        try {
          await EmailService.sendResultNotificationEmail(candidateData, {
            test_name: testData.test_name,
            score: resultData.score,
            max_score: resultData.max_score,
            percentage: resultData.percentage,
            status: resultData.status
          });
          console.log(`Test result email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending test result email:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating test completion notification:', error);
      throw error;
    }
  }

  // Helper method to notify hiring confirmation
  async notifyHiringConfirmation(candidateData, jobData, sentBy) {
    try {
      const notificationData = {
        user_id: candidateData.user_account,
        title: 'Congratulations! You are Hired',
        message: `Congratulations! You have been selected for the position of ${jobData.job_title}. Welcome to the team!`,
        type: 'hiring_confirmation',
        priority: 'high',
        category: 'candidates',
        data: {
          job_id: jobData._id,
          job_title: jobData.job_title,
          start_date: jobData.start_date,
          salary: jobData.salary
        },
        action_url: `/hiring-details/${jobData._id}`,
        action_text: 'View Details'
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email notification
      if (candidateData.cand_email) {
        try {
          await EmailService.sendHiringConfirmationEmail(candidateData, jobData);
          console.log(`Hiring confirmation email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending hiring confirmation email:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating hiring confirmation notification:', error);
      throw error;
    }
  }

  // Helper method to notify rejection
  async notifyRejection(candidateData, rejectionData, sentBy) {
    try {
      const notificationData = {
        user_id: candidateData.user_account,
        title: 'Application Status Update',
        message: `Thank you for your interest in our organization. Unfortunately, we have decided to move forward with other candidates.`,
        type: 'rejection_notification',
        priority: 'medium',
        category: 'candidates',
        data: {
          position: rejectionData.position,
          feedback: rejectionData.feedback
        },
        action_url: `/application-status`,
        action_text: 'View Status'
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email notification
      if (candidateData.cand_email) {
        try {
          await EmailService.sendRejectionNotificationEmail(candidateData, rejectionData);
          console.log(`Rejection notification email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending rejection notification email:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating rejection notification:', error);
      throw error;
    }
  }

  // Helper method to send reminder emails
  async sendReminder(candidateData, reminderData, sentBy) {
    try {
      const notificationData = {
        user_id: candidateData.user_account,
        title: `Reminder: ${reminderData.type}`,
        message: reminderData.message,
        type: 'reminder',
        priority: reminderData.priority || 'medium',
        category: 'general',
        data: {
          reminder_type: reminderData.type,
          due_date: reminderData.due_date
        },
        action_url: reminderData.action_url || '/dashboard',
        action_text: 'Take Action',
        expires_at: reminderData.due_date
      };

      const notification = await Notification.createAndSend(notificationData, this.io);

      // Send email reminder
      if (candidateData.cand_email) {
        try {
          await EmailService.sendReminderEmail(candidateData, reminderData);
          console.log(`Reminder email sent to ${candidateData.cand_email}`);
        } catch (emailError) {
          console.error('Error sending reminder email:', emailError);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  // Helper method to notify admins about test assignments
  async notifyAdminTestAssignment(assignmentData, candidateData, assignedBy) {
    try {
      const User = require('../models/user.model');
      const adminUsers = await User.find({ role_id: 1 }); // Get all admin users
      
      const notifications = [];
      
      for (const admin of adminUsers) {
        // Don't notify the admin who assigned the test
        if (admin._id.toString() === assignedBy.toString()) continue;
        
        const notificationData = {
          user_id: admin._id,
          title: 'Test Assignment Created',
          message: `${candidateData.cand_name} has been assigned the test: ${assignmentData.test_name}.`,
          type: 'test_assignment',
          priority: 'low', // Low priority for admin notifications
          category: 'tests',
          data: {
            assignment_id: assignmentData._id,
            test_name: assignmentData.test_name,
            candidate_name: candidateData.cand_name,
            candidate_id: candidateData._id,
            assigned_by: assignedBy,
            due_date: assignmentData.due_date,
            test_id: assignmentData.test_id
          },
          action_url: `/test-assignments`,
          action_text: 'View Assignments'
        };

        const notification = await Notification.createAndSend(notificationData, this.io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating admin test assignment notifications:', error);
      throw error;
    }
  }

  // Helper method to notify job slot booking
  async notifyJobSlotBooked(jobData, candidate, admins) {
    try {
      const notifications = [];
      
      // Notify candidate
      const candidateNotification = {
        user_id: candidate._id,
        title: 'Test Slot Booked',
        message: `Your test slot for ${jobData.job_name} has been confirmed for ${jobData.slot_date} at ${jobData.slot_time}.`,
        type: 'test_slot',
        priority: 'high',
        category: 'tests',
        data: {
          job_id: jobData._id,
          job_name: jobData.job_name,
          slot_date: jobData.slot_date,
          slot_time: jobData.slot_time
        },
        action_url: `/my-assessments`,
        action_text: 'View Assessments'
      };
      
      const candidateNotif = await Notification.createAndSend(candidateNotification, this.io);
      notifications.push(candidateNotif);
      
      // Notify admins
      for (const admin of admins) {
        const adminNotification = {
          user_id: admin._id,
          title: 'Test Slot Booked',
          message: `${candidate.cand_name} has booked a test slot for ${jobData.job_name}.`,
          type: 'test_slot',
          priority: 'medium',
          category: 'tests',
          data: {
            candidate_id: candidate._id,
            candidate_name: candidate.cand_name,
            job_id: jobData._id,
            job_name: jobData.job_name,
            slot_date: jobData.slot_date,
            slot_time: jobData.slot_time
          },
          action_url: `/jobs/${jobData._id}/candidates`,
          action_text: 'View Candidates'
        };
        
        const adminNotif = await Notification.createAndSend(adminNotification, this.io);
        notifications.push(adminNotif);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating job slot booking notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationHelper; 
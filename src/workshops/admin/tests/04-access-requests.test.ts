// Auto-generated from workshops/admin/user-stories/04-access-requests.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Access Requests (04)
// Priority: P1
// Story Points: 5
// Estimated Hours: 12

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Access Requests', () => {
  describe('US-04-01: Submit Access Request', () => {
    // User Story:
    // As a Platform User
    // I want to request access to an application
    // So that I can use the application once approved

    it('should create access request successfully', async () => {
      // Arrange
      const input = {
        "userId": "user-123",
        "appSlug": "pmbook",
        "reason": "Need access for project work"
};

      // Act
      const result = await createAccessRequest(input.userId, input.appSlug, input.reason);

      // Assert
      expect(result.request).toBeDefined();
      expect(result.request.status).toBe('pending');
      expect(result.request.appSlug).toBe('pmbook');
      expect(result.request.reason).toBe('Need access for project work');
    });

    it('should prevent duplicate pending requests', async () => {
      // Arrange
      const input = {
        "userId": "user-123",
        "appSlug": "pmbook",
        "reason": "Need access"
};

      // Act
      const promise = createAccessRequest(input.userId, input.appSlug, input.reason);

      // Assert
      await expect(promise).rejects.toThrow(/duplicate request/i);
    });

    it('should validate app exists', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": null
});
      const input = {
        "userId": "user-123",
        "appSlug": "nonexistent-app",
        "reason": "Need access"
};

      // Act
      const promise = createAccessRequest(input.userId, input.appSlug, input.reason);

      // Assert
      await expect(promise).rejects.toThrow(/app not found/i);
    });

    it('should validate reason is provided', async () => {
      // Arrange
      const input = {
        "userId": "user-123",
        "appSlug": "pmbook",
        "reason": ""
};

      // Act
      const promise = createAccessRequest(input.userId, input.appSlug, input.reason);

      // Assert
      await expect(promise).rejects.toThrow(/reason is required/i);
    });

    // Edge Cases to Consider:
    // - User already has access to app: Allow request but flag as 'already has access'
    // - Empty reason provided: Reject with validation error

  });

  describe('US-04-02: List Access Requests', () => {
    // User Story:
    // As a System Administrator
    // I want to view all access requests with filters
    // So that I can review and manage pending requests

    it('should list all access requests', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "request-1",
                        "userId": "user-123",
                        "appSlug": "pmbook",
                        "status": "pending",
                        "createdAt": "2025-11-04T10:00:00Z"
                },
                {
                        "id": "request-2",
                        "userId": "user-456",
                        "appSlug": "aihub",
                        "status": "pending",
                        "createdAt": "2025-11-04T09:00:00Z"
                }
        ]
});
      const input = {
        "options": {}
};

      // Act
      const result = await listAccessRequests(input.options);

      // Assert
      expect(result.requests).toHaveLength(2);
      expect(result.requests[0].id).toBe('request-1');
    });

    it('should filter by status', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "request-1",
                        "status": "pending"
                }
        ]
});
      const input = {
        "options": {
                "status": "pending"
        }
};

      // Act
      const result = await listAccessRequests(input.options);

      // Assert
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].status).toBe('pending');
    });

    it('should filter by app slug', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "request-1",
                        "appSlug": "pmbook"
                }
        ]
});
      const input = {
        "options": {
                "appSlug": "pmbook"
        }
};

      // Act
      const result = await listAccessRequests(input.options);

      // Assert
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].appSlug).toBe('pmbook');
    });

  });

  describe('US-04-03: Approve Access Request', () => {
    // User Story:
    // As a System Administrator
    // I want to approve a user's access request
    // So that they can be granted access to the application

    it('should approve request successfully', async () => {
      // Arrange
      const input = {
        "requestId": "request-123",
        "groups": [
                "pmbook-user"
        ],
        "adminId": "admin-456",
        "notes": "Approved for project work"
};

      // Act
      const result = await approveRequest(input.requestId, input.groups, input.adminId, input.notes);

      // Assert
      expect(result.request.status).toBe('approved');
      expect(result.request.reviewedBy).toBe('admin-456');
      expect(result.request.groupsGranted).toContain('pmbook-user');
    });

    it('should prevent approving already processed request', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "request-123",
                "status": "approved"
        }
});
      const input = {
        "requestId": "request-123",
        "groups": [
                "pmbook-user"
        ],
        "adminId": "admin-456"
};

      // Act
      const promise = approveRequest(input.requestId, input.groups, input.adminId);

      // Assert
      await expect(promise).rejects.toThrow(/already processed/i);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": null
});
      const input = {
        "requestId": "nonexistent",
        "groups": [
                "pmbook-user"
        ],
        "adminId": "admin-456"
};

      // Act
      const promise = approveRequest(input.requestId, input.groups, input.adminId);

      // Assert
      await expect(promise).rejects.toThrow(/not found/i);
    });

    // Edge Cases to Consider:
    // - User already in requested groups: Still mark as approved, groups are idempotent
    // - Groups don't exist: Rollback approval, return error

  });

  describe('US-04-04: Deny Access Request', () => {
    // User Story:
    // As a System Administrator
    // I want to deny a user's access request
    // So that inappropriate requests are rejected with reason

    it('should deny request successfully', async () => {
      // Arrange
      const input = {
        "requestId": "request-123",
        "adminId": "admin-456",
        "reason": "Insufficient justification"
};

      // Act
      const result = await denyRequest(input.requestId, input.adminId, input.reason);

      // Assert
      expect(result.request.status).toBe('denied');
      expect(result.request.denialReason).toBe('Insufficient justification');
      expect(result.request.reviewedBy).toBe('admin-456');
    });

    it('should require denial reason', async () => {
      // Arrange
      const input = {
        "requestId": "request-123",
        "adminId": "admin-456",
        "reason": ""
};

      // Act
      const promise = denyRequest(input.requestId, input.adminId, input.reason);

      // Assert
      await expect(promise).rejects.toThrow(/reason required/i);
    });

    it('should prevent denying already processed request', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "request-123",
                "status": "approved"
        }
});
      const input = {
        "requestId": "request-123",
        "adminId": "admin-456",
        "reason": "Not needed"
};

      // Act
      const promise = denyRequest(input.requestId, input.adminId, input.reason);

      // Assert
      await expect(promise).rejects.toThrow(/already processed/i);
    });

  });

  describe('US-04-05: Get Request Details', () => {
    // User Story:
    // As a System Administrator
    // I want to view detailed information about an access request
    // So that I can make an informed approval/denial decision

    it('should get request details successfully', async () => {
      // Arrange
      const input = {
        "requestId": "request-123",
        "includeUserInfo": true
};

      // Act
      const result = await getRequestDetails(input.requestId, input.includeUserInfo);

      // Assert
      expect(result.request).toBeDefined();
      expect(result.request.userName).toBe('John Doe');
      expect(result.userGroups).toContain('captify-user');
      expect(result.appRequiredGroups).toContain('pmbook-user');
    });

    it('should throw error if request not found', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": null
});
      const input = {
        "requestId": "nonexistent"
};

      // Act
      const promise = getRequestDetails(input.requestId);

      // Assert
      await expect(promise).rejects.toThrow(/not found/i);
    });

  });

  describe('US-04-06: Get User's Request History', () => {
    // User Story:
    // As a Platform User
    // I want to view my access request history
    // So that I can track the status of my requests

    it('should get user's request history', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "request-1",
                        "userId": "user-123",
                        "appSlug": "pmbook",
                        "appName": "PMBook",
                        "status": "approved",
                        "createdAt": "2025-11-03T10:00:00Z"
                },
                {
                        "id": "request-2",
                        "userId": "user-123",
                        "appSlug": "aihub",
                        "appName": "AI Hub",
                        "status": "pending",
                        "createdAt": "2025-11-04T10:00:00Z"
                }
        ]
});
      const input = {
        "userId": "user-123"
};

      // Act
      const result = await getUserRequests(input.userId);

      // Assert
      expect(result.requests).toHaveLength(2);
      expect(result.requests[0].userId).toBe('user-123');
      expect(result.requests[0].status).toBe('approved');
    });

    it('should return empty array for user with no requests', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": []
});
      const input = {
        "userId": "user-no-requests"
};

      // Act
      const result = await getUserRequests(input.userId);

      // Assert
      expect(result.requests).toHaveLength(0);
    });

  });

});

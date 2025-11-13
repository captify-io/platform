// Auto-generated from workshops/admin/user-stories/03-application-management.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Application Management (03)
// Priority: P0
// Story Points: 5
// Estimated Hours: 12

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Application Management', () => {
  describe('US-03-01: List All Applications', () => {
    // User Story:
    // As a System Administrator
    // I want to view all registered platform applications
    // So that I can manage and monitor the application ecosystem

    it('should list all applications', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "app-platform-001",
                        "name": "Platform",
                        "slug": "platform",
                        "category": "system",
                        "port": 3000,
                        "status": "active",
                        "useSharedPool": true
                },
                {
                        "id": "app-pmbook-001",
                        "name": "PMBook",
                        "slug": "pmbook",
                        "category": "application",
                        "port": 3001,
                        "status": "active",
                        "identityPoolId": "us-east-1:pmbook-pool-123"
                }
        ]
});
      const input = {
        "options": {}
};

      // Act
      const result = await listApps(input.options);

      // Assert
      expect(result.apps).toHaveLength(2);
      expect(result.apps[0].name).toBe('Platform');
      expect(result.apps[1].identityPoolId).toBeDefined();
    });

    it('should filter apps by category', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "app-platform-001",
                        "name": "Platform",
                        "category": "system"
                }
        ]
});
      const input = {
        "options": {
                "category": "system"
        }
};

      // Act
      const result = await listApps(input.options);

      // Assert
      expect(result.apps).toHaveLength(1);
      expect(result.apps[0].category).toBe('system');
    });

    it('should include PM2 health status', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "items": [
                {
                        "id": "app-001",
                        "name": "Test App",
                        "port": 3000
                }
        ]
});
      const input = {
        "options": {
                "includeHealth": true
        }
};

      // Act
      const result = await listApps(input.options);

      // Assert
      expect(result.apps[0].health).toBeDefined();
      expect(result.apps[0].health.status).toBe('online');
    });

    // Edge Cases to Consider:
    // - PM2 not running: Show apps but mark health as 'unknown'
    // - App in DynamoDB but not in PM2: Show as 'not deployed'

  });

  describe('US-03-02: Get Application Details', () => {
    // User Story:
    // As a System Administrator
    // I want to view detailed information about a specific application
    // So that I can review its configuration and health status

    it('should get app details successfully', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "app-pmbook-001",
                "name": "PMBook",
                "slug": "pmbook",
                "port": 3001,
                "identityPoolId": "us-east-1:pmbook-pool-123",
                "poolConfig": {
                        "authenticatedRole": "arn:aws:iam::123456789:role/pmbook-auth"
                }
        }
});
      const input = {
        "appId": "app-pmbook-001"
};

      // Act
      const result = await getApp(input.appId);

      // Assert
      expect(result.app).toBeDefined();
      expect(result.app.name).toBe('PMBook');
      expect(result.app.identityPoolId).toBe('us-east-1:pmbook-pool-123');
    });

    it('should throw error if app not found', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": null
});
      const input = {
        "appId": "nonexistent"
};

      // Act
      const promise = getApp(input.appId);

      // Assert
      await expect(promise).rejects.toThrow(/not found/i);
    });

    it('should include pool info for dedicated pools', async () => {
      // Arrange
      const input = {
        "appId": "app-001",
        "includePoolInfo": true
};

      // Act
      const result = await getApp(input.appId, input.includePoolInfo);

      // Assert
      expect(result.poolInfo).toBeDefined();
      expect(result.poolInfo.IdentityPoolName).toBe('pmbook-pool');
    });

  });

  describe('US-03-03: Update Application Configuration', () => {
    // User Story:
    // As a System Administrator
    // I want to update application settings
    // So that I can change app name, description, required groups, etc.

    it('should update app configuration', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "app-001",
                "name": "Updated App Name",
                "description": "New description",
                "requiredGroups": [
                        "new-group"
                ]
        }
});
      const input = {
        "appId": "app-001",
        "updates": {
                "name": "Updated App Name",
                "description": "New description",
                "requiredGroups": [
                        "new-group"
                ]
        }
};

      // Act
      const result = await updateApp(input.appId, input.updates);

      // Assert
      expect(result.app.name).toBe('Updated App Name');
      expect(result.app.description).toBe('New description');
      expect(result.app.requiredGroups).toContain('new-group');
    });

    it('should validate slug format', async () => {
      // Arrange
      const input = {
        "appId": "app-001",
        "updates": {
                "slug": "Invalid Slug!"
        }
};

      // Act
      const promise = updateApp(input.appId, input.updates);

      // Assert
      await expect(promise).rejects.toThrow(/invalid slug/i);
    });

    it('should throw error if app not found', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockRejectedValue(new Error('App not found'));
      const input = {
        "appId": "nonexistent",
        "updates": {
                "name": "New Name"
        }
};

      // Act
      const promise = updateApp(input.appId, input.updates);

      // Assert
      await expect(promise).rejects.toThrow(/not found/i);
    });

  });

  describe('US-03-04: Assign Dedicated Identity Pool to App', () => {
    // User Story:
    // As a System Administrator
    // I want to assign a dedicated AWS Identity Pool to an application
    // So that the app has isolated credentials and custom IAM policies

    it('should assign dedicated pool successfully', async () => {
      // Arrange
      const input = {
        "appId": "app-pmbook-001",
        "poolId": "us-east-1:pool-123",
        "poolConfig": {
                "authenticatedRole": "arn:aws:iam::123:role/pmbook-auth"
        }
};

      // Act
      const result = await assignIdentityPool(input.appId, input.poolId, input.poolConfig);

      // Assert
      expect(result.app.identityPoolId).toBe('us-east-1:pool-123');
      expect(result.app.useSharedPool).toBe(false);
      expect(result.app.poolConfig.authenticatedRole).toBe('arn:aws:iam::123:role/pmbook-auth');
    });

    it('should validate pool exists', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockRejectedValue(new Error('ResourceNotFoundException: Identity pool not found'));
      const input = {
        "appId": "app-001",
        "poolId": "us-east-1:nonexistent",
        "poolConfig": {
                "authenticatedRole": "arn:aws:iam::123:role/auth"
        }
};

      // Act
      const promise = assignIdentityPool(input.appId, input.poolId, input.poolConfig);

      // Assert
      await expect(promise).rejects.toThrow(/pool not found/i);
    });

    it('should validate IAM role ARN format', async () => {
      // Arrange
      const input = {
        "appId": "app-001",
        "poolId": "us-east-1:pool-123",
        "poolConfig": {
                "authenticatedRole": "invalid-arn"
        }
};

      // Act
      const promise = assignIdentityPool(input.appId, input.poolId, input.poolConfig);

      // Assert
      await expect(promise).rejects.toThrow(/invalid arn/i);
    });

  });

  describe('US-03-05: Remove Dedicated Identity Pool (Switch to Shared)', () => {
    // User Story:
    // As a System Administrator
    // I want to switch an app from dedicated pool back to shared platform pool
    // So that the app uses centralized credentials again

    it('should remove dedicated pool successfully', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "app-001",
                "identityPoolId": null,
                "useSharedPool": true,
                "poolConfig": null
        }
});
      const input = {
        "appId": "app-001"
};

      // Act
      const result = await removeIdentityPool(input.appId);

      // Assert
      expect(result.app.useSharedPool).toBe(true);
      expect(result.app.identityPoolId).toBeNull();
      expect(result.app.poolConfig).toBeNull();
    });

    it('should be idempotent (already using shared)', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "item": {
                "id": "app-001",
                "useSharedPool": true,
                "identityPoolId": null
        }
});
      const input = {
        "appId": "app-001"
};

      // Act
      const result = await removeIdentityPool(input.appId);

      // Assert
      expect(result.app.useSharedPool).toBe(true);
    });

  });

  describe('US-03-06: Get PM2 Process Health Status', () => {
    // User Story:
    // As a System Administrator
    // I want to view real-time health metrics for PM2 processes
    // So that I can monitor application uptime and resource usage

    it('should get PM2 health status', async () => {
      // Arrange
      const input = {
        "options": {}
};

      // Act
      const result = await getPM2Health(input.options);

      // Assert
      expect(result.processes).toHaveLength(2);
      expect(result.processes[0].name).toBe('platform');
      expect(result.processes[0].status).toBe('online');
      expect(result.processes[0].cpu).toBe(2.5);
    });

    it('should filter by app name', async () => {
      // Arrange
      const input = {
        "options": {
                "appName": "pmbook"
        }
};

      // Act
      const result = await getPM2Health(input.options);

      // Assert
      expect(result.processes).toHaveLength(1);
      expect(result.processes[0].name).toBe('pmbook');
    });

    it('should handle PM2 not running', async () => {
      // Arrange
      const input = {
        "options": {}
};

      // Act
      const result = await getPM2Health(input.options);

      // Assert
      expect(result.processes).toHaveLength(0);
      expect(result.warning).toMatch(/pm2 not available/i);
    });

  });

});

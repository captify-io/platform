// Auto-generated from workshops/agent/user-stories/01-actions-component.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Message Actions Component (01)
// Priority: P0
// Story Points: 3
// Estimated Hours: 8

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Message Actions Component', () => {
  describe('US-01-01: Copy message content to clipboard', () => {
    // User Story:
    // As a user
    // I want to copy message content with one click
    // So that I can paste it into other applications

    it('should copy message content to clipboard', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "content": "Hello World"
};

      // Act
      await userEvent.click(screen.getByTitle('Copy'));

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard');
    });

    it('should show check icon after successful copy', async () => {
      // Arrange

      // Act
      await userEvent.click(screen.getByTitle('Copy'));

      // Assert
      expect(screen.getByRole('button')).toContainElement(screen.getByTestId('check-icon'));
    });

    it('should handle copy failure gracefully', async () => {
      // Arrange

      // Act
      await userEvent.click(screen.getByTitle('Copy'));

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Failed to copy');
    });

    // Edge Cases to Consider:
    // - Clipboard API not available: Graceful fallback or clear error message
    // - Very long message content (>100KB): Copy completes successfully without hanging

  });

  describe('US-01-02: Provide feedback on assistant messages', () => {
    // User Story:
    // As a user
    // I want to like or dislike assistant responses
    // So that the system can learn from my feedback and improve

    it('should show like/dislike buttons for assistant messages', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": false
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.getByTitle('Like')).toBeInTheDocument();
      expect(screen.getByTitle('Dislike')).toBeInTheDocument();
    });

    it('should not show like/dislike for user messages', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": true
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.queryByTitle('Like')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Dislike')).not.toBeInTheDocument();
    });

    it('should save like feedback to database', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "success": true
});
      const input = {
        "messageId": "msg-123",
        "isUserMessage": false
};

      // Act
      await userEvent.click(screen.getByTitle('Like'));

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ service: 'platform.dynamodb', operation: 'put', table: 'core-message-feedback' }));
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ Item: expect.objectContaining({ type: 'like', messageId: 'msg-123' }) }) }));
    });

    it('should toggle feedback on second click', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        "success": true
});

      // Act
      await userEvent.click(screen.getByTitle('Like'))
await userEvent.click(screen.getByTitle('Like'))
;

      // Assert
      expect(screen.getByTitle('Like')).not.toHaveClass('text-primary');
    });

    it('should handle feedback save error', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockRejectedValue(new Error('new Error('Network error')'));

      // Act
      await userEvent.click(screen.getByTitle('Like'));

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Failed to save feedback');
      expect(screen.getByTitle('Like')).not.toHaveClass('text-primary');
    });

    // Edge Cases to Consider:
    // - Network failure during feedback save: Show error toast and revert UI to previous state
    // - User clicks multiple times rapidly: Debounce and only process last action

  });

  describe('US-01-03: Edit user messages inline', () => {
    // User Story:
    // As a user
    // I want to edit my sent messages
    // So that I can correct mistakes or clarify my request

    it('should show edit button for user messages', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": true,
        "onEdit": "jest.fn()"
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });

    it('should call onEdit when clicked', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": true,
        "onEdit": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByTitle('Edit'));

      // Assert
      expect(input.onEdit).toHaveBeenCalledWith('msg-123');
    });

  });

  describe('US-01-04: Delete user messages', () => {
    // User Story:
    // As a user
    // I want to delete messages I've sent
    // So that I can remove mistakes or unwanted content

    it('should show delete button for user messages', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": true,
        "onDelete": "jest.fn()"
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('should call onDelete when clicked', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": true,
        "onDelete": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByTitle('Delete'));

      // Assert
      expect(input.onDelete).toHaveBeenCalledWith('msg-123');
    });

  });

  describe('US-01-05: Retry assistant response generation', () => {
    // User Story:
    // As a user
    // I want to regenerate an assistant's response
    // So that I can get a different or better answer

    it('should show retry button for assistant messages when onRetry provided', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": false,
        "onRetry": "jest.fn()"
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.getByTitle('Retry')).toBeInTheDocument();
    });

    it('should not show retry when onRetry not provided', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": false
};

      // Act
      render(<MessageActions {...input} />);

      // Assert
      expect(screen.queryByTitle('Retry')).not.toBeInTheDocument();
    });

    it('should call onRetry when clicked', async () => {
      // Arrange
      const input = {
        "messageId": "msg-123",
        "isUserMessage": false,
        "onRetry": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByTitle('Retry'));

      // Assert
      expect(input.onRetry).toHaveBeenCalledWith('msg-123');
    });

  });

});

// Auto-generated from workshops/agent/user-stories/03-context-display.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Context Display Component (03)
// Priority: P0
// Story Points: 5
// Estimated Hours: 12

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Context Display Component', () => {
  describe('US-03-01: View token usage per message', () => {
    // User Story:
    // As a user
    // I want to see how many tokens each message uses
    // So that I can manage my context window and API costs

    it('should display token count for message', async () => {
      // Arrange
      const input = {
        "tokenUsage": {
                "input": 50,
                "output": 100,
                "total": 150
        }
};

      // Act
      render(<TokenDisplay {...input} />);

      // Assert
      expect(screen.getByText('150 tokens')).toBeInTheDocument();
    });

    it('should show breakdown on hover', async () => {
      // Arrange
      const input = {
        "tokenUsage": {
                "input": 50,
                "output": 100,
                "total": 150
        }
};

      // Act
      render(<TokenDisplay {...input} />)
await userEvent.hover(screen.getByText('150 tokens'))
;

      // Assert
      expect(screen.getByRole('tooltip')).toContainText('Input: 50');
      expect(screen.getByRole('tooltip')).toContainText('Output: 100');
    });

    it('should not display when no token data', async () => {
      // Arrange
      const input = {
        "tokenUsage": null
};

      // Act
      render(<TokenDisplay {...input} />);

      // Assert
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
    });

  });

  describe('US-03-02: Monitor context window utilization', () => {
    // User Story:
    // As a user
    // I want to see how much of my context window is being used
    // So that I know when I'm approaching the limit

    it('should show green progress bar when utilization is low', async () => {
      // Arrange
      const input = {
        "usedTokens": 2000,
        "maxTokens": 8000
};

      // Act
      render(<ContextUtilization {...input} />);

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500');
    });

    it('should show yellow progress bar when utilization is medium', async () => {
      // Arrange
      const input = {
        "usedTokens": 5000,
        "maxTokens": 8000
};

      // Act
      render(<ContextUtilization {...input} />);

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62.5');
      expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500');
    });

    it('should show red progress bar and warning when utilization is high', async () => {
      // Arrange
      const input = {
        "usedTokens": 7000,
        "maxTokens": 8000
};

      // Act
      render(<ContextUtilization {...input} />);

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '87.5');
      expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
      expect(screen.getByText(/approaching context limit/i)).toBeInTheDocument();
    });

  });

  describe('US-03-03: Estimate conversation costs', () => {
    // User Story:
    // As a user
    // I want to see the estimated cost of my conversation
    // So that I can budget my API usage

    it('should calculate cost for OpenAI GPT-4', async () => {
      // Arrange
      const input = {
        "tokenUsage": {
                "input": 1000,
                "output": 500
        },
        "provider": "openai",
        "model": "gpt-4-turbo",
        "pricing": {
                "inputPerMillion": 10,
                "outputPerMillion": 30
        }
};

      // Act
      const cost = calculateCost(input);

      // Assert
      expect(cost).toBe(0.025);
    });

    it('should display cost in USD format', async () => {
      // Arrange
      const input = {
        "cost": 0.025,
        "currency": "USD"
};

      // Act
      render(<CostDisplay {...input} />);

      // Assert
      expect(screen.getByText('$0.03')).toBeInTheDocument();
    });

    it('should show cumulative cost for thread', async () => {
      // Arrange
      const input = {
        "messages": [
                {
                        "tokenUsage": {
                                "input": 1000,
                                "output": 500
                        }
                },
                {
                        "tokenUsage": {
                                "input": 800,
                                "output": 600
                        }
                }
        ],
        "pricing": {
                "inputPerMillion": 10,
                "outputPerMillion": 30
        }
};

      // Act
      render(<ThreadCostDisplay {...input} />);

      // Assert
      expect(screen.getByText(/Total: \$0.05/)).toBeInTheDocument();
    });

    it('should handle missing pricing data', async () => {
      // Arrange
      const input = {
        "tokenUsage": {
                "input": 1000,
                "output": 500
        },
        "pricing": null
};

      // Act
      render(<CostDisplay {...input} />);

      // Assert
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

  });

  describe('US-03-04: View selected context items', () => {
    // User Story:
    // As a user
    // I want to see what files and data sources are being used
    // So that I understand what information the agent has access to

    it('should display context items by type', async () => {
      // Arrange
      const input = {
        "contextItems": [
                {
                        "type": "file",
                        "id": "file-1",
                        "name": "contract.pdf"
                },
                {
                        "type": "datasource",
                        "id": "ds-1",
                        "name": "Contracts DB"
                },
                {
                        "type": "ontology",
                        "id": "ont-1",
                        "name": "Contract Schema"
                }
        ]
};

      // Act
      render(<ContextItemsList {...input} />);

      // Assert
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('Contracts DB')).toBeInTheDocument();
      expect(screen.getByText('Contract Schema')).toBeInTheDocument();
    });

    it('should show count summary', async () => {
      // Arrange
      const input = {
        "contextItems": [
                {
                        "type": "file"
                },
                {
                        "type": "file"
                },
                {
                        "type": "file"
                },
                {
                        "type": "datasource"
                },
                {
                        "type": "datasource"
                }
        ]
};

      // Act
      render(<ContextSummary {...input} />);

      // Assert
      expect(screen.getByText('3 files, 2 datasources')).toBeInTheDocument();
    });

    it('should handle click on context item', async () => {
      // Arrange
      const input = {
        "contextItems": [
                {
                        "type": "file",
                        "id": "file-1",
                        "name": "contract.pdf"
                }
        ],
        "onItemClick": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByText('contract.pdf'));

      // Assert
      expect(input.onItemClick).toHaveBeenCalledWith('file-1');
    });

    it('should show empty state when no items', async () => {
      // Arrange
      const input = {
        "contextItems": []
};

      // Act
      render(<ContextItemsList {...input} />);

      // Assert
      expect(screen.getByText('No context items selected')).toBeInTheDocument();
    });

  });

  describe('US-03-05: Toggle context panel visibility', () => {
    // User Story:
    // As a user
    // I want to expand and collapse the context panel
    // So that I can focus on conversation when I don't need to see context details

    it('should start collapsed by default', async () => {
      // Arrange

      // Act
      render(<ContextPanel />);

      // Assert
      expect(screen.queryByRole('region')).not.toBeVisible();
    });

    it('should expand when toggle clicked', async () => {
      // Arrange

      // Act
      render(<ContextPanel />)
await userEvent.click(screen.getByRole('button', { name: /expand/i }))
;

      // Assert
      expect(screen.getByRole('region')).toBeVisible();
    });

    it('should persist expanded state', async () => {
      // Arrange

      // Act
      render(<ContextPanel />)
await userEvent.click(screen.getByRole('button', { name: /expand/i }))
;

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('contextPanelExpanded', 'true');
    });

    it('should restore expanded state from localStorage', async () => {
      // Arrange

      // Act
      render(<ContextPanel />);

      // Assert
      expect(screen.getByRole('region')).toBeVisible();
    });

  });

});

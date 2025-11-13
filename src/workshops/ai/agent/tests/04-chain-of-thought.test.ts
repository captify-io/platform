// Auto-generated from agent/user-stories/04-chain-of-thought.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Chain of Thought Visualization (04)
// Priority: P1
// Story Points: 8
// Estimated Hours: 16

describe('Feature: Chain of Thought Visualization', () => {
  describe('US-04-01: View reasoning steps for assistant responses', () => {
    // User Story:
    // As a user
    // I want to see the AI's reasoning steps before the final answer
    // So that I can understand how the AI arrived at its conclusion

    it('should display reasoning section when metadata exists', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Analyze the question",
                        "content": "The user is asking about contract renewal dates"
                },
                {
                        "step": 2,
                        "title": "Query the database",
                        "content": "Search for contracts with renewal dates in Q1 2025"
                },
                {
                        "step": 3,
                        "title": "Format the results",
                        "content": "Present the data in a table format"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.getByText('Reasoning')).toBeInTheDocument();
      expect(screen.getByText('3 steps')).toBeInTheDocument();
    });

    it('should expand to show all steps when clicked', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Analyze the question",
                        "content": "The user is asking about contract renewal dates"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />)
await userEvent.click(screen.getByText('Reasoning'))
;

      // Assert
      expect(screen.getByText('Step 1:')).toBeInTheDocument();
      expect(screen.getByText('Analyze the question')).toBeInTheDocument();
      expect(screen.getByText('The user is asking about contract renewal dates')).toBeInTheDocument();
    });

    it('should not display when no reasoning metadata', async () => {
      // Arrange
      const input = {
        "reasoning": null
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.queryByText('Reasoning')).not.toBeInTheDocument();
    });

  });

  describe('US-04-02: Display tool calls within reasoning steps', () => {
    // User Story:
    // As a user
    // I want to see which tools were called during reasoning
    // So that I can understand what data sources informed the answer

    it('should display tool badges for steps with tool calls', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Query the database",
                        "content": "Searching for contracts...",
                        "toolCalls": [
                                "queryDatabase",
                                "fetchContractDetails"
                        ]
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.getByText('queryDatabase')).toBeInTheDocument();
      expect(screen.getByText('fetchContractDetails')).toBeInTheDocument();
    });

    it('should call onToolClick when tool badge clicked', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Query",
                        "content": "Searching...",
                        "toolCalls": [
                                "queryDatabase"
                        ]
                }
        ],
        "onToolClick": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByText('queryDatabase'));

      // Assert
      expect(input.onToolClick).toHaveBeenCalledWith('queryDatabase');
    });

    it('should not show tool section when no tools called', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Analyze",
                        "content": "Thinking..."
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.queryByTestId('tool-badge')).not.toBeInTheDocument();
    });

  });

  describe('US-04-03: Show duration for each reasoning step', () => {
    // User Story:
    // As a user
    // I want to see how long each reasoning step took
    // So that I can understand performance and where time was spent

    it('should display duration in seconds for long steps', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Query",
                        "content": "Searching...",
                        "duration": 1234
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    it('should display duration in milliseconds for fast steps', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Analyze",
                        "content": "Thinking...",
                        "duration": 350
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.getByText('350ms')).toBeInTheDocument();
    });

    it('should not display duration when not provided', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step",
                        "content": "Content"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.queryByText(/ms|s/)).not.toBeInTheDocument();
    });

  });

  describe('US-04-04: Collapse and expand individual reasoning steps', () => {
    // User Story:
    // As a user
    // I want to collapse individual steps I've already reviewed
    // So that I can focus on specific parts of the reasoning

    it('should start with all steps expanded', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step 1",
                        "content": "Content 1"
                },
                {
                        "step": 2,
                        "title": "Step 2",
                        "content": "Content 2"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />)
await userEvent.click(screen.getByText('Reasoning'))
;

      // Assert
      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('should collapse step when collapse button clicked', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step 1",
                        "content": "Content 1"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />)
await userEvent.click(screen.getByText('Reasoning'))
const collapseBtn = screen.getAllByRole('button').find(btn => btn.getAttribute('aria-label')?.includes('Collapse'))
await userEvent.click(collapseBtn)
;

      // Assert
      expect(screen.queryByText('Content 1')).not.toBeVisible();
      expect(screen.getByText('Step 1')).toBeVisible();
    });

    it('should expand collapsed step when expand button clicked', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step 1",
                        "content": "Content 1"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />)
await userEvent.click(screen.getByText('Reasoning'))
const collapseBtn = screen.getAllByRole('button').find(btn => btn.getAttribute('aria-label')?.includes('Collapse'))
await userEvent.click(collapseBtn)
const expandBtn = screen.getAllByRole('button').find(btn => btn.getAttribute('aria-label')?.includes('Expand'))
await userEvent.click(expandBtn)
;

      // Assert
      expect(screen.getByText('Content 1')).toBeVisible();
    });

  });

  describe('US-04-05: Persist reasoning visibility preference', () => {
    // User Story:
    // As a user
    // I want my reasoning section expanded/collapsed state to be remembered
    // So that I don't have to re-expand it on every message

    it('should save expanded state to localStorage', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step",
                        "content": "Content"
                }
        ]
};

      // Act
      await userEvent.click(screen.getByText('Reasoning'));

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('reasoningExpanded', 'true');
    });

    it('should restore expanded state from localStorage', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step",
                        "content": "Content"
                }
        ]
};

      // Act
      render(<ChainOfThought {...input} />);

      // Assert
      expect(screen.getByText('Content')).toBeVisible();
    });

    it('should save collapsed state to localStorage', async () => {
      // Arrange
      const input = {
        "reasoning": [
                {
                        "step": 1,
                        "title": "Step",
                        "content": "Content"
                }
        ]
};

      // Act
      await userEvent.click(screen.getByText('Reasoning'));

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('reasoningExpanded', 'false');
    });

  });

});

// Auto-generated from workshops/agent/user-stories/02-enhanced-code-blocks.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Enhanced Code Blocks (02)
// Priority: P1
// Story Points: 3
// Estimated Hours: 6

describe('Feature: Enhanced Code Blocks', () => {
  describe('US-02-01: View code with syntax highlighting', () => {
    // User Story:
    // As a developer
    // I want to see code with proper syntax highlighting
    // So that I can read and understand code easily

    it('should render code with syntax highlighting', async () => {
      // Arrange
      const input = {
        "language": "typescript",
        "code": "const x = 1;"
};

      // Act
      render(<CodeBlock {...input} />);

      // Assert
      expect(screen.getByText('const')).toBeInTheDocument();
      expect(SyntaxHighlighter).toHaveBeenCalled();
    });

    it('should detect language from className', async () => {
      // Arrange
      const input = {
        "className": "language-typescript",
        "children": "const x = 1;"
};

      // Act
      const { language } = parseCodeProps(input);

      // Assert
      expect(language).toBe('typescript');
    });

    it('should fallback to 'text' for unknown language', async () => {
      // Arrange
      const input = {
        "className": "language-unknown",
        "children": "some code"
};

      // Act
      const { language } = parseCodeProps(input);

      // Assert
      expect(language).toBe('text');
    });

  });

  describe('US-02-02: Toggle line numbers', () => {
    // User Story:
    // As a developer
    // I want to toggle line numbers on and off
    // So that I can reference specific lines when needed

    it('should show line numbers by default', async () => {
      // Arrange

      // Act
      render(<CodeBlock code='const x = 1;' language='typescript' />);

      // Assert
      expect(SyntaxHighlighter).toHaveBeenCalledWith(expect.objectContaining({ showLineNumbers: true }));
    });

    it('should toggle line numbers', async () => {
      // Arrange

      // Act
      render(<CodeBlock code='const x = 1;' language='typescript' />)
await userEvent.click(screen.getByRole('checkbox'))
;

      // Assert
      expect(SyntaxHighlighter).toHaveBeenLastCalledWith(expect.objectContaining({ showLineNumbers: false }));
    });

    it('should persist preference to localStorage', async () => {
      // Arrange

      // Act
      render(<CodeBlock code='const x = 1;' language='typescript' />)
await userEvent.click(screen.getByRole('checkbox'))
;

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('codeBlockPrefs', expect.stringContaining('"showLineNumbers":false'));
    });

  });

  describe('US-02-03: Copy code without line numbers', () => {
    // User Story:
    // As a developer
    // I want to copy code without line numbers included
    // So that I can paste it directly into my editor

    it('should copy code without line numbers', async () => {
      // Arrange
      const input = {
        "code": "const x = 1;\\nconst y = 2;",
        "language": "typescript",
        "showLineNumbers": true
};

      // Act
      render(<CodeBlock {...input} />)
await userEvent.click(screen.getByTitle('Copy code'))
;

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;\nconst y = 2;');
      expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(expect.stringContaining('1  '));
    });

    it('should show visual feedback after copy', async () => {
      // Arrange

      // Act
      render(<CodeBlock code='const x = 1;' language='typescript' />)
await userEvent.click(screen.getByTitle('Copy code'))
;

      // Assert
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Copied'));
    });

  });

  describe('US-02-04: Expand and collapse long code blocks', () => {
    // User Story:
    // As a user
    // I want long code blocks to be collapsed by default
    // So that my chat window doesn't get cluttered

    it('should collapse code blocks longer than 20 lines', async () => {
      // Arrange
      const input = {
        "code": "Array(30).fill('const x = 1;').join('\\\\n')",
        "language": "typescript"
};

      // Act
      render(<CodeBlock {...input} />);

      // Assert
      expect(screen.getByText(/Show 10 more lines/)).toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveStyle({ maxHeight: '400px' });
    });

    it('should not show expand button for short code', async () => {
      // Arrange
      const input = {
        "code": "Array(15).fill('const x = 1;').join('\\\\n')",
        "language": "typescript"
};

      // Act
      render(<CodeBlock {...input} />);

      // Assert
      expect(screen.queryByText(/Show.*more/)).not.toBeInTheDocument();
    });

    it('should expand when button clicked', async () => {
      // Arrange
      const input = {
        "code": "Array(30).fill('const x = 1;').join('\\\\n')",
        "language": "typescript"
};

      // Act
      render(<CodeBlock {...input} />)
await userEvent.click(screen.getByText(/Show 10 more lines/))
;

      // Assert
      expect(screen.getByText(/Show less/)).toBeInTheDocument();
      expect(screen.getByRole('region')).not.toHaveStyle({ maxHeight: '400px' });
    });

    it('should collapse again when 'Show less' clicked', async () => {
      // Arrange
      const input = {
        "code": "Array(30).fill('const x = 1;').join('\\\\n')",
        "language": "typescript"
};

      // Act
      render(<CodeBlock {...input} />)
await userEvent.click(screen.getByText(/Show 10 more lines/))
await userEvent.click(screen.getByText(/Show less/))
;

      // Assert
      expect(screen.getByText(/Show 10 more lines/)).toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveStyle({ maxHeight: '400px' });
    });

  });

  describe('US-02-05: Display language badge', () => {
    // User Story:
    // As a developer
    // I want to see what programming language the code is
    // So that I know how to interpret and use it

    it('should show language badge', async () => {
      // Arrange
      const input = {
        "code": "const x = 1;",
        "language": "typescript"
};

      // Act
      render(<CodeBlock {...input} />);

      // Assert
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toHaveClass('language-badge');
    });

    it('should show 'text' for unknown language', async () => {
      // Arrange
      const input = {
        "code": "some code",
        "language": "unknown"
};

      // Act
      render(<CodeBlock {...input} />);

      // Assert
      expect(screen.getByText('text')).toBeInTheDocument();
    });

  });

});

// Auto-generated from agent/user-stories/05-inline-citations.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Inline Citations (05)
// Priority: P1
// Story Points: 6
// Estimated Hours: 12

describe('Feature: Inline Citations', () => {
  describe('US-05-01: Display citation markers in message text', () => {
    // User Story:
    // As a user
    // I want to see citation markers [1], [2] embedded in message text
    // So that I know which parts of the answer are sourced from references

    it('should render citation markers as clickable badges', async () => {
      // Arrange
      const input = {
        "content": "The contract expires on January 15, 2025[1] and has a renewal option[2].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract ABC-123"
                },
                {
                        "id": "2",
                        "type": "document",
                        "title": "Renewal Terms"
                }
        ]
};

      // Act
      render(<MessageWithCitations {...input} />);

      // Assert
      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
      expect(screen.getByText('[1]')).toHaveClass('citation-marker');
    });

    it('should call onCitationClick when marker clicked', async () => {
      // Arrange
      const input = {
        "content": "The contract expires on January 15, 2025[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract ABC-123"
                }
        ],
        "onCitationClick": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByText('[1]'));

      // Assert
      expect(input.onCitationClick).toHaveBeenCalledWith(1);
    });

    it('should render text normally when no citations', async () => {
      // Arrange
      const input = {
        "content": "This is regular text without any citations.",
        "sources": []
};

      // Act
      render(<MessageWithCitations {...input} />);

      // Assert
      expect(screen.queryByText(/\[\d+\]/)).not.toBeInTheDocument();
      expect(screen.getByText('This is regular text without any citations.')).toBeInTheDocument();
    });

  });

  describe('US-05-02: Show citation tooltip on hover', () => {
    // User Story:
    // As a user
    // I want to see a preview of the source when I hover over a citation
    // So that I can quickly understand what the citation refers to without scrolling

    it('should show tooltip with source title on hover', async () => {
      // Arrange
      const input = {
        "content": "The contract expires[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract ABC-123",
                        "quote": "The agreement shall expire on January 15, 2025"
                }
        ]
};

      // Act
      await userEvent.hover(screen.getByText('[1]'));

      // Assert
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toContainText('Contract ABC-123');
    });

    it('should show quote in tooltip when available', async () => {
      // Arrange
      const input = {
        "content": "The contract expires[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract ABC-123",
                        "quote": "The agreement shall expire on January 15, 2025"
                }
        ]
};

      // Act
      await userEvent.hover(screen.getByText('[1]'));

      // Assert
      expect(screen.getByRole('tooltip')).toContainText('The agreement shall expire on January 15, 2025');
    });

    it('should hide tooltip when cursor moves away', async () => {
      // Arrange
      const input = {
        "content": "The contract expires[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract ABC-123"
                }
        ]
};

      // Act
      await userEvent.hover(screen.getByText('[1]'))
await userEvent.unhover(screen.getByText('[1]'))
;

      // Assert
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

  });

  describe('US-05-03: Display sources list at bottom of message', () => {
    // User Story:
    // As a user
    // I want to see all sources referenced in the message
    // So that I can access them directly

    it('should display sources list for cited messages', async () => {
      // Arrange
      const input = {
        "content": "The contract expires[1] and has renewal terms[2].",
        "sources": [
                {
                        "id": "source-1",
                        "type": "document",
                        "title": "Contract ABC-123",
                        "url": "/documents/abc-123"
                },
                {
                        "id": "source-2",
                        "type": "ontology",
                        "title": "Renewal Terms Entity",
                        "url": "/ontology/renewal-terms"
                }
        ]
};

      // Act
      render(<MessageWithCitations {...input} />);

      // Assert
      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('[1] Contract ABC-123')).toBeInTheDocument();
      expect(screen.getByText('[2] Renewal Terms Entity')).toBeInTheDocument();
    });

    it('should call onSourceClick when source clicked', async () => {
      // Arrange
      const input = {
        "content": "The contract expires[1].",
        "sources": [
                {
                        "id": "source-1",
                        "type": "document",
                        "title": "Contract ABC-123"
                }
        ],
        "onSourceClick": "jest.fn()"
};

      // Act
      await userEvent.click(screen.getByText('[1] Contract ABC-123'));

      // Assert
      expect(input.onSourceClick).toHaveBeenCalledWith('source-1');
    });

    it('should not display sources list when no citations', async () => {
      // Arrange
      const input = {
        "content": "Regular text without citations.",
        "sources": []
};

      // Act
      render(<MessageWithCitations {...input} />);

      // Assert
      expect(screen.queryByText('Sources')).not.toBeInTheDocument();
    });

  });

  describe('US-05-04: Show source type with appropriate icon', () => {
    // User Story:
    // As a user
    // I want to see icons indicating source type (document, ontology, file)
    // So that I can quickly identify the type of source

    it('should display document icon for document sources', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract"
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByTestId('document-icon')).toBeInTheDocument();
    });

    it('should display ontology icon for ontology sources', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "ontology",
                        "title": "Entity"
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByTestId('ontology-icon')).toBeInTheDocument();
    });

    it('should display file icon for file sources', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "file",
                        "title": "report.pdf"
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });

  });

  describe('US-05-05: Display confidence score for citations', () => {
    // User Story:
    // As a user
    // I want to see how confident the AI is about each citation
    // So that I can prioritize which sources to verify

    it('should display confidence score when available', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract",
                        "confidence": 0.95
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('should show green indicator for high confidence', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract",
                        "confidence": 0.95
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByTestId('confidence-indicator')).toHaveClass('text-green-600');
    });

    it('should show warning for low confidence', async () => {
      // Arrange
      const input = {
        "content": "Text[1].",
        "sources": [
                {
                        "id": "1",
                        "type": "document",
                        "title": "Contract",
                        "confidence": 0.45
                }
        ]
};

      // Act
      render(<SourcesList {...input} />);

      // Assert
      expect(screen.getByText(/verify/i)).toBeInTheDocument();
      expect(screen.getByTestId('confidence-indicator')).toHaveClass('text-yellow-600');
    });

  });

});

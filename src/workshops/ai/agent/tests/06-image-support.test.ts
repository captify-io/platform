// Auto-generated from agent/user-stories/06-image-support.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Image Support (06)
// Priority: P2
// Story Points: 8
// Estimated Hours: 16

describe('Feature: Image Support', () => {
  describe('US-06-01: Display images in message content', () => {
    // User Story:
    // As a user
    // I want to see images embedded in assistant messages
    // So that I can view visual content generated or referenced by the AI

    it('should render image when image part exists', async () => {
      // Arrange
      const input = {
        "message": {
                "parts": [
                        {
                                "type": "image",
                                "url": "https://example.com/image.jpg",
                                "alt": "Example diagram"
                        }
                ]
        }
};

      // Act
      render(<MessageBubble {...input} />);

      // Assert
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Example diagram');
    });

    it('should show loading skeleton while image loads', async () => {
      // Arrange
      const input = {
        "message": {
                "parts": [
                        {
                                "type": "image",
                                "url": "https://example.com/image.jpg"
                        }
                ]
        }
};

      // Act
      render(<MessageBubble {...input} />);

      // Assert
      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();
    });

    it('should show error state when image fails to load', async () => {
      // Arrange
      const input = {
        "message": {
                "parts": [
                        {
                                "type": "image",
                                "url": "https://invalid.com/broken.jpg"
                        }
                ]
        }
};

      // Act
      render(<MessageBubble {...input} />)
fireEvent.error(screen.getByRole('img'))
;

      // Assert
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

  });

  describe('US-06-02: Upload images to conversation', () => {
    // User Story:
    // As a user
    // I want to upload images to share with the agent
    // So that I can ask questions about visual content

    it('should open file picker when upload button clicked', async () => {
      // Arrange

      // Act
      await userEvent.click(screen.getByRole('button', { name: /upload image/i }));

      // Assert
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
    });

    it('should upload image to S3 when file selected', async () => {
      // Arrange
      const input = {
        "file": "test.jpg",
        "fileType": "image/jpeg"
};

      // Act
      const file = new File(['image'], input.file, { type: input.fileType })
const inputEl = screen.getByLabelText('Upload image')
await userEvent.upload(inputEl, file)
;

      // Assert
      expect(s3.upload).toHaveBeenCalled();
      expect(s3.upload).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'image/jpeg' }));
    });

    it('should show preview after upload', async () => {
      // Arrange
      const input = {
        "file": "test.jpg",
        "fileType": "image/jpeg"
};

      // Act
      const file = new File(['image'], input.file, { type: input.fileType })
await userEvent.upload(screen.getByLabelText('Upload image'), file)
await waitFor(() => screen.getByTestId('image-preview'))
;

      // Assert
      expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://s3.amazonaws.com/bucket/image.jpg');
    });

  });

  describe('US-06-03: Generate images using AI', () => {
    // User Story:
    // As a user
    // I want to request image generation from the agent
    // So that I can create visual content through conversation

    it('should call Bedrock when generation requested', async () => {
      // Arrange

      // Act
      await sendMessage({ text: "Generate an image of a sunset" })
await waitFor(() => bedrock.generateImage)
;

      // Assert
      expect(bedrock.generateImage).toHaveBeenCalled();
      expect(bedrock.generateImage).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining('sunset') }));
    });

    it('should show loading state during generation', async () => {
      // Arrange
      const input = {
        "status": "generating",
        "prompt": "A sunset over mountains"
};

      // Act
      render(<ImageGenerationStatus {...input} />);

      // Assert
      expect(screen.getByText('Generating image...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display generated image when complete', async () => {
      // Arrange

      // Act
      await sendMessage({ text: "Generate an image of a sunset" })
await waitFor(() => screen.getByRole('img'))
;

      // Assert
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://s3.amazonaws.com/bucket/generated-123.jpg');
    });

  });

  describe('US-06-04: View image in full-screen modal', () => {
    // User Story:
    // As a user
    // I want to click on an image to view it in full size
    // So that I can see details more clearly

    it('should open modal when image clicked', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image.jpg",
        "alt": "Example"
};

      // Act
      await userEvent.click(screen.getByRole('img'));

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toContainElement(screen.getAllByRole('img')[1]);
    });

    it('should show zoom controls in modal', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image.jpg"
};

      // Act
      await userEvent.click(screen.getByRole('img'));

      // Assert
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    });

    it('should close modal when close button clicked', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image.jpg"
};

      // Act
      await userEvent.click(screen.getByRole('img'))
await userEvent.click(screen.getByRole('button', { name: /close/i }))
;

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

  });

  describe('US-06-05: Optimize image loading performance', () => {
    // User Story:
    // As a user
    // I want images to load efficiently without blocking the page
    // So that I can continue reading while images load

    it('should use lazy loading for images', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image.jpg"
};

      // Act
      render(<ImageMessage {...input} />);

      // Assert
      expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
    });

    it('should use srcset for responsive images', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image.jpg",
        "srcset": "https://example.com/image-800.jpg 800w, https://example.com/image-1200.jpg 1200w"
};

      // Act
      render(<ImageMessage {...input} />);

      // Assert
      expect(screen.getByRole('img')).toHaveAttribute('srcset');
    });

    it('should load thumbnail first for large images', async () => {
      // Arrange
      const input = {
        "src": "https://example.com/image-large.jpg",
        "thumbnail": "https://example.com/image-thumb.jpg"
};

      // Act
      render(<ImageMessage {...input} />);

      // Assert
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image-thumb.jpg');
    });

  });

});

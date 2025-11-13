/**
 * ProseMirror Operations Utilities
 *
 * Generate ProseMirror steps from high-level operations
 * Used by agents to programmatically modify documents
 */

import { Step, ReplaceStep } from 'prosemirror-transform';
import { Slice, Fragment } from 'prosemirror-model';

/**
 * Generate steps to insert content at a position
 *
 * @param {Node} doc - Current document
 * @param {number} position - Position to insert at
 * @param {any} content - Content to insert (ProseMirror node JSON or text)
 * @param {Schema} schema - ProseMirror schema
 * @returns {{ steps: Step[], inverseSteps: Step[] }}
 */
export function generateInsertSteps(doc, position, content, schema) {
  try {
    // Validate position
    if (position < 0 || position > doc.content.size) {
      throw new Error(`Invalid position ${position} (doc size: ${doc.content.size})`);
    }

    // Convert content to ProseMirror node
    let contentNode;
    if (typeof content === 'string') {
      // Plain text - create text node
      contentNode = schema.text(content);
    } else if (content.type) {
      // ProseMirror node JSON
      contentNode = schema.nodeFromJSON(content);
    } else {
      throw new Error('Invalid content format');
    }

    // Create slice from content
    const slice = new Slice(Fragment.from(contentNode), 0, 0);

    // Create replace step (insert at position without deleting)
    const step = new ReplaceStep(position, position, slice);

    // Apply step to get result document
    const result = step.apply(doc);
    if (result.failed) {
      throw new Error(`Step application failed: ${result.failed}`);
    }

    // Generate inverse step (delete what we just inserted)
    const contentSize = slice.content.size;
    const inverseStep = new ReplaceStep(position, position + contentSize, Slice.empty);

    return {
      steps: [step],
      inverseSteps: [inverseStep],
      newDoc: result.doc,
    };
  } catch (error) {
    console.error('[ProseMirrorOps] Error generating insert steps:', error);
    throw error;
  }
}

/**
 * Generate steps to delete content in a range
 *
 * @param {Node} doc - Current document
 * @param {number} from - Start position
 * @param {number} to - End position
 * @returns {{ steps: Step[], inverseSteps: Step[] }}
 */
export function generateDeleteSteps(doc, from, to) {
  try {
    // Validate range
    if (from < 0 || to > doc.content.size || from > to) {
      throw new Error(`Invalid range [${from}, ${to}] (doc size: ${doc.content.size})`);
    }

    // Get the content being deleted (for inverse)
    const deletedContent = doc.slice(from, to);

    // Create delete step
    const step = new ReplaceStep(from, to, Slice.empty);

    // Apply step to verify
    const result = step.apply(doc);
    if (result.failed) {
      throw new Error(`Step application failed: ${result.failed}`);
    }

    // Create inverse step (re-insert deleted content)
    const inverseStep = new ReplaceStep(from, from, deletedContent.content);

    return {
      steps: [step],
      inverseSteps: [inverseStep],
      newDoc: result.doc,
    };
  } catch (error) {
    console.error('[ProseMirrorOps] Error generating delete steps:', error);
    throw error;
  }
}

/**
 * Generate steps to replace content in a range
 *
 * @param {Node} doc - Current document
 * @param {number} from - Start position
 * @param {number} to - End position
 * @param {any} content - New content (ProseMirror node JSON or text)
 * @param {Schema} schema - ProseMirror schema
 * @returns {{ steps: Step[], inverseSteps: Step[] }}
 */
export function generateReplaceSteps(doc, from, to, content, schema) {
  try {
    // Validate range
    if (from < 0 || to > doc.content.size || from > to) {
      throw new Error(`Invalid range [${from}, ${to}] (doc size: ${doc.content.size})`);
    }

    // Get the content being replaced (for inverse)
    const replacedContent = doc.slice(from, to);

    // Convert new content to ProseMirror node
    let contentNode;
    if (typeof content === 'string') {
      contentNode = schema.text(content);
    } else if (content.type) {
      contentNode = schema.nodeFromJSON(content);
    } else {
      throw new Error('Invalid content format');
    }

    // Create slice from new content
    const slice = new Slice(Fragment.from(contentNode), 0, 0);

    // Create replace step
    const step = new ReplaceStep(from, to, slice);

    // Apply step to verify
    const result = step.apply(doc);
    if (result.failed) {
      throw new Error(`Step application failed: ${result.failed}`);
    }

    // Create inverse step (replace back with original content)
    const newTo = from + slice.content.size;
    const inverseStep = new ReplaceStep(from, newTo, replacedContent.content);

    return {
      steps: [step],
      inverseSteps: [inverseStep],
      newDoc: result.doc,
    };
  } catch (error) {
    console.error('[ProseMirrorOps] Error generating replace steps:', error);
    throw error;
  }
}

/**
 * Find position by search criteria
 *
 * @param {Node} doc - Document to search
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.text - Text to find
 * @param {number} criteria.occurrence - Which occurrence (1-based, default 1)
 * @returns {number|null} Position or null if not found
 */
export function findPosition(doc, criteria) {
  const { text, occurrence = 1 } = criteria;

  if (!text) {
    return null;
  }

  let foundCount = 0;
  let position = null;

  // Walk the document
  doc.descendants((node, pos) => {
    if (node.isText && node.text.includes(text)) {
      foundCount++;
      if (foundCount === occurrence) {
        // Found the target occurrence
        position = pos + node.text.indexOf(text);
        return false; // Stop traversal
      }
    }
  });

  return position;
}

/**
 * Generate preview text for a change
 *
 * @param {string} type - Change type ('insert', 'delete', 'replace')
 * @param {any} content - Content being added/modified
 * @param {Node} doc - Document (for delete operations)
 * @param {number} from - Start position (for delete/replace)
 * @param {number} to - End position (for delete/replace)
 * @returns {string} Preview text
 */
export function generatePreviewText(type, content, doc = null, from = null, to = null) {
  const MAX_PREVIEW_LENGTH = 50;

  switch (type) {
    case 'insert': {
      const text = typeof content === 'string'
        ? content
        : extractTextFromContent(content);

      if (text.length <= MAX_PREVIEW_LENGTH) {
        return `Insert "${text}"`;
      }
      return `Insert "${text.substring(0, MAX_PREVIEW_LENGTH)}..."`;
    }

    case 'delete': {
      if (doc && from !== null && to !== null) {
        const deletedText = extractTextFromRange(doc, from, to);
        if (deletedText.length <= MAX_PREVIEW_LENGTH) {
          return `Delete "${deletedText}"`;
        }
        return `Delete "${deletedText.substring(0, MAX_PREVIEW_LENGTH)}..."`;
      }
      return 'Delete content';
    }

    case 'replace': {
      const newText = typeof content === 'string'
        ? content
        : extractTextFromContent(content);

      if (doc && from !== null && to !== null) {
        const oldText = extractTextFromRange(doc, from, to);
        return `Replace "${oldText.substring(0, 20)}" with "${newText.substring(0, 20)}"`;
      }

      if (newText.length <= MAX_PREVIEW_LENGTH) {
        return `Replace with "${newText}"`;
      }
      return `Replace with "${newText.substring(0, MAX_PREVIEW_LENGTH)}..."`;
    }

    default:
      return 'Modify content';
  }
}

/**
 * Extract text content from ProseMirror node JSON
 */
function extractTextFromContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (content.text) {
    return content.text;
  }

  if (content.content && Array.isArray(content.content)) {
    return content.content.map(extractTextFromContent).join('');
  }

  return '';
}

/**
 * Extract text from a document range
 */
function extractTextFromRange(doc, from, to) {
  let text = '';

  doc.nodesBetween(from, to, (node) => {
    if (node.isText) {
      text += node.text;
    }
  });

  return text;
}

/**
 * Validate position is within bounds
 */
export function validatePosition(doc, position) {
  if (position < 0 || position > doc.content.size) {
    return {
      valid: false,
      error: `Position ${position} out of bounds (doc size: ${doc.content.size})`,
    };
  }

  return { valid: true };
}

/**
 * Validate range is within bounds
 */
export function validateRange(doc, from, to) {
  if (from < 0 || to > doc.content.size) {
    return {
      valid: false,
      error: `Range [${from}, ${to}] out of bounds (doc size: ${doc.content.size})`,
    };
  }

  if (from > to) {
    return {
      valid: false,
      error: `Invalid range: from (${from}) > to (${to})`,
    };
  }

  return { valid: true };
}

/**
 * Default Tool Set Configuration
 *
 * Defines which tools should be enabled by default for new agents.
 * This provides a good starting point without overwhelming context.
 */

/**
 * DEFAULT TOOL SET (12 tools)
 *
 * Essential tools every agent should have:
 * - Core ontology operations (5)
 * - Essential widgets (4)
 * - Introspection (1)
 * - Knowledge search (1)
 * - Workflow clarification (1)
 */
export const DEFAULT_TOOL_IDS = [
  // Core Ontology Operations (5 tools)
  'tool-ontology-query',         // Query any entity with filters
  'tool-ontology-create',        // Create any entity
  'tool-ontology-update',        // Update any entity
  'tool-ontology-delete',        // Delete any entity
  'tool-introspect-ontology',    // Understand entity schemas (lazy-loaded)

  // Essential Widgets (4 tools) - Most common display needs
  'tool-widget-table',           // Display tabular data
  'tool-widget-chart',           // Display charts
  'tool-widget-card',            // Display info cards
  'tool-widget-message',         // Display alerts/notifications

  // Utility (2 tools)
  'tool-search-knowledge-base',  // Semantic search
  'tool-clarify-user-intent',    // Ask for clarification

  // OPTIONAL: Can be added as needed
  // 'tool-widget-form',         // Form display
  // 'tool-widget-list',         // Simple lists
  // 'tool-upload-document',     // Document management
  // 'tool-create-request',      // PMBook-specific
  // 'tool-create-capability',   // Strategic-specific
];

/**
 * FULL TOOL SET (20 tools)
 *
 * All available tools - for advanced agents
 */
export const FULL_TOOL_SET = [
  // Core Ontology (5)
  'tool-ontology-query',
  'tool-ontology-create',
  'tool-ontology-update',
  'tool-ontology-delete',
  'tool-introspect-ontology',

  // All Widgets (6)
  'tool-widget-table',
  'tool-widget-chart',
  'tool-widget-card',
  'tool-widget-message',
  'tool-widget-form',
  'tool-widget-list',

  // App-Specific (4)
  'tool-search-knowledge-base',
  'tool-upload-document',
  'tool-create-request',
  'tool-create-capability',

  // Workflow (5 - excluding one duplicate)
  'tool-clarify-user-intent',
  'tool-finalize-planning-phase',
  'tool-finalize-building-phase',
  'tool-finalize-execution-phase',
  'tool-finalize-planning-no-data',
];

/**
 * MINIMAL TOOL SET (8 tools)
 *
 * Bare minimum for read-only agents
 */
export const MINIMAL_TOOL_SET = [
  // Query only
  'tool-ontology-query',
  'tool-introspect-ontology',

  // Display only
  'tool-widget-table',
  'tool-widget-chart',
  'tool-widget-card',
  'tool-widget-message',

  // Utility
  'tool-search-knowledge-base',
  'tool-clarify-user-intent',
];

console.log('\n📊 TOOL SET CONFIGURATIONS:\n');
console.log(`MINIMAL (${MINIMAL_TOOL_SET.length} tools):`);
console.log('  Read-only agents with basic display');
console.log('  Context: ~6K tokens');

console.log(`\nDEFAULT (${DEFAULT_TOOL_IDS.length} tools):`);
console.log('  Standard agents with CRUD + common widgets');
console.log('  Context: ~9K tokens');

console.log(`\nFULL (${FULL_TOOL_SET.length} tools):`);
console.log('  Advanced agents with all capabilities');
console.log('  Context: ~15K tokens');

console.log('\n✅ Use DEFAULT_TOOL_IDS for new agents');

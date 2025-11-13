#!/usr/bin/env tsx
/**
 * Test Generator for YAML User Stories
 *
 * Generates Jest test files from YAML user story specifications.
 * Follows the workshop TDD workflow pattern.
 *
 * Usage:
 *   npm run generate:tests
 *   npm run generate:tests -- path/to/user-stories/
 *   npm run generate:tests -- path/to/specific.yaml
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { parse as parseYAML } from 'yaml';

interface TestScenario {
  name: string;
  type: 'unit' | 'component' | 'integration';
  arrange: {
    mocks?: Record<string, any>;
    props?: Record<string, any>;
    input?: Record<string, any>;
  };
  act: string;
  assert: string[];
}

interface UserStory {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria?: Array<{
    condition: string;
    expected: string;
    test: string;
  }>;
  edge_cases?: Array<{
    scenario: string;
    expected_behavior: string;
  }>;
  test_scenarios: TestScenario[];
}

interface YAMLSpec {
  feature: {
    id: string;
    name: string;
    priority: string;
    story_points: number;
    estimated_hours: number;
  };
  dependencies?: string[];
  services_required?: string[];
  components_required?: string[];
  aws_services?: string[];
  tables?: string[];
  indexes?: string[];
  stories: UserStory[];
}

/**
 * Convert YAML value to TypeScript/JSON code
 */
function valueToCode(value: any, indent: number = 6): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => valueToCode(item, indent + 2));
    const innerIndent = ' '.repeat(indent + 2);
    return `[\n${items.map(item => `${innerIndent}${item}`).join(',\n')}\n${' '.repeat(indent)}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const innerIndent = ' '.repeat(indent + 2);
    const lines = entries.map(([key, val]) => {
      const needsQuotes = !key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
      const keyStr = needsQuotes ? JSON.stringify(key) : key;
      return `${innerIndent}${keyStr}: ${valueToCode(val, indent + 2)}`;
    });
    return `{\n${lines.join(',\n')}\n${' '.repeat(indent)}}`;
  }

  return String(value);
}

/**
 * Generate test file content from YAML specification
 */
function generateTestFile(spec: YAMLSpec, yamlPath: string): string {
  const { feature, stories, services_required = [], components_required = [] } = spec;

  // Build imports
  const imports: string[] = [];

  // Add service imports - apiClient is the main service import
  if (services_required.length > 0 && services_required.some(s => s.includes('/api'))) {
    imports.push(`import { apiClient } from '@captify-io/core/lib/api';`);
  }

  // Add component imports for React Testing Library if needed
  const hasComponentTests = stories.some(story =>
    story.test_scenarios?.some(scenario => scenario.type === 'component')
  );

  if (hasComponentTests) {
    imports.push(`import { render, screen, fireEvent, waitFor } from '@testing-library/react';`);
  }

  // Build mock setup
  const mocks: string[] = [];
  if (services_required.some(s => s.includes('api'))) {
    mocks.push(`jest.mock('@captify-io/core/lib/api');`);
  }

  // Build test suites
  const testSuites: string[] = [];

  for (const story of stories) {
    const storyTests: string[] = [];

    // Add user story comment
    storyTests.push(`    // User Story:`);
    storyTests.push(`    // As ${story.as_a}`);
    storyTests.push(`    // I want ${story.i_want}`);
    storyTests.push(`    // So that ${story.so_that}`);
    storyTests.push('');

    // Generate test scenarios
    for (const scenario of story.test_scenarios) {
      const testLines: string[] = [];

      testLines.push(`    it('${scenario.name}', async () => {`);

      // Arrange section
      testLines.push(`      // Arrange`);

      // Setup mocks
      if (scenario.arrange.mocks) {
        for (const [mockPath, mockConfig] of Object.entries(scenario.arrange.mocks)) {
          const mockFn = mockPath.replace(/\./g, '.');

          if (mockConfig.resolves !== undefined) {
            testLines.push(`      (${mockFn} as jest.Mock).mockResolvedValue(${valueToCode(mockConfig.resolves, 6)});`);
          } else if (mockConfig.rejects !== undefined) {
            const errorMsg = typeof mockConfig.rejects === 'string'
              ? `new Error('${mockConfig.rejects}')`
              : `new Error(${JSON.stringify(mockConfig.rejects)})`;
            testLines.push(`      (${mockFn} as jest.Mock).mockRejectedValue(${errorMsg});`);
          }
        }
      }

      // Setup props/input
      if (scenario.arrange.props) {
        testLines.push(`      const props = ${valueToCode(scenario.arrange.props, 6)};`);
      }
      if (scenario.arrange.input) {
        testLines.push(`      const input = ${valueToCode(scenario.arrange.input, 6)};`);
      }

      testLines.push('');

      // Act section
      testLines.push(`      // Act`);
      const actLines = scenario.act.trim().split('\n');
      actLines.forEach(line => {
        testLines.push(`      ${line.trim()}`);
      });
      testLines.push('');

      // Assert section
      testLines.push(`      // Assert`);
      scenario.assert.forEach(assertion => {
        testLines.push(`      ${assertion}`);
      });

      testLines.push(`    });`);
      testLines.push('');

      storyTests.push(...testLines);
    }

    // Add edge case comments
    if (story.edge_cases && story.edge_cases.length > 0) {
      storyTests.push(`    // Edge Cases to Consider:`);
      story.edge_cases.forEach(edge => {
        storyTests.push(`    // - ${edge.scenario}: ${edge.expected_behavior}`);
      });
      storyTests.push('');
    }

    testSuites.push(`  describe('${story.id}: ${story.title}', () => {\n${storyTests.join('\n')}  });`);
  }

  // Build final file content
  const relPath = relative(process.cwd(), yamlPath);
  const lines: string[] = [
    `// Auto-generated from ${relPath}`,
    `// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests`,
    `//`,
    `// Feature: ${feature.name} (${feature.id})`,
    `// Priority: ${feature.priority}`,
    `// Story Points: ${feature.story_points}`,
    `// Estimated Hours: ${feature.estimated_hours}`,
    '',
    ...imports,
    '',
    ...mocks,
    '',
    `describe('Feature: ${feature.name}', () => {`,
    ...testSuites,
    '});',
    ''
  ];

  return lines.join('\n');
}

/**
 * Process a single YAML file
 */
function processYAMLFile(yamlPath: string): void {
  console.log(`Processing: ${yamlPath}`);

  try {
    // Read and parse YAML
    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const spec = parseYAML(yamlContent) as YAMLSpec;

    // Determine output path
    const dir = dirname(yamlPath);
    const fileName = basename(yamlPath, '.yaml');
    const testDir = dir.replace('/user-stories', '/tests');
    const testPath = join(testDir, `${fileName}.test.ts`);

    // Ensure test directory exists
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Generate test file
    const testContent = generateTestFile(spec, yamlPath);

    // Write test file
    writeFileSync(testPath, testContent, 'utf-8');

    console.log(`✓ Generated: ${testPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${yamlPath}:`, error);
    throw error;
  }
}

/**
 * Find all YAML files in a directory
 */
function findYAMLFiles(dirPath: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findYAMLFiles(fullPath));
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return files;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  // Default to all workshops if no args
  const searchPaths = args.length > 0
    ? args
    : [join(process.cwd(), 'src/workshops')];

  console.log('🧪 Test Generator for YAML User Stories\n');

  let processedCount = 0;
  let errorCount = 0;

  for (const searchPath of searchPaths) {
    const fullPath = join(process.cwd(), searchPath);

    if (!existsSync(fullPath)) {
      console.error(`Path does not exist: ${fullPath}`);
      continue;
    }

    const stat = statSync(fullPath);
    const yamlFiles = stat.isDirectory()
      ? findYAMLFiles(fullPath)
      : [fullPath];

    for (const yamlFile of yamlFiles) {
      try {
        processYAMLFile(yamlFile);
        processedCount++;
      } catch (error) {
        errorCount++;
      }
    }
  }

  console.log(`\n✨ Complete! Processed ${processedCount} file(s)`);

  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} error(s) occurred`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

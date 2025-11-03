#!/usr/bin/env tsx
/**
 * Ontology Cleanup Script - Phase 0
 *
 * This script removes duplicate nodes, fixes naming issues, and reorganizes domains.
 *
 * Usage:
 *   npm run cleanup-ontology -- --dry-run    # Preview changes
 *   npm run cleanup-ontology                 # Execute changes
 *
 * What it does:
 * 1. Backs up current ontology (nodes + edges)
 * 2. Identifies duplicate nodes (57 pairs found)
 * 3. Resolves duplicates by keeping {app}-{type} format
 * 4. Updates all edge references
 * 5. Fixes naming issues (cLIN → clin, vendorEntity → vendor)
 * 6. Reorganizes domains (Programs → Products, etc.)
 * 7. Validates all relationships
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

const isDryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

// AWS Configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client);

const NODES_TABLE = 'captify-core-ontology-node';
const EDGES_TABLE = 'captify-core-ontology-edge';
const BACKUP_DIR = '/tmp/ontology-backup';

interface OntologyNode {
  id: string;
  name?: string;
  type: string;
  domain: string;
  category: string;
  app?: string;
  [key: string]: any;
}

interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceType?: string;
  targetType?: string;
  [key: string]: any;
}

interface DuplicatePair {
  keep: OntologyNode;
  delete: OntologyNode;
  reason: string;
  edgeCountKeep: number;
  edgeCountDelete: number;
}

// Naming fixes
const NAMING_FIXES: Record<string, string> = {
  'pmbook-cLIN': 'pmbook-clin',
  'pmbook-cDRL': 'pmbook-cdrl',
  'pmbook-kPI': 'pmbook-kpi',
  'pmbook-kPIReading': 'pmbook-kpi-reading',
  'pmbook-vendorEntity': 'pmbook-vendor',
  'node-vendorentity': 'pmbook-vendor',
  'node-clin': 'pmbook-clin',
  'node-cdrl': 'pmbook-cdrl',
  'node-kpi': 'pmbook-kpi',
};

// Domain reorganization
const DOMAIN_UPDATES: Record<string, { domain: string; category: string; app?: string }> = {
  // Move to Core
  'node-team': { domain: 'People', category: 'people', app: 'core' },
  'pmbook-team': { domain: 'People', category: 'people', app: 'core' },

  // Products domain (renamed from Programs)
  'pmbook-program': { domain: 'Products', category: 'product' },
  'pmbook-initiative': { domain: 'Products', category: 'product' },
  'pmbook-capability': { domain: 'Products', category: 'product' },
  'pmbook-feature': { domain: 'Products', category: 'product' },
  'pmbook-backlogItem': { domain: 'Products', category: 'product' },
  'pmbook-task': { domain: 'Products', category: 'product' },

  // Contracts domain
  'pmbook-contract': { domain: 'Contracts', category: 'legal' },
  'pmbook-clin': { domain: 'Contracts', category: 'financial' },
  'pmbook-cdrl': { domain: 'Contracts', category: 'deliverable' },
  'pmbook-invoice': { domain: 'Contracts', category: 'financial' },
  'pmbook-payment': { domain: 'Contracts', category: 'financial' },

  // Vendors domain
  'pmbook-vendor': { domain: 'Vendors', category: 'stakeholder' },
  'pmbook-customer': { domain: 'Vendors', category: 'stakeholder' },

  // Performance domain
  'pmbook-outcome': { domain: 'Performance', category: 'metric' },
  'pmbook-kpi': { domain: 'Performance', category: 'metric' },
  'pmbook-kpi-reading': { domain: 'Performance', category: 'metric' },
  'pmbook-report': { domain: 'Performance', category: 'reporting' },
  'pmbook-weeklyUpdate': { domain: 'Performance', category: 'reporting' },

  // Cybersecurity domain
  'pmbook-cyberAssessment': { domain: 'Cybersecurity', category: 'security' },
  'pmbook-cyberControl': { domain: 'Cybersecurity', category: 'security' },
  'pmbook-cyberFinding': { domain: 'Cybersecurity', category: 'security' },
  'pmbook-cyberPOAM': { domain: 'Cybersecurity', category: 'security' },
  'pmbook-cyberIncident': { domain: 'Cybersecurity', category: 'security' },
};

// Statistics
const stats = {
  nodesScanned: 0,
  edgesScanned: 0,
  duplicatesFound: 0,
  duplicatesRemoved: 0,
  namingFixed: 0,
  domainsUpdated: 0,
  edgesUpdated: 0,
  orphanedEdges: 0,
  errors: [] as string[]
};

async function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
  const prefix = {
    info: '📋',
    warn: '⚠️ ',
    error: '❌',
    success: '✅'
  }[level];

  console.log(`${prefix} ${message}`);
}

async function scanAllNodes(): Promise<OntologyNode[]> {
  log('Scanning all ontology nodes...');
  const nodes: OntologyNode[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new ScanCommand({
      TableName: NODES_TABLE,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const result = await docClient.send(command);
    if (result.Items) {
      nodes.push(...result.Items as OntologyNode[]);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  stats.nodesScanned = nodes.length;
  log(`Found ${nodes.length} nodes`, 'success');
  return nodes;
}

async function scanAllEdges(): Promise<OntologyEdge[]> {
  log('Scanning all ontology edges...');
  const edges: OntologyEdge[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new ScanCommand({
      TableName: EDGES_TABLE,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const result = await docClient.send(command);
    if (result.Items) {
      edges.push(...result.Items as OntologyEdge[]);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  stats.edgesScanned = edges.length;
  log(`Found ${edges.length} edges`, 'success');
  return edges;
}

async function countEdgeReferences(nodeId: string, edges: OntologyEdge[]): Promise<number> {
  return edges.filter(e => e.source === nodeId || e.target === nodeId).length;
}

async function findDuplicates(nodes: OntologyNode[], edges: OntologyEdge[]): Promise<DuplicatePair[]> {
  log('Identifying duplicate nodes...');
  const pairs: DuplicatePair[] = [];

  // Group by name or type
  const nameMap = new Map<string, OntologyNode[]>();

  for (const node of nodes) {
    const key = (node.name || node.type).toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(node);
  }

  // Find duplicates
  for (const [name, dupes] of nameMap.entries()) {
    if (dupes.length > 1) {
      // Sort: prefer {app}-{type} format over node-{type}
      const sorted = dupes.sort((a, b) => {
        const aIsAppFormat = a.id.match(/^[a-z]+-[a-z]/);
        const bIsAppFormat = b.id.match(/^[a-z]+-[a-z]/);

        if (aIsAppFormat && !bIsAppFormat) return -1;
        if (!aIsAppFormat && bIsAppFormat) return 1;

        // If both same format, prefer one with more edges
        return 0;
      });

      const keep = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        const del = sorted[i];
        const keepCount = await countEdgeReferences(keep.id, edges);
        const delCount = await countEdgeReferences(del.id, edges);

        pairs.push({
          keep: keepCount >= delCount ? keep : del,
          delete: keepCount >= delCount ? del : keep,
          reason: keepCount >= delCount
            ? `Keep ${keep.id} (${keepCount} edges) over ${del.id} (${delCount} edges)`
            : `Keep ${del.id} (${delCount} edges) over ${keep.id} (${keepCount} edges)`,
          edgeCountKeep: Math.max(keepCount, delCount),
          edgeCountDelete: Math.min(keepCount, delCount)
        });
      }
    }
  }

  stats.duplicatesFound = pairs.length;
  log(`Found ${pairs.length} duplicate pairs to resolve`, pairs.length > 0 ? 'warn' : 'success');
  return pairs;
}

async function backupData(nodes: OntologyNode[], edges: OntologyEdge[]) {
  log('Creating backup...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const nodesFile = path.join(BACKUP_DIR, `nodes-${timestamp}.json`);
  const edgesFile = path.join(BACKUP_DIR, `edges-${timestamp}.json`);

  fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
  fs.writeFileSync(edgesFile, JSON.stringify(edges, null, 2));

  log(`Backup created: ${BACKUP_DIR}`, 'success');
  log(`  - Nodes: ${nodesFile}`);
  log(`  - Edges: ${edgesFile}`);
}

async function updateEdgeReferences(
  edges: OntologyEdge[],
  oldId: string,
  newId: string
): Promise<number> {
  const toUpdate = edges.filter(e => e.source === oldId || e.target === oldId);

  if (toUpdate.length === 0) return 0;

  log(`  Updating ${toUpdate.length} edges referencing ${oldId} → ${newId}`);

  for (const edge of toUpdate) {
    const updated = {
      ...edge,
      source: edge.source === oldId ? newId : edge.source,
      target: edge.target === oldId ? newId : edge.target
    };

    if (!isDryRun) {
      try {
        await docClient.send(new PutCommand({
          TableName: EDGES_TABLE,
          Item: updated
        }));
      } catch (error) {
        stats.errors.push(`Failed to update edge ${edge.id}: ${error}`);
      }
    }
  }

  return toUpdate.length;
}

async function removeDuplicates(pairs: DuplicatePair[], edges: OntologyEdge[]) {
  log(`\nRemoving ${pairs.length} duplicate nodes...`);

  for (const pair of pairs) {
    log(`\n  ${pair.reason}`);

    // Update edge references
    const edgeUpdates = await updateEdgeReferences(edges, pair.delete.id, pair.keep.id);
    stats.edgesUpdated += edgeUpdates;

    // Delete duplicate node
    if (!isDryRun) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: NODES_TABLE,
          Key: { id: pair.delete.id }
        }));
        stats.duplicatesRemoved++;
        log(`    Deleted ${pair.delete.id}`, 'success');
      } catch (error) {
        stats.errors.push(`Failed to delete ${pair.delete.id}: ${error}`);
        log(`    Failed to delete ${pair.delete.id}`, 'error');
      }
    } else {
      log(`    Would delete ${pair.delete.id} (DRY RUN)`);
    }
  }
}

async function fixNaming(nodes: OntologyNode[], edges: OntologyEdge[]) {
  log(`\nFixing naming issues...`);

  for (const [oldId, newId] of Object.entries(NAMING_FIXES)) {
    const node = nodes.find(n => n.id === oldId);
    if (!node) continue;

    log(`  ${oldId} → ${newId}`);

    // Update edge references
    const edgeUpdates = await updateEdgeReferences(edges, oldId, newId);
    stats.edgesUpdated += edgeUpdates;

    // Update node ID and type
    const updated = {
      ...node,
      id: newId,
      type: newId.split('-').pop()!
    };

    if (!isDryRun) {
      try {
        // Delete old
        await docClient.send(new DeleteCommand({
          TableName: NODES_TABLE,
          Key: { id: oldId }
        }));

        // Create new
        await docClient.send(new PutCommand({
          TableName: NODES_TABLE,
          Item: updated
        }));

        stats.namingFixed++;
        log(`    Fixed ${oldId} → ${newId}`, 'success');
      } catch (error) {
        stats.errors.push(`Failed to fix naming ${oldId}: ${error}`);
      }
    } else {
      log(`    Would rename ${oldId} → ${newId} (DRY RUN)`);
    }
  }
}

async function reorganizeDomains(nodes: OntologyNode[]) {
  log(`\nReorganizing domains...`);

  for (const [nodeId, updates] of Object.entries(DOMAIN_UPDATES)) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    log(`  ${nodeId}: ${node.domain} → ${updates.domain}`);

    if (!isDryRun) {
      try {
        const updateExpr = [];
        const attrNames: Record<string, string> = {};
        const attrValues: Record<string, any> = {};

        updateExpr.push('#domain = :domain');
        attrNames['#domain'] = 'domain';
        attrValues[':domain'] = updates.domain;

        updateExpr.push('#category = :category');
        attrNames['#category'] = 'category';
        attrValues[':category'] = updates.category;

        if (updates.app) {
          updateExpr.push('app = :app');
          attrValues[':app'] = updates.app;
        }

        await docClient.send(new UpdateCommand({
          TableName: NODES_TABLE,
          Key: { id: nodeId },
          UpdateExpression: `SET ${updateExpr.join(', ')}`,
          ExpressionAttributeNames: attrNames,
          ExpressionAttributeValues: attrValues
        }));

        stats.domainsUpdated++;
      } catch (error) {
        stats.errors.push(`Failed to update domain for ${nodeId}: ${error}`);
      }
    } else {
      log(`    Would update ${nodeId} (DRY RUN)`);
    }
  }
}

async function validateEdges(nodes: OntologyNode[], edges: OntologyEdge[]) {
  log(`\nValidating edge relationships...`);

  const nodeIds = new Set(nodes.map(n => n.id));
  const orphaned: OntologyEdge[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      orphaned.push(edge);
    }
  }

  if (orphaned.length > 0) {
    log(`  Found ${orphaned.length} orphaned edges`, 'warn');
    stats.orphanedEdges = orphaned.length;

    if (!isDryRun) {
      for (const edge of orphaned) {
        try {
          await docClient.send(new DeleteCommand({
            TableName: EDGES_TABLE,
            Key: { id: edge.id }
          }));
          log(`    Deleted orphaned edge: ${edge.id}`, 'success');
        } catch (error) {
          stats.errors.push(`Failed to delete orphaned edge ${edge.id}: ${error}`);
        }
      }
    } else {
      log(`    Would delete ${orphaned.length} orphaned edges (DRY RUN)`);
    }
  } else {
    log(`  All edges valid`, 'success');
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`\nNodes scanned: ${stats.nodesScanned}`);
  console.log(`Edges scanned: ${stats.edgesScanned}`);
  console.log(`\nDuplicates found: ${stats.duplicatesFound}`);
  console.log(`Duplicates removed: ${stats.duplicatesRemoved}`);
  console.log(`Naming issues fixed: ${stats.namingFixed}`);
  console.log(`Domains updated: ${stats.domainsUpdated}`);
  console.log(`Edges updated: ${stats.edgesUpdated}`);
  console.log(`Orphaned edges removed: ${stats.orphanedEdges}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log(`\n✅ No errors`);
  }

  const reduction = ((stats.duplicatesRemoved / stats.nodesScanned) * 100).toFixed(1);
  const finalCount = stats.nodesScanned - stats.duplicatesRemoved;
  console.log(`\nFinal node count: ${finalCount} (${reduction}% reduction)`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    log(`Starting ontology cleanup ${isDryRun ? '(DRY RUN)' : ''}...`, 'info');

    // Step 1: Load all data
    const nodes = await scanAllNodes();
    const edges = await scanAllEdges();

    // Step 2: Backup
    if (!isDryRun) {
      await backupData(nodes, edges);
    }

    // Step 3: Find duplicates
    const duplicates = await findDuplicates(nodes, edges);

    // Step 4: Remove duplicates
    await removeDuplicates(duplicates, edges);

    // Step 5: Fix naming
    await fixNaming(nodes, edges);

    // Step 6: Reorganize domains
    await reorganizeDomains(nodes);

    // Step 7: Validate edges
    await validateEdges(nodes, edges);

    // Step 8: Summary
    await printSummary();

    if (isDryRun) {
      log('\n💡 Run without --dry-run to execute changes', 'info');
    } else {
      log('\n✅ Cleanup complete!', 'success');
    }

  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  }
}

main();

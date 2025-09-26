import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand, BatchExecuteStatementCommand, SqlParameter } from "@aws-sdk/client-rds-data";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

interface AuroraStatement {
  sql: string;
  parameters?: any[];
}

interface AuroraResult {
  records?: any[][];
  numberOfRecordsUpdated?: number;
  generatedFields?: any[];
  columnMetadata?: any[];
}

async function createAuroraClient(credentials: AwsCredentials): Promise<RDSDataClient> {
  return new RDSDataClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}

// Helper function to execute SQL with automatic schema setting
async function executeWithSchema(
  client: RDSDataClient,
  clusterArn: string,
  secretArn: string,
  database: string,
  sql: string,
  parameters?: any[],
  transactionId?: string,
  includeMetadata = false
) {
  const schema = process.env.SCHEMA || 'captify';

  // Prepend USE schema statement if not already specified in SQL
  let finalSql = sql;
  if (!sql.toLowerCase().includes('use ') && !sql.toLowerCase().includes(`${schema}.`)) {
    finalSql = `USE \`${schema}\`; ${sql}`;
  }

  const command = new ExecuteStatementCommand({
    resourceArn: clusterArn,
    secretArn: secretArn,
    database: database,
    sql: finalSql,
    parameters: formatParameters(parameters),
    includeResultMetadata: includeMetadata,
    transactionId: transactionId,
  });

  return await client.send(command);
}

function formatParameters(parameters?: any[]): SqlParameter[] | undefined {
  if (!parameters || parameters.length === 0) return undefined;

  return parameters.map((param): SqlParameter => {
    if (param === null || param === undefined) {
      return { name: 'null', value: { isNull: true } };
    } else if (typeof param === 'string') {
      return { name: 'string', value: { stringValue: param } };
    } else if (typeof param === 'number') {
      return Number.isInteger(param)
        ? { name: 'long', value: { longValue: param } }
        : { name: 'double', value: { doubleValue: param } };
    } else if (typeof param === 'boolean') {
      return { name: 'boolean', value: { booleanValue: param } };
    } else if (param instanceof Date) {
      return { name: 'string', value: { stringValue: param.toISOString() } };
    } else {
      return { name: 'string', value: { stringValue: JSON.stringify(param) } };
    }
  });
}

function formatResultToDynamoStyle(result: AuroraResult, operation: string) {
  if (operation === 'query' || operation === 'scan') {
    // Convert Aurora records to DynamoDB-style Items
    const items = result.records?.map(record => {
      const item: any = {};
      if (result.columnMetadata) {
        result.columnMetadata.forEach((column, index) => {
          const value = record[index];
          if (value !== null && value !== undefined) {
            if (value.stringValue !== undefined) item[column.name] = value.stringValue;
            else if (value.longValue !== undefined) item[column.name] = value.longValue;
            else if (value.doubleValue !== undefined) item[column.name] = value.doubleValue;
            else if (value.booleanValue !== undefined) item[column.name] = value.booleanValue;
            else if (value.isNull) item[column.name] = null;
            else item[column.name] = value;
          }
        });
      }
      return item;
    }) || [];

    return {
      Items: items,
      Count: items.length,
      ScannedCount: items.length,
    };
  } else {
    // For INSERT/UPDATE/DELETE operations
    return {
      Attributes: result.generatedFields?.[0] || {},
      ConsumedCapacity: { TableName: 'aurora-table', CapacityUnits: 1 },
    };
  }
}

async function execute(
  request: {
    service: string;
    operation: string;
    table?: string;
    schema?: string;
    app?: string;
    data?: any;
  },
  credentials: AwsCredentials,
  session?: {
    user: {
      id: string;
      userId: string;
      email?: string;
      name?: string;
      groups?: string[];
      isAdmin?: boolean;
    };
    idToken?: string;
    groups?: string[];
    isAdmin?: boolean;
  }
) {
  try {
    const {
      operation,
      table,
      schema = "captify",
      app = "core",
      data = {},
    } = request;

    const client = await createAuroraClient(credentials);

    // Get cluster and database info from environment
    const clusterArn = process.env.AURORA_CLUSTER_ARN;
    const secretArn = process.env.AURORA_SECRET_ARN;
    const database = process.env.SCHEMA || 'captify';

    if (!clusterArn || !secretArn) {
      throw new Error("Aurora cluster ARN and secret ARN must be configured in environment variables");
    }

    switch (operation) {
      case "query":
      case "scan": {
        let sql = data.sql;
        let parameters = data.parameters;

        // If no custom SQL, build from table
        if (!sql && table) {
          const fullTableName = `${schema}_${app}_${table}`;
          sql = `SELECT * FROM ${fullTableName}`;

          // Add WHERE conditions if provided
          if (data.where) {
            const conditions = Object.keys(data.where).map(key => `${key} = ?`).join(' AND ');
            sql += ` WHERE ${conditions}`;
            parameters = Object.values(data.where);
          }

          // Add ORDER BY if provided
          if (data.orderBy) {
            sql += ` ORDER BY ${data.orderBy}`;
            if (data.orderDirection) {
              sql += ` ${data.orderDirection}`;
            }
          }

          // Add LIMIT if provided
          if (data.limit) {
            sql += ` LIMIT ${data.limit}`;
          }

          // Add OFFSET if provided
          if (data.offset) {
            sql += ` OFFSET ${data.offset}`;
          }
        }

        // Add user context filtering for user tables (similar to DynamoDB logic)
        if (table === 'users' && session?.user && !session.isAdmin && !session.user.isAdmin) {
          const userId = session.user.id;
          if (sql.toLowerCase().includes('where')) {
            sql += ` AND id = ?`;
            parameters = [...(parameters || []), userId];
          } else {
            sql += ` WHERE id = ?`;
            parameters = [userId];
          }
        }

        const result = await executeWithSchema(
          client,
          clusterArn,
          secretArn,
          database,
          sql,
          parameters,
          undefined,
          true
        );
        const formattedResult = formatResultToDynamoStyle(result, operation);

        return {
          success: true,
          data: formattedResult,
          metadata: {
            requestId: `aurora-${operation}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: `aurora.${operation}`,
            sql: sql,
            parametersCount: parameters?.length || 0,
          },
        };
      }

      case "get": {
        if (!table) {
          throw new Error("Table parameter is required for get operation");
        }

        const fullTableName = `${schema}_${app}_${table}`;
        const key = data.key || data.Key;

        if (!key) {
          throw new Error("Key parameter is required for get operation");
        }

        // Build WHERE clause from key
        const whereConditions = Object.keys(key).map(k => `${k} = ?`).join(' AND ');
        const parameters = Object.values(key);

        let sql = `SELECT * FROM ${fullTableName} WHERE ${whereConditions}`;

        // Add user context validation for user tables
        if (table === 'users' && session?.user && !session.isAdmin && !session.user.isAdmin) {
          const userId = session.user.id;
          if (key.id && key.id !== userId) {
            return {
              success: false,
              error: "Access denied. You can only access your own user record.",
              metadata: {
                requestId: `aurora-access-denied-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: "aurora.get",
                userId: userId,
                attemptedAccess: key.id
              },
            };
          }
        }

        const result = await executeWithSchema(
          client,
          clusterArn,
          secretArn,
          database,
          sql,
          parameters,
          undefined,
          true
        );
        const formattedResult = formatResultToDynamoStyle(result, 'query');

        return {
          success: true,
          data: formattedResult.Items?.[0] || null,
          metadata: {
            requestId: `aurora-get-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.get",
            sql: sql,
          },
        };
      }

      case "put":
      case "create":
      case "insert": {
        let sql = data.sql;
        let parameters = data.parameters;

        if (!sql && table) {
          const fullTableName = `${schema}_${app}_${table}`;
          const item = data.item || data.Item;

          if (!item) {
            throw new Error("Item parameter is required for put operation");
          }

          // User context validation for user tables
          if (table === 'users' && session?.user && !session.isAdmin && !session.user.isAdmin) {
            const userId = session.user.id;
            if (item.id && item.id !== userId) {
              return {
                success: false,
                error: "Access denied. You can only create a user record with your own ID.",
                metadata: {
                  requestId: `aurora-access-denied-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  source: "aurora.put",
                  userId: userId,
                  attemptedId: item.id
                },
              };
            }
            if (!item.id) {
              item.id = userId;
            }
          }

          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          parameters = Object.values(item);

          sql = `INSERT INTO ${fullTableName} (${columns}) VALUES (${placeholders})`;

          // Add ON DUPLICATE KEY UPDATE for upsert behavior
          if (data.upsert) {
            const updateClause = Object.keys(item)
              .filter(key => key !== 'id') // Don't update primary key
              .map(key => `${key} = VALUES(${key})`)
              .join(', ');
            if (updateClause) {
              sql += ` ON DUPLICATE KEY UPDATE ${updateClause}`;
            }
          }
        }

        const result = await executeWithSchema(
          client,
          clusterArn,
          secretArn,
          database,
          sql,
          parameters
        );

        return {
          success: true,
          data: {
            message: "Item created successfully",
            affectedRows: result.numberOfRecordsUpdated || 1
          },
          metadata: {
            requestId: `aurora-put-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.put",
            sql: sql,
          },
        };
      }

      case "update": {
        let sql = data.sql;
        let parameters = data.parameters;

        if (!sql && table) {
          const fullTableName = `${schema}_${app}_${table}`;
          const key = data.key || data.Key;
          const updates = data.updates || data.UpdateExpression;

          if (!key) {
            throw new Error("Key parameter is required for update operation");
          }

          // User context validation for user tables
          if (table === 'users' && session?.user && !session.isAdmin && !session.user.isAdmin) {
            const userId = session.user.id;
            if (key.id && key.id !== userId) {
              return {
                success: false,
                error: "Access denied. You can only update your own user record.",
                metadata: {
                  requestId: `aurora-access-denied-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  source: "aurora.update",
                  userId: userId,
                  attemptedAccess: key.id
                },
              };
            }
          }

          if (updates && typeof updates === 'object') {
            // Object-style updates
            const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            const whereClause = Object.keys(key).map(k => `${k} = ?`).join(' AND ');
            parameters = [...Object.values(updates), ...Object.values(key)];
            sql = `UPDATE ${fullTableName} SET ${setClause} WHERE ${whereClause}`;
          } else if (typeof updates === 'string') {
            // DynamoDB-style UpdateExpression
            const whereClause = Object.keys(key).map(k => `${k} = ?`).join(' AND ');
            parameters = [...Object.values(data.ExpressionAttributeValues || {}), ...Object.values(key)];

            // Convert DynamoDB UpdateExpression to SQL
            let setClause = updates.replace(/SET\s+/i, '').replace(/#(\w+)/g, '$1').replace(/:(\w+)/g, '?');
            sql = `UPDATE ${fullTableName} SET ${setClause} WHERE ${whereClause}`;
          }
        }

        const result = await executeWithSchema(
          client,
          clusterArn,
          secretArn,
          database,
          sql,
          parameters
        );

        return {
          success: true,
          data: {
            message: "Item updated successfully",
            affectedRows: result.numberOfRecordsUpdated || 0
          },
          metadata: {
            requestId: `aurora-update-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.update",
            sql: sql,
          },
        };
      }

      case "delete": {
        let sql = data.sql;
        let parameters = data.parameters;

        if (!sql && table) {
          const fullTableName = `${schema}_${app}_${table}`;
          const key = data.key || data.Key;

          if (!key) {
            throw new Error("Key parameter is required for delete operation");
          }

          // User context validation for user tables
          if (table === 'users' && session?.user && !session.isAdmin && !session.user.isAdmin) {
            return {
              success: false,
              error: "Access denied. Only administrators can delete user records.",
              metadata: {
                requestId: `aurora-access-denied-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: "aurora.delete",
                userId: session.user.id
              },
            };
          }

          const whereClause = Object.keys(key).map(k => `${k} = ?`).join(' AND ');
          parameters = Object.values(key);
          sql = `DELETE FROM ${fullTableName} WHERE ${whereClause}`;
        }

        const result = await executeWithSchema(
          client,
          clusterArn,
          secretArn,
          database,
          sql,
          parameters
        );

        return {
          success: true,
          data: {
            message: "Item deleted successfully",
            affectedRows: result.numberOfRecordsUpdated || 0
          },
          metadata: {
            requestId: `aurora-delete-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.delete",
            sql: sql,
          },
        };
      }

      case "transaction": {
        const statements = data.statements as AuroraStatement[];

        if (!statements || !Array.isArray(statements)) {
          throw new Error("Statements array is required for transaction operation");
        }

        // Begin transaction
        const beginCommand = new BeginTransactionCommand({
          resourceArn: clusterArn,
          secretArn: secretArn,
          database: database,
        });

        const beginResult = await client.send(beginCommand);
        const transactionId = beginResult.transactionId;

        try {
          const results = [];

          for (const statement of statements) {
            const result = await executeWithSchema(
              client,
              clusterArn,
              secretArn,
              database,
              statement.sql,
              statement.parameters,
              transactionId
            );
            results.push(result);
          }

          // Commit transaction
          const commitCommand = new CommitTransactionCommand({
            resourceArn: clusterArn,
            secretArn: secretArn,
            transactionId: transactionId,
          });

          await client.send(commitCommand);

          return {
            success: true,
            data: {
              message: "Transaction completed successfully",
              results: results.map(r => ({ affectedRows: r.numberOfRecordsUpdated || 0 }))
            },
            metadata: {
              requestId: `aurora-transaction-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "aurora.transaction",
              transactionId: transactionId,
              statementsCount: statements.length,
            },
          };
        } catch (error) {
          // Rollback transaction on error
          const rollbackCommand = new RollbackTransactionCommand({
            resourceArn: clusterArn,
            secretArn: secretArn,
            transactionId: transactionId,
          });

          await client.send(rollbackCommand);
          throw error;
        }
      }

      case "batch": {
        const statements = data.statements as AuroraStatement[];

        if (!statements || !Array.isArray(statements)) {
          throw new Error("Statements array is required for batch operation");
        }

        const parameterSets = statements.map(stmt => formatParameters(stmt.parameters)).filter((params): params is SqlParameter[] => params !== undefined);

        const command = new BatchExecuteStatementCommand({
          resourceArn: clusterArn,
          secretArn: secretArn,
          database: database,
          sql: statements[0].sql, // All statements should use same SQL template
          parameterSets: parameterSets,
        });

        const result = await client.send(command);

        return {
          success: true,
          data: {
            message: "Batch operation completed successfully",
            results: result.updateResults?.map(r => ({ affectedRows: r.generatedFields?.length || 0 })) || []
          },
          metadata: {
            requestId: `aurora-batch-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.batch",
            statementsCount: statements.length,
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unsupported operation: ${operation}`,
          metadata: {
            requestId: `aurora-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "aurora.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Aurora operation failed",
      metadata: {
        requestId: `aurora-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "aurora.execute",
      },
    };
  }
}

const manifest = {
  name: "aurora",
  version: "1.0.0",
  description: "Aurora Serverless service for SQL operations with DynamoDB-compatible interface",
  operations: [
    "query", "scan", "get", "put", "create", "insert",
    "update", "delete", "transaction", "batch"
  ],
  requiredParams: {
    query: [], // Can use raw SQL or table + conditions
    scan: [], // Can use raw SQL or table
    get: ["table", "key"], // Requires table and key unless using raw SQL
    put: [], // Can use raw SQL or table + item
    create: [], // Alias for put
    insert: [], // Alias for put
    update: [], // Can use raw SQL or table + key + updates
    delete: [], // Can use raw SQL or table + key
    transaction: ["statements"], // Array of SQL statements
    batch: ["statements"], // Array of SQL statements with same template
  },
  features: [
    "Table joins via SQL",
    "Complex queries with WHERE, ORDER BY, GROUP BY, HAVING",
    "Transactions with ACID compliance",
    "Batch operations for performance",
    "DynamoDB-compatible response format",
    "User-level access control",
    "Raw SQL support for advanced operations",
  ],
};

export const aurora = { execute, manifest };
export { execute, manifest, createAuroraClient };
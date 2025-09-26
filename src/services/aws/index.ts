// AWS services - export specific items to avoid conflicts
export { cognito } from "./cognito";
export { dynamo, createDynamoClient } from "./dynamodb";
export { aurora, createAuroraClient } from "./aurora";
export { s3 } from "./s3";
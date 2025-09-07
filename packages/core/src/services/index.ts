import { dynamo } from "./aws/dynamodb";
import { cognito } from "./aws/cognito";
import { s3 } from "./aws/s3";
import { debug } from "./debug";

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "dynamodb":
      case "dynamo":
        return dynamo;
      case "cognito":
        return cognito;
      case "s3":
        return s3;
      case "debug":
        return debug;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },

  // Direct access to services
  dynamodb: dynamo,
  dynamo,
  cognito,
  s3,
  debug,
};

// Export individual services for direct import
export { dynamo, dynamo as dynamodb } from "./aws/dynamodb";
export { cognito } from "./aws/cognito";
export { s3 } from "./aws/s3";
export { debug } from "./debug";

// Export AWS utilities
export * from "./aws";

// Export types
export type { AwsCredentials, ApiUserSession } from "@captify/core/types";

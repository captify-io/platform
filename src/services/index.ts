import { dynamo } from "./aws/dynamodb";
import { aurora } from "./aws/aurora";
import { cognito } from "./aws/cognito";
import { s3 } from "./aws/s3";
import { debug } from "./debug";
import { agent } from "./agent";

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "dynamodb":
      case "dynamo":
        return dynamo;
      case "aurora":
        return aurora;
      case "cognito":
        return cognito;
      case "s3":
        return s3;
      case "debug":
        return debug;
      case "agent":
        return agent;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },

  // Direct access to services
  dynamodb: dynamo,
  dynamo,
  aurora,
  cognito,
  s3,
  debug,
  agent,
};

// Export individual services for direct import
export { dynamo, dynamo as dynamodb } from "./aws/dynamodb";
export { aurora } from "./aws/aurora";
export { cognito } from "./aws/cognito";
export { s3 } from "./aws/s3";
export { debug } from "./debug";
export { agent } from "./agent";

// Export AWS utilities
export * from "./aws";

// Export types
export type { AwsCredentials, ApiUserSession } from "../types";

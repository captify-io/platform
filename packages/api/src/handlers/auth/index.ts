/**
 * Auth Handlers Index
 * Exports all authentication handlers for the API package
 */

export { GET as nextAuthGET, POST as nextAuthPOST } from "./nextauth-handler";
export { POST as cognitoIdentityHandler } from "./cognito-identity";
export { GET as clientInfoHandler } from "./client-info";
export { POST as validateSessionHandler } from "./validate-session";
export { POST as validateEmailHandler } from "./validate-email";
export { POST as saveEmailHandler } from "./save-email";
export {
  GET as getSecureStorageHandler,
  POST as setSecureStorageHandler,
  DELETE as deleteSecureStorageHandler,
} from "./secure-storage";
export { POST as setLoginHintHandler } from "./set-login-hint";
export { POST as signinWithHintHandler } from "./signin-with-hint";
export { GET as cognitoAuthHandler } from "./cognito-auth";

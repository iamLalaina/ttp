/**
 * Server-side Cognito SDK client configuration.
 *
 * Uses amazon-cognito-identity-js for SRP-based authentication flows.
 * This module is ONLY used in API route handlers — never on the client.
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID ?? "";
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID ?? "";

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
};

export function getUserPool(): CognitoUserPool {
  return new CognitoUserPool(poolData);
}

export function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({
    Username: email,
    Pool: getUserPool(),
  });
}

export { AuthenticationDetails, CognitoUserAttribute };

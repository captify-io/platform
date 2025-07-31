# AWS SAM Template for Cognito Identity Pools

This document provides SAM template snippets for creating the required Cognito Identity Pools and IAM roles for AWS service access.

## Complete SAM Template Additions

Add these resources to your `template.yaml`:

```yaml
Parameters:
  CognitoUserPoolId:
    Type: String
    Description: ID of the existing Cognito User Pool
    Default: us-east-1_XXXXXXXXX

  CognitoUserPoolArn:
    Type: String
    Description: ARN of the existing Cognito User Pool
    Default: arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_XXXXXXXXX

Resources:
  # Service Catalog Identity Pool
  ServiceCatalogIdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: captify-service-catalog-identity-pool
      AllowUnauthenticatedIdentities: false
      CognitoIdentityProviders:
        - ClientId: !Ref CognitoUserPoolId
          ProviderName: !Sub "cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPoolId}"

  # IAM Role for Service Catalog Access
  ServiceCatalogAuthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: captify-service-catalog-authenticated-role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Federated: cognito-identity.amazonaws.com
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                "cognito-identity.amazonaws.com:aud": !Ref ServiceCatalogIdentityPool
              "ForAnyValue:StringLike":
                "cognito-identity.amazonaws.com:amr": authenticated
      Policies:
        - PolicyName: ServiceCatalogReadPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - servicecatalog:SearchProducts
                  - servicecatalog:DescribeProduct
                  - servicecatalog:ListPortfolios
                  - servicecatalog:DescribePortfolio
                Resource: "*"

  # Attach Role to Identity Pool
  ServiceCatalogIdentityPoolRoleAttachment:
    Type: AWS::Cognito::IdentityPoolRoleAttachment
    Properties:
      IdentityPoolId: !Ref ServiceCatalogIdentityPool
      Roles:
        authenticated: !GetAtt ServiceCatalogAuthenticatedRole.Arn

  # Bedrock Identity Pool (for future use)
  BedrockIdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: captify-bedrock-identity-pool
      AllowUnauthenticatedIdentities: false
      CognitoIdentityProviders:
        - ClientId: !Ref CognitoUserPoolId
          ProviderName: !Sub "cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPoolId}"

  # IAM Role for Bedrock Access
  BedrockAuthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: captify-bedrock-authenticated-role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Federated: cognito-identity.amazonaws.com
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                "cognito-identity.amazonaws.com:aud": !Ref BedrockIdentityPool
              "ForAnyValue:StringLike":
                "cognito-identity.amazonaws.com:amr": authenticated
      Policies:
        - PolicyName: BedrockAccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:ListFoundationModels
                  - bedrock:GetFoundationModel
                  - bedrock:InvokeModel
                  - bedrock:InvokeModelWithResponseStream
                Resource: "*"

  # Attach Role to Bedrock Identity Pool
  BedrockIdentityPoolRoleAttachment:
    Type: AWS::Cognito::IdentityPoolRoleAttachment
    Properties:
      IdentityPoolId: !Ref BedrockIdentityPool
      Roles:
        authenticated: !GetAtt BedrockAuthenticatedRole.Arn

  # SageMaker Identity Pool (for future use)
  SageMakerIdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: captify-sagemaker-identity-pool
      AllowUnauthenticatedIdentities: false
      CognitoIdentityProviders:
        - ClientId: !Ref CognitoUserPoolId
          ProviderName: !Sub "cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPoolId}"

  # IAM Role for SageMaker Access
  SageMakerAuthenticatedRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: captify-sagemaker-authenticated-role
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Federated: cognito-identity.amazonaws.com
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                "cognito-identity.amazonaws.com:aud": !Ref SageMakerIdentityPool
              "ForAnyValue:StringLike":
                "cognito-identity.amazonaws.com:amr": authenticated
      Policies:
        - PolicyName: SageMakerReadPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - sagemaker:ListModels
                  - sagemaker:DescribeModel
                  - sagemaker:ListEndpoints
                  - sagemaker:DescribeEndpoint
                Resource: "*"

  # Attach Role to SageMaker Identity Pool
  SageMakerIdentityPoolRoleAttachment:
    Type: AWS::Cognito::IdentityPoolRoleAttachment
    Properties:
      IdentityPoolId: !Ref SageMakerIdentityPool
      Roles:
        authenticated: !GetAtt SageMakerAuthenticatedRole.Arn

Outputs:
  ServiceCatalogIdentityPoolId:
    Description: ID of the Service Catalog Identity Pool
    Value: !Ref ServiceCatalogIdentityPool
    Export:
      Name: !Sub "${AWS::StackName}-ServiceCatalogIdentityPoolId"

  BedrockIdentityPoolId:
    Description: ID of the Bedrock Identity Pool
    Value: !Ref BedrockIdentityPool
    Export:
      Name: !Sub "${AWS::StackName}-BedrockIdentityPoolId"

  SageMakerIdentityPoolId:
    Description: ID of the SageMaker Identity Pool
    Value: !Ref SageMakerIdentityPool
    Export:
      Name: !Sub "${AWS::StackName}-SageMakerIdentityPoolId"
```

## Environment Variables Setup

After deployment, update your `.env.local` with the output values:

```bash
# Get the Identity Pool IDs from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name your-stack-name \
  --query 'Stacks[0].Outputs'

# Then update .env.local:
AWS_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AWS_COGNITO_BEDROCK_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AWS_COGNITO_SAGEMAKER_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Deployment Commands

```bash
# Build and deploy the SAM template
sam build
sam deploy --guided

# Or deploy with parameters
sam deploy \
  --parameter-overrides \
    CognitoUserPoolId=us-east-1_XXXXXXXXX \
    CognitoUserPoolArn=arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_XXXXXXXXX
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each AWS service has its own Identity Pool and minimal permissions
2. **Security**: Users can only access what they're authorized for
3. **Scalability**: Cognito Identity Pools handle authentication at scale
4. **Cost-Effective**: No Lambda functions required for authentication
5. **Audit**: All AWS API calls are logged with user context

## Adding New Services

To add a new AWS service (e.g., Lambda):

1. Create a new Identity Pool in the SAM template
2. Create an IAM role with minimal permissions for that service
3. Attach the role to the Identity Pool
4. Add the Identity Pool ID to environment variables
5. Update the API route to use the new Identity Pool

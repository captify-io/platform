# Deployment Guide

## Overview

This document describes the deployment architecture, files, and processes for the TITAN platform infrastructure. The deployment uses AWS SAM (Serverless Application Model) to provision serverless resources on AWS.

## File Structure

```
titan/
├── build/                          # Deployment files
│   ├── template.yaml              # Full SAM template with Neptune
│   ├── template-simple.yaml       # Simplified template (Lambda + API Gateway)
│   └── samconfig.toml             # SAM deployment configuration
├── src/
│   ├── lambda/                    # Lambda function source code
│   │   ├── graph-operations/      # Neptune graph database operations
│   │   ├── bedrock-agent/         # AI agent interactions
│   │   └── document-processing/   # Document processing pipeline
│   └── context/                   # Documentation and context files
└── .aws-sam/                      # SAM build artifacts (auto-generated)
```

## Deployment Templates

### 1. Simple Template (`build/template-simple.yaml`)

**Purpose**: Basic serverless infrastructure without Neptune database
**Resources**:

- 3 Lambda Functions (Graph Operations, Bedrock Agent, Document Processing)
- API Gateway with Cognito authentication
- S3 bucket for document storage
- IAM roles and CloudWatch log groups

**Use Case**: Initial deployment, development, testing

### 2. Full Template (`build/template.yaml`)

**Purpose**: Complete infrastructure including Neptune graph database
**Resources**:

- All resources from simple template
- Amazon Neptune cluster and instance
- VPC with private subnets
- Security groups for Lambda-Neptune connectivity
- CloudWatch monitoring and alarms

**Use Case**: Production deployment with graph database capabilities

## Configuration

### SAM Configuration (`build/samconfig.toml`)

Contains environment-specific deployment parameters:

- Stack names
- AWS region
- Parameter overrides (Cognito, domain, etc.)
- Deployment settings

## Deployment Process

### Prerequisites

- AWS CLI configured with appropriate permissions
- SAM CLI installed
- Cognito User Pool created (us-east-1_k3Fp77c09)

### Step 1: Build

```bash
cd build
sam build -t template-simple.yaml    # For simple deployment
# OR
sam build -t template.yaml           # For full deployment with Neptune
```

### Step 2: Deploy

```bash
sam deploy --template-file template-simple.yaml --no-confirm-changeset \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=dev \
    OrganizationName=captify \
    DomainName=anautics.ai \
    CognitoUserPoolId=us-east-1_k3Fp77c09 \
    CognitoClientId=4og43nmsksolkkrk3v47tj7gv9 \
    CognitoClientSecret=<your-secret>
```

### Step 3: Verify

```bash
aws cloudformation describe-stacks --stack-name captify --query "Stacks[0].Outputs"
```

## Current Deployment Status

### Environment: Development (dev)

- **Stack Name**: `captify`
- **Region**: `us-east-1`
- **Status**: ✅ Deployed (Simple Template)
- **API Gateway**: `https://nip321gg81.execute-api.us-east-1.amazonaws.com/dev`
- **S3 Bucket**: `captify-dev-documents-211125459951`

### Lambda Functions

1. **Graph Operations**: `captify-dev-graph-operations`
2. **Bedrock Agent**: `captify-dev-bedrock-agent`
3. **Document Processing**: `captify-dev-document-processing`

## Development Workflow

### Local Testing

```bash
cd build
sam local start-api -t template-simple.yaml
```

### Update Deployment

```bash
cd build
sam build -t template-simple.yaml
sam deploy
```

### Environment Management

- **Development**: Uses simple template, 7-day log retention
- **Staging**: Full template with Neptune, extended monitoring
- **Production**: Full template with deletion protection, backup retention

## Next Steps

1. **Add Neptune Database**: Deploy full template for graph operations
2. **Frontend Integration**: Update Next.js with deployed API endpoints
3. **Monitoring Setup**: Configure CloudWatch dashboards and alerts
4. **CI/CD Pipeline**: Automate deployment process

## Troubleshooting

### Common Issues

- **IAM Permissions**: Ensure CAPABILITY_IAM and CAPABILITY_NAMED_IAM are specified
- **S3 ARN Format**: Use `!Sub "${BucketName.Arn}/*"` for proper ARN references
- **Circular Dependencies**: Separate security group rules from group definitions
- **Parameter Validation**: Check Cognito credentials and domain settings

### Logs and Monitoring

- CloudWatch Logs: `/aws/lambda/{function-name}`
- CloudFormation Events: AWS Console > CloudFormation > Events
- SAM CLI: Use `--debug` flag for verbose output
  aws configure
  # Enter your AWS Access Key ID, Secret Key, and Region
  ```

  ```

2. **AWS SAM CLI installed**

   ```bash
   # Windows (via Chocolatey)
   choco install aws-sam-cli

   # macOS (via Homebrew)
   brew install aws-sam-cli

   # Or download from: https://aws.amazon.com/serverless/sam/
   ```

3. **Node.js 18+ and npm**

   ```bash
   node --version  # Should be 18+
   npm --version
   ```

4. **Existing Cognito User Pool**
   - User Pool ID
   - App Client ID
   - App Client Secret

### **Infrastructure Components**

The SAM template creates the following AWS resources:

**Core Infrastructure:**

- **VPC** with private subnets for Neptune
- **Security Groups** for Lambda and Neptune
- **IAM Roles** with appropriate permissions

**Database:**

- **Amazon Neptune** cluster with one instance
- **Neptune Subnet Group** for multi-AZ deployment

**Storage:**

- **S3 Bucket** for document storage with lifecycle policies
- **CloudWatch Log Groups** for Lambda functions

**Compute:**

- **Lambda Functions**:
  - `graph-operations` - Neptune CRUD operations
  - `bedrock-agent` - AI agent interactions
  - `document-processing` - File processing pipeline
- **API Gateway** with Cognito authorization

**Monitoring:**

- **CloudWatch Alarms** for Neptune CPU and Lambda errors

### **Deployment Steps**

1. **Clone and Setup**

   ```bash
   git clone <your-repo>
   cd captify
   npm install
   ```

2. **Configure Environment**

   ```bash
   # Copy and edit the SAM config
   cp samconfig.toml.example samconfig.toml

   # Update with your Cognito details in samconfig.toml
   ```

3. **Build the Application**

   ```bash
   sam build
   ```

4. **Deploy to AWS**

   ```bash
   # First deployment (guided)
   sam deploy --guided

   # Subsequent deployments
   sam deploy
   ```

5. **Verify Deployment**

   ```bash
   # Check stack status
   aws cloudformation describe-stacks --stack-name captify-dev

   # Get Neptune endpoint
   aws cloudformation describe-stacks \
     --stack-name captify-dev \
     --query 'Stacks[0].Outputs[?OutputKey==`NeptuneEndpoint`].OutputValue' \
     --output text
   ```

### **Environment Configuration**

After deployment, update your Next.js `.env` file:

```bash
# Add these to your .env file
NEPTUNE_ENDPOINT=<neptune-cluster-endpoint>
NEPTUNE_PORT=8182
S3_BUCKET=<documents-bucket-name>
API_GATEWAY_URL=<api-gateway-url>

# Existing Cognito settings remain the same
COGNITO_USER_POOL_ID=us-east-1_k3Fp77c09
COGNITO_CLIENT_ID=4og43nmsksolkkrk3v47tj7gv9
COGNITO_CLIENT_SECRET=<your-secret>
```

### **Lambda Function Structure**

Create the following Lambda function directories:

```
src/lambda/
├── graph-operations/
│   ├── index.js
│   ├── package.json
│   └── lib/
├── bedrock-agent/
│   ├── index.js
│   ├── package.json
│   └── lib/
└── document-processing/
    ├── index.js
    ├── package.json
    └── lib/
```

### **Initial Data Setup**

1. **Connect to Neptune**

   ```bash
   # Use Neptune notebook or Gremlin console
   # Or run the seeding Lambda function
   ```

2. **Create Initial Entities**

   ```gremlin
   // Create default organization
   g.addV('Organization')
     .property('id', 'default-org')
     .property('name', 'Default Organization')
     .property('awsAccountId', '123456789012')
     .property('createdAt', new Date())
   ```

3. **Seed Sample Applications**
   ```bash
   # Use the data seeding function
   aws lambda invoke \
     --function-name captify-dev-graph-operations \
     --payload '{"action": "seed"}' \
     response.json
   ```

## 🔧 **Development Workflow**

### **Local Development**

1. **Run Next.js locally**

   ```bash
   npm run dev
   ```

2. **Connect to AWS resources**

   - Set up AWS credentials
   - Configure `.env` with deployed resource endpoints
   - Test API integration

3. **Lambda Development**

   ```bash
   # Test Lambda functions locally
   sam local start-api

   # Invoke specific function
   sam local invoke GraphOperationsFunction -e events/test-event.json
   ```

### **CI/CD Pipeline**

```yaml
# Example GitHub Actions workflow
name: Deploy Captify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/setup-sam@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - run: sam build
      - run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

## 🏗️ **Multi-Environment Setup**

### **Environment Configurations**

**Development:**

```bash
sam deploy --config-env dev
```

**Staging:**

```bash
sam deploy --config-env staging --parameter-overrides Environment=staging
```

**Production:**

```bash
sam deploy --config-env prod --parameter-overrides Environment=prod
```

### **Environment Variables**

Each environment gets its own:

- Neptune cluster
- S3 bucket
- API Gateway
- Lambda functions
- CloudWatch logs

## 📊 **Monitoring & Troubleshooting**

### **CloudWatch Dashboards**

1. **Neptune Metrics**

   - CPU utilization
   - Memory usage
   - Query performance
   - Connection count

2. **Lambda Metrics**

   - Invocation count
   - Duration
   - Error rate
   - Throttles

3. **API Gateway Metrics**
   - Request count
   - Latency
   - Error rates
   - Cache hits

### **Troubleshooting**

**Common Issues:**

1. **Neptune Connection Timeout**

   ```bash
   # Check VPC configuration and security groups
   aws ec2 describe-security-groups --group-ids sg-xxxxxx
   ```

2. **Lambda Permission Errors**

   ```bash
   # Check IAM policies
   aws iam get-role-policy --role-name captify-dev-lambda-role --policy-name NeptuneAccess
   ```

3. **Cognito Authorization Failures**
   ```bash
   # Verify API Gateway authorizer configuration
   aws apigateway get-authorizers --rest-api-id xxxxxx
   ```

### **Log Analysis**

```bash
# View Lambda logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/captify-dev-graph-operations \
  --start-time $(date -d '1 hour ago' +%s)000

# View Neptune slow queries
aws neptune describe-db-log-files \
  --db-instance-identifier captify-dev-neptune-instance
```

## 💰 **Cost Optimization**

### **Development Environment**

- Use `db.t3.medium` for Neptune
- Set short retention periods for logs
- Use S3 lifecycle policies

### **Production Environment**

- Right-size Neptune instances based on usage
- Enable Neptune backup and point-in-time recovery
- Set up CloudWatch billing alarms

### **Cost Monitoring**

```bash
# Set up billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "CaptifyMonthlyCost" \
  --alarm-description "Monthly cost alarm" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 **Security Considerations**

### **Network Security**

- Neptune in private subnets only
- Security groups with minimal required access
- VPC endpoints for AWS services

### **IAM Security**

- Principle of least privilege
- Separate roles for each Lambda function
- Resource-based policies where appropriate

### **Data Security**

- S3 bucket encryption at rest
- Neptune cluster encryption
- Secrets stored in AWS Secrets Manager

## 🧪 **Testing Strategy**

### **Infrastructure Testing**

```bash
# Test Neptune connectivity
aws neptune describe-db-clusters --db-cluster-identifier captify-dev-neptune

# Test S3 access
aws s3 ls s3://captify-dev-documents-123456789012/

# Test API Gateway
curl -H "Authorization: Bearer <cognito-token>" \
  https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/graph/health
```

### **End-to-End Testing**

1. Deploy to staging environment
2. Run automated tests against deployed APIs
3. Verify Neptune data operations
4. Test Bedrock agent integration
5. Validate document processing pipeline

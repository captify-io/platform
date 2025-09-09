# AWS Credentials Verification Guide

## Getting Correct AWS Credentials

### Option 1: From AWS IAM Console
1. Log into AWS Console: https://console.aws.amazon.com/
2. Navigate to IAM → Users
3. Find your user (or create a deployment user)
4. Go to Security credentials tab
5. Create new Access Key (or use existing if you have it saved)

### Option 2: From AWS CLI (if configured locally)
Check your local AWS credentials:

```bash
# Windows
type %USERPROFILE%\.aws\credentials

# Mac/Linux
cat ~/.aws/credentials
```

### Option 3: Create New IAM User for GitHub Actions
Recommended for security - create a dedicated user:

1. Go to AWS IAM Console
2. Create new user: `github-actions-deploy`
3. Attach these policies:
   - `AWSElasticBeanstalkFullAccess`
   - `AmazonS3FullAccess` (for EB deployment artifacts)
   - Or create custom policy with minimum required permissions

## Required Permissions for Elastic Beanstalk Deployment

The IAM user needs these minimum permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "s3:*",
        "ec2:*",
        "elasticloadbalancing:*",
        "autoscaling:*",
        "cloudwatch:*",
        "cloudformation:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Verify Credentials Work

Test locally before updating GitHub:

```bash
# Set credentials
export AWS_ACCESS_KEY_ID=your-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1

# Test connection
aws sts get-caller-identity

# Test Elastic Beanstalk access
aws elasticbeanstalk describe-environments --region us-east-1
```

## Update GitHub Secrets

1. Go to: https://github.com/captify-io/platform/settings/secrets/actions
2. Update or create:
   - `AWS_ACCESS_KEY_ID`: Your Access Key ID (no quotes)
   - `AWS_SECRET_ACCESS_KEY`: Your Secret Access Key (no quotes)
3. Make sure there are no extra spaces or line breaks

## Common Issues

1. **Extra spaces or newlines**: Make sure to paste credentials without any trailing spaces
2. **Wrong region**: Ensure the region matches your EB environment (us-east-1)
3. **Expired credentials**: AWS keys can expire if using temporary credentials
4. **Special characters**: If your secret key has special characters, ensure they're properly copied

## Re-run the Workflow

After updating the secrets:
1. Go to Actions tab in GitHub
2. Select the failed workflow
3. Click "Re-run all jobs" or push a new commit
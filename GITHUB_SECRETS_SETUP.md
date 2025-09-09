# GitHub Secrets Setup for Deployment

## Required GitHub Secrets

The deploy workflow requires the following secrets to be configured in your GitHub repository settings:

### 1. **NODE_AUTH_TOKEN** ✅ (Already configured)
- **Purpose**: Authentication for GitHub Packages to download @captify-io packages
- **Where to get it**: GitHub Personal Access Token with `read:packages` scope
- **Used for**: Installing private npm packages from GitHub Packages

### 2. **AWS_ACCESS_KEY_ID** ❌ (Needs configuration)
- **Purpose**: AWS authentication for deployment
- **Where to get it**: AWS IAM Console → Users → Security credentials
- **Format**: Something like `AKIAIOSFODNN7EXAMPLE`
- **Used for**: Authenticating with AWS services

### 3. **AWS_SECRET_ACCESS_KEY** ❌ (Needs configuration)
- **Purpose**: AWS authentication secret key
- **Where to get it**: AWS IAM Console (only shown once when creating)
- **Format**: Something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Used for**: Authenticating with AWS services

### 4. **AWS_ACCOUNT_ID** ❌ (Needs configuration)
- **Purpose**: Your AWS account number
- **Where to get it**: AWS Console → Top right corner → Account ID
- **Format**: 12-digit number like `123456789012`
- **Used for**: Constructing S3 bucket names for Elastic Beanstalk

## How to Add These Secrets to GitHub

1. Go to your repository: https://github.com/captify-io/platform
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret
5. Add the following secrets:

   ```
   Name: AWS_ACCESS_KEY_ID
   Value: [Your AWS Access Key ID]
   
   Name: AWS_SECRET_ACCESS_KEY
   Value: [Your AWS Secret Access Key]
   
   Name: AWS_ACCOUNT_ID
   Value: [Your 12-digit AWS Account ID]
   ```

## Getting Your AWS Account ID

```bash
# If you have AWS CLI configured locally:
aws sts get-caller-identity --query Account --output text

# Or from AWS Console:
# 1. Log into AWS Console
# 2. Click your username in top-right corner
# 3. Your Account ID is displayed there
```

## Getting AWS Access Keys

### Option 1: Use Existing Keys (if you have them)
Check your local AWS credentials:
```bash
# Windows
type %USERPROFILE%\.aws\credentials

# Mac/Linux
cat ~/.aws/credentials
```

### Option 2: Create New IAM User for GitHub Actions (Recommended)

1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/
2. Click **Users** → **Add users**
3. User name: `github-actions-captify`
4. Select **Access key - Programmatic access**
5. Attach policies:
   - `AdministratorAccess` (for full access)
   - OR create custom policy with minimum permissions (see below)
6. Save the Access Key ID and Secret Access Key

### Minimum IAM Policy for Elastic Beanstalk Deployment

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:Check*",
        "elasticbeanstalk:Describe*",
        "elasticbeanstalk:List*",
        "elasticbeanstalk:CreateApplicationVersion",
        "elasticbeanstalk:UpdateEnvironment",
        "elasticbeanstalk:UpdateApplicationVersion",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "ec2:Describe*",
        "elasticloadbalancing:Describe*",
        "autoscaling:Describe*",
        "cloudwatch:Describe*",
        "cloudwatch:PutMetricAlarm",
        "cloudformation:Describe*",
        "cloudformation:GetTemplate",
        "cloudformation:ListStackResources",
        "cloudformation:UpdateStack",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## Verify Your Secrets Are Set

After adding all secrets, you should see these in your repository's Actions secrets:
- ✅ NODE_AUTH_TOKEN
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ AWS_ACCOUNT_ID

## Testing the Deployment

Once all secrets are configured:
1. Go to the **Actions** tab in your repository
2. Select the failed workflow run
3. Click **Re-run all jobs**
4. Or push a new commit to trigger a fresh deployment

## Troubleshooting

### "Invalid signature" error
- Double-check AWS_SECRET_ACCESS_KEY has no extra spaces or line breaks
- Ensure you copied the complete key
- Try generating new access keys if the issue persists

### "Access Denied" error
- Check that the IAM user has proper permissions
- Verify the AWS_ACCOUNT_ID is correct
- Ensure the S3 bucket exists in the correct region

### "Repository not found" error for npm packages
- Verify NODE_AUTH_TOKEN has `read:packages` scope
- Check that the token hasn't expired

## Important Notes

- Never commit these secrets to your repository
- Rotate AWS keys periodically for security
- Use separate AWS accounts/keys for production vs development
- Consider using AWS IAM roles for more secure deployment (requires additional setup)
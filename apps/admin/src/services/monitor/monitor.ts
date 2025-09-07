/**
 * Monitor Service - AWS Security Hub and OSCAL Integration
 * Handles all monitoring, compliance, and ATO management operations
 */

import {
  SecurityHubClient,
  GetFindingsCommand,
  BatchUpdateFindingsCommand,
  DescribeStandardsControlsCommand,
  UpdateStandardsControlCommand,
  GetInsightResultsCommand,
  CreateInsightCommand,
  DescribeStandardsCommand,
  BatchEnableStandardsCommand,
  BatchDisableStandardsCommand,
} from '@aws-sdk/client-securityhub';

import {
  ConfigServiceClient,
  DescribeComplianceByConfigRuleCommand,
  DescribeConfigRulesCommand,
  GetComplianceDetailsByConfigRuleCommand,
  GetResourceConfigHistoryCommand,
} from '@aws-sdk/client-config-service';

import {
  CloudWatchClient,
  GetMetricDataCommand,
  GetMetricStatisticsCommand,
  PutMetricAlarmCommand,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
  GetInventoryCommand,
  SendCommandCommand,
  GetCommandInvocationCommand,
  CreateAssociationCommand,
  DescribeInstanceInformationCommand,
} from '@aws-sdk/client-ssm';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';

import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

import {
  LambdaClient,
  InvokeCommand,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda';

import type {
  OscalControl,
  ControlAssessment,
  SecurityHubFinding,
  Evidence,
  SystemSecurityPlan,
  POAM,
  Policy,
  ChangeRequest,
  ComplianceTask,
  ComplianceReport,
  MonitorPerformanceMetric,
  Alert,
} from '../../types/monitor';

/**
 * Monitor Service Configuration
 */
interface MonitorConfig {
  region?: string;
  credentials?: any;
  complianceBucket?: string;
  evidenceBucket?: string;
  oscalCatalogVersion?: string;
}

/**
 * Main Monitor Service Class
 */
export class MonitorService {
  private securityHub: SecurityHubClient;
  private config: ConfigServiceClient;
  private cloudWatch: CloudWatchClient;
  private ssm: SSMClient;
  private s3: S3Client;
  private eventBridge: EventBridgeClient;
  private lambda: LambdaClient;
  private configuration: MonitorConfig;

  constructor(config?: MonitorConfig) {
    const region = config?.region || process.env.AWS_REGION || 'us-east-1';
    const credentials = config?.credentials;

    this.configuration = {
      region,
      complianceBucket: config?.complianceBucket || process.env.COMPLIANCE_BUCKET || 'captify-compliance',
      evidenceBucket: config?.evidenceBucket || process.env.EVIDENCE_BUCKET || 'captify-evidence',
      oscalCatalogVersion: config?.oscalCatalogVersion || 'NIST_SP-800-53_rev5',
      ...config,
    };

    const clientConfig = { region, credentials };

    this.securityHub = new SecurityHubClient(clientConfig);
    this.config = new ConfigServiceClient(clientConfig);
    this.cloudWatch = new CloudWatchClient(clientConfig);
    this.ssm = new SSMClient(clientConfig);
    this.s3 = new S3Client(clientConfig);
    this.eventBridge = new EventBridgeClient(clientConfig);
    this.lambda = new LambdaClient(clientConfig);
  }

  /**
   * Security Hub Operations
   */
  
  async getComplianceScore(standardArn?: string): Promise<{
    score: number;
    passed: number;
    failed: number;
    unknown: number;
    notApplicable: number;
  }> {
    try {
      const standards = standardArn ? [standardArn] : [
        'arn:aws:securityhub:::ruleset/nist-800-53/v/5.0.0',
        'arn:aws:securityhub:us-east-1::standards/nist-800-53/v/5.0.0'
      ];

      let totalPassed = 0;
      let totalFailed = 0;
      let totalUnknown = 0;
      let totalNotApplicable = 0;

      for (const arn of standards) {
        const command = new GetFindingsCommand({
          Filters: {
            ProductArn: [{
              Value: arn,
              Comparison: 'EQUALS'
            }],
            ComplianceStatus: [{
              Value: 'PASSED',
              Comparison: 'EQUALS'
            }]
          },
          MaxResults: 1
        });

        const response = await this.securityHub.send(command);
        
        // Get counts for each status
        const statusTypes = ['PASSED', 'FAILED', 'WARNING', 'NOT_AVAILABLE'];
        
        for (const status of statusTypes) {
          const statusCommand = new GetFindingsCommand({
            Filters: {
              ProductArn: [{
                Value: arn,
                Comparison: 'EQUALS'
              }],
              ComplianceStatus: [{
                Value: status,
                Comparison: 'EQUALS'
              }]
            },
            MaxResults: 1
          });
          
          const statusResponse = await this.securityHub.send(statusCommand);
          const count = statusResponse.Findings?.length || 0;
          
          switch (status) {
            case 'PASSED':
              totalPassed += count;
              break;
            case 'FAILED':
            case 'WARNING':
              totalFailed += count;
              break;
            case 'NOT_AVAILABLE':
              totalUnknown += count;
              break;
          }
        }
      }

      const total = totalPassed + totalFailed + totalUnknown + totalNotApplicable;
      const score = total > 0 ? (totalPassed / total) * 100 : 0;

      return {
        score: Math.round(score * 100) / 100,
        passed: totalPassed,
        failed: totalFailed,
        unknown: totalUnknown,
        notApplicable: totalNotApplicable
      };
    } catch (error) {
      console.error('Error getting compliance score:', error);
      throw error;
    }
  }

  async getControlFindings(controlId: string): Promise<SecurityHubFinding[]> {
    try {
      const command = new GetFindingsCommand({
        Filters: {
          ComplianceSecurityControlId: [{
            Value: controlId,
            Comparison: 'EQUALS'
          }]
        },
        MaxResults: 100
      });

      const response = await this.securityHub.send(command);
      
      return response.Findings?.map(finding => ({
        id: finding.Id || '',
        productArn: finding.ProductArn || '',
        generatorId: finding.GeneratorId || '',
        awsAccountId: finding.AwsAccountId || '',
        types: finding.Types || [],
        title: finding.Title || '',
        description: finding.Description || '',
        severity: {
          label: finding.Severity?.Label as any || 'INFORMATIONAL',
          normalized: finding.Severity?.Normalized || 0,
          original: finding.Severity?.Original
        },
        compliance: finding.Compliance ? {
          status: finding.Compliance.Status as any || 'NOT_AVAILABLE',
          relatedRequirements: finding.Compliance.RelatedRequirements || [],
          statusReasons: finding.Compliance.StatusReasons?.map(reason => ({
            reasonCode: reason.ReasonCode || '',
            description: reason.Description || ''
          }))
        } : undefined,
        resources: finding.Resources?.map(resource => ({
          type: resource.Type || '',
          id: resource.Id || '',
          partition: resource.Partition,
          region: resource.Region,
          tags: resource.Tags as any,
          details: resource.Details
        })) || [],
        remediation: finding.Remediation ? {
          recommendation: {
            text: finding.Remediation.Recommendation?.Text || '',
            url: finding.Remediation.Recommendation?.Url
          }
        } : undefined,
        workflowState: finding.WorkflowState as any || 'NEW',
        recordState: finding.RecordState as any || 'ACTIVE',
        relatedFindings: finding.RelatedFindings?.map(related => ({
          productArn: related.ProductArn || '',
          id: related.Id || ''
        }))
      })) || [];
    } catch (error) {
      console.error('Error getting control findings:', error);
      return [];
    }
  }

  async updateFindingStatus(
    findingId: string,
    status: 'NEW' | 'NOTIFIED' | 'RESOLVED' | 'SUPPRESSED',
    note?: string
  ): Promise<boolean> {
    try {
      const command = new BatchUpdateFindingsCommand({
        FindingIdentifiers: [{
          Id: findingId,
          ProductArn: 'arn:aws:securityhub:*'
        }],
        Workflow: {
          Status: status
        },
        Note: note ? {
          Text: note,
          UpdatedBy: 'captify-monitor'
        } : undefined
      });

      const response = await this.securityHub.send(command);
      return (response.ProcessedFindings?.length ?? 0) > 0;
    } catch (error) {
      console.error('Error updating finding status:', error);
      return false;
    }
  }

  /**
   * AWS Config Operations
   */
  
  async getConfigCompliance(configRuleName?: string): Promise<any> {
    try {
      if (configRuleName) {
        const command = new GetComplianceDetailsByConfigRuleCommand({
          ConfigRuleName: configRuleName,
          Limit: 100
        });
        return await this.config.send(command);
      } else {
        const command = new DescribeComplianceByConfigRuleCommand({});
        return await this.config.send(command);
      }
    } catch (error) {
      console.error('Error getting config compliance:', error);
      throw error;
    }
  }

  async getResourceHistory(resourceId: string, resourceType: string): Promise<any> {
    try {
      const command = new GetResourceConfigHistoryCommand({
        resourceId,
        resourceType: resourceType as any, // Cast to any to handle AWS SDK type mismatch
        limit: 10
      });
      return await this.config.send(command);
    } catch (error) {
      console.error('Error getting resource history:', error);
      throw error;
    }
  }

  /**
   * CloudWatch Metrics Operations
   */
  
  async getMonitorPerformanceMetrics(
    namespace: string,
    metricName: string,
    dimensions?: Array<{ Name: string; Value: string }>,
    startTime?: Date,
    endTime?: Date
  ): Promise<MonitorPerformanceMetric[]> {
    try {
      const command = new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: dimensions,
        StartTime: startTime || new Date(Date.now() - 24 * 60 * 60 * 1000),
        EndTime: endTime || new Date(),
        Period: 300,
        Statistics: ['Average', 'Maximum', 'Minimum']
      });

      const response = await this.cloudWatch.send(command);
      
      return response.Datapoints?.map(point => ({
        id: `${namespace}-${metricName}-${point.Timestamp?.getTime()}`,
        slug: `${namespace}-${metricName}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: metricName,
        app: 'core',
        order: '0',
        icon: 'activity',
        metricId: `${namespace}-${metricName}`,
        metricType: this.mapMetricType(metricName),
        timestamp: point.Timestamp || new Date(),
        value: point.Average || 0,
        unit: point.Unit || 'None',
        source: 'CloudWatch',
        status: this.determineMetricStatus(point.Average || 0, metricName),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as MonitorPerformanceMetric)) || [];
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  private mapMetricType(metricName: string): any {
    const mapping: Record<string, string> = {
      'CPUUtilization': 'throughput',
      'NetworkIn': 'throughput',
      'NetworkOut': 'throughput',
      'StatusCheckFailed': 'availability',
      'HTTPCode_5XX': 'error-rate',
      'Latency': 'response-time'
    };
    return mapping[metricName] || 'throughput';
  }

  private determineMetricStatus(value: number, metricName: string): any {
    // Define thresholds per metric
    const thresholds: Record<string, { warning: number; critical: number }> = {
      'CPUUtilization': { warning: 70, critical: 90 },
      'HTTPCode_5XX': { warning: 1, critical: 10 },
      'Latency': { warning: 1000, critical: 3000 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'healthy';

    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'healthy';
  }

  /**
   * Systems Manager Operations
   */
  
  async getSystemInventory(): Promise<any> {
    try {
      const command = new GetInventoryCommand({
        MaxResults: 50
      });
      return await this.ssm.send(command);
    } catch (error) {
      console.error('Error getting system inventory:', error);
      throw error;
    }
  }

  async runComplianceCommand(
    documentName: string,
    targets: Array<{ Key: string; Values: string[] }>,
    parameters?: Record<string, string[]>
  ): Promise<string> {
    try {
      const command = new SendCommandCommand({
        DocumentName: documentName,
        Targets: targets,
        Parameters: parameters,
        Comment: 'Captify compliance automation'
      });

      const response = await this.ssm.send(command);
      return response.Command?.CommandId || '';
    } catch (error) {
      console.error('Error running compliance command:', error);
      throw error;
    }
  }

  async getCommandResult(commandId: string, instanceId: string): Promise<any> {
    try {
      const command = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      });
      return await this.ssm.send(command);
    } catch (error) {
      console.error('Error getting command result:', error);
      throw error;
    }
  }

  /**
   * S3 Evidence Management
   */
  
  async uploadEvidence(
    evidence: Evidence,
    content: Buffer | Uint8Array | string
  ): Promise<string> {
    try {
      const key = `evidence/${evidence.controlId}/${evidence.id}-${Date.now()}`;
      const command = new PutObjectCommand({
        Bucket: this.configuration.evidenceBucket,
        Key: key,
        Body: content,
        ContentType: this.getContentType(evidence.type),
        Metadata: {
          controlId: evidence.controlId,
          collectionDate: evidence.collectionDate.toISOString(),
          collector: evidence.collector,
          automated: evidence.automated.toString()
        },
        ServerSideEncryption: 'AES256'
      });

      await this.s3.send(command);
      return `s3://${this.configuration.evidenceBucket}/${key}`;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  }

  private getContentType(evidenceType: string): string {
    const mapping: Record<string, string> = {
      'document': 'application/pdf',
      'screenshot': 'image/png',
      'log': 'text/plain',
      'report': 'application/json',
      'config': 'application/json',
      'test-result': 'application/json',
      'scan-result': 'application/json'
    };
    return mapping[evidenceType] || 'application/octet-stream';
  }

  async getEvidence(evidenceId: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.configuration.evidenceBucket,
        Key: evidenceId
      });
      return await this.s3.send(command);
    } catch (error) {
      console.error('Error getting evidence:', error);
      throw error;
    }
  }

  /**
   * OSCAL Operations
   */
  
  async importOscalCatalog(catalogUrl: string): Promise<OscalControl[]> {
    try {
      // Fetch OSCAL catalog (NIST 800-53 Rev 5)
      const response = await fetch(catalogUrl || 
        'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json'
      );
      
      const catalog = await response.json();
      const controls: OscalControl[] = [];

      // Parse OSCAL catalog structure
      for (const group of catalog.catalog.groups || []) {
        for (const control of group.controls || []) {
          controls.push(this.mapOscalControl(control, group.id));
        }
      }

      return controls;
    } catch (error) {
      console.error('Error importing OSCAL catalog:', error);
      throw error;
    }
  }

  private mapOscalControl(oscalControl: any, family: string): OscalControl {
    return {
      id: oscalControl.id,
      slug: oscalControl.id.toLowerCase(),
      name: oscalControl.title,
      app: 'core',
      order: '0',
      icon: 'shield',
      tenantId: 'system',
      accessLevel: 'admin',
      status: 'active',
      controlId: oscalControl.id,
      family,
      title: oscalControl.title,
      description: this.extractProse(oscalControl.parts),
      guidance: this.extractGuidance(oscalControl.parts),
      parameters: oscalControl.params?.map((param: any) => ({
        id: param.id,
        label: param.label,
        guidelines: param.guidelines?.prose,
        values: param.values,
        select: param.select
      })),
      props: oscalControl.props?.reduce((acc: any, prop: any) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {}),
      links: oscalControl.links,
      parts: oscalControl.parts,
      impact: this.determineImpact(oscalControl.props),
      priority: this.determinePriority(oscalControl.props),
      baselines: this.determineBaselines(oscalControl.props),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as unknown as OscalControl;
  }

  private extractProse(parts: any[]): string {
    if (!parts) return '';
    const statement = parts.find(p => p.name === 'statement');
    return statement?.prose || '';
  }

  private extractGuidance(parts: any[]): string {
    if (!parts) return '';
    const guidance = parts.find(p => p.name === 'guidance');
    return guidance?.prose || '';
  }

  private determineImpact(props: any[]): 'low' | 'moderate' | 'high' {
    if (!props) return 'moderate';
    const impact = props.find(p => p.name === 'impact');
    return impact?.value || 'moderate';
  }

  private determinePriority(props: any[]): 'P0' | 'P1' | 'P2' | 'P3' {
    if (!props) return 'P1';
    const priority = props.find(p => p.name === 'priority');
    return priority?.value || 'P1';
  }

  private determineBaselines(props: any[]): string[] {
    if (!props) return [];
    return props
      .filter(p => p.name === 'baseline')
      .map(p => p.value);
  }

  async generateOscalSSP(systemId: string): Promise<any> {
    try {
      // Generate OSCAL-compliant SSP
      // This would fetch system data and format as OSCAL SSP
      const ssp = {
        'system-security-plan': {
          uuid: this.generateUUID(),
          metadata: {
            title: 'System Security Plan',
            'last-modified': new Date().toISOString(),
            version: '1.0.0',
            'oscal-version': '1.0.0'
          },
          'system-characteristics': {
            'system-id': systemId,
            'system-name': 'Captify Platform',
            'system-description': 'Compliance and ATO Management Platform'
          },
          'system-implementation': {
            // Implementation details
          },
          'control-implementation': {
            // Control implementations
          }
        }
      };

      // Upload to S3
      const key = `oscal/ssp/${systemId}-${Date.now()}.json`;
      await this.s3.send(new PutObjectCommand({
        Bucket: this.configuration.complianceBucket,
        Key: key,
        Body: JSON.stringify(ssp, null, 2),
        ContentType: 'application/json'
      }));

      return ssp;
    } catch (error) {
      console.error('Error generating OSCAL SSP:', error);
      throw error;
    }
  }

  async generateOscalAssessmentResults(assessments: ControlAssessment[]): Promise<any> {
    try {
      const results = {
        'assessment-results': {
          uuid: this.generateUUID(),
          metadata: {
            title: 'Security Control Assessment Results',
            'last-modified': new Date().toISOString(),
            version: '1.0.0',
            'oscal-version': '1.0.0'
          },
          results: assessments.map(assessment => ({
            uuid: this.generateUUID(),
            title: `Assessment of ${assessment.controlId}`,
            description: assessment.implementationDetails,
            findings: assessment.securityHubFindings?.map(finding => ({
              uuid: this.generateUUID(),
              title: finding.title,
              description: finding.description,
              'target-id': assessment.controlId,
              'implementation-status': assessment.implementationStatus,
              observations: [{
                uuid: this.generateUUID(),
                description: finding.description,
                methods: [assessment.assessmentMethod],
                collected: assessment.lastAssessment.toISOString()
              }]
            }))
          }))
        }
      };

      // Upload to S3
      const key = `oscal/assessment-results/${Date.now()}.json`;
      await this.s3.send(new PutObjectCommand({
        Bucket: this.configuration.complianceBucket,
        Key: key,
        Body: JSON.stringify(results, null, 2),
        ContentType: 'application/json'
      }));

      return results;
    } catch (error) {
      console.error('Error generating OSCAL assessment results:', error);
      throw error;
    }
  }

  async generateOscalPOAM(poams: POAM[]): Promise<any> {
    try {
      const poamDoc = {
        'plan-of-action-and-milestones': {
          uuid: this.generateUUID(),
          metadata: {
            title: 'Plan of Action and Milestones',
            'last-modified': new Date().toISOString(),
            version: '1.0.0',
            'oscal-version': '1.0.0'
          },
          'poam-items': poams.map(poam => ({
            uuid: poam.uuid || this.generateUUID(),
            title: poam.weakness,
            description: poam.description,
            'related-controls': [{ 'control-id': poam.controlId }],
            'risk-rating': poam.riskRating,
            status: poam.status,
            milestones: poam.milestones.map(milestone => ({
              uuid: this.generateUUID(),
              title: milestone.title,
              description: milestone.description,
              'scheduled-completion': milestone.scheduledCompletion.toISOString(),
              'actual-completion': milestone.actualCompletion?.toISOString(),
              status: milestone.status
            }))
          }))
        }
      };

      // Upload to S3
      const key = `oscal/poam/${Date.now()}.json`;
      await this.s3.send(new PutObjectCommand({
        Bucket: this.configuration.complianceBucket,
        Key: key,
        Body: JSON.stringify(poamDoc, null, 2),
        ContentType: 'application/json'
      }));

      return poamDoc;
    } catch (error) {
      console.error('Error generating OSCAL POA&M:', error);
      throw error;
    }
  }

  /**
   * Task Automation
   */
  
  async createAutomatedTask(task: ComplianceTask): Promise<string> {
    try {
      if (task.automated && task.automationScript) {
        // Create Lambda function for automated task
        const functionName = `captify-task-${task.taskId}`;
        
        const createCommand = new CreateFunctionCommand({
          FunctionName: functionName,
          Runtime: 'nodejs18.x',
          Role: process.env.LAMBDA_EXECUTION_ROLE || '',
          Handler: 'index.handler',
          Code: {
            ZipFile: Buffer.from(task.automationScript)
          },
          Environment: {
            Variables: task.automationParameters || {}
          }
        });

        await this.lambda.send(createCommand);

        // Schedule with EventBridge if recurring
        if (task.frequency && task.frequency !== 'once') {
          const ruleName = `captify-task-schedule-${task.taskId}`;
          const scheduleExpression = this.getScheduleExpression(task.frequency);

          await this.eventBridge.send(new PutRuleCommand({
            Name: ruleName,
            ScheduleExpression: scheduleExpression,
            State: 'ENABLED'
          }));

          await this.eventBridge.send(new PutTargetsCommand({
            Rule: ruleName,
            Targets: [{
              Id: '1',
              Arn: `arn:aws:lambda:${this.configuration.region}:*:function:${functionName}`
            }]
          }));
        }

        return functionName;
      }

      return '';
    } catch (error) {
      console.error('Error creating automated task:', error);
      throw error;
    }
  }

  private getScheduleExpression(frequency: string): string {
    const expressions: Record<string, string> = {
      'daily': 'rate(1 day)',
      'weekly': 'rate(7 days)',
      'monthly': 'rate(30 days)',
      'quarterly': 'rate(90 days)',
      'annually': 'rate(365 days)',
      'continuous': 'rate(1 hour)'
    };
    return expressions[frequency] || 'rate(1 day)';
  }

  async executeTask(taskId: string): Promise<any> {
    try {
      const command = new InvokeCommand({
        FunctionName: `captify-task-${taskId}`,
        InvocationType: 'RequestResponse'
      });

      const response = await this.lambda.send(command);
      return JSON.parse(new TextDecoder().decode(response.Payload));
    } catch (error) {
      console.error('Error executing task:', error);
      throw error;
    }
  }

  /**
   * Alert Management
   */
  
  async createAlert(alert: Alert): Promise<void> {
    try {
      // Send to EventBridge for processing
      const command = new PutEventsCommand({
        Entries: [{
          Source: 'captify.monitor',
          DetailType: alert.alertType,
          Detail: JSON.stringify(alert)
        }]
      });

      await this.eventBridge.send(command);

      // Create CloudWatch alarm if needed
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.createCloudWatchAlarm(alert);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  private async createCloudWatchAlarm(alert: Alert): Promise<void> {
    try {
      const command = new PutMetricAlarmCommand({
        AlarmName: `captify-alert-${alert.alertId}`,
        AlarmDescription: alert.description,
        MetricName: 'AlertCount',
        Namespace: 'Captify/Monitor',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Error creating CloudWatch alarm:', error);
    }
  }

  /**
   * Report Generation
   */
  
  async generateComplianceReport(
    reportType: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      // Gather all compliance data
      const complianceScore = await this.getComplianceScore();
      const findings = await this.getAllFindings();
      const controlAssessments = await this.getControlAssessments();
      
      const userId = 'system-monitor';
      const now = new Date().toISOString();
      
      const report: ComplianceReport = {
        id: this.generateUUID(),
        slug: `${reportType}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: `${reportType} Compliance Report`,
        description: `Automated ${reportType} compliance report for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
        app: 'core',
        order: '0',
        fields: {},
        ownerId: userId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        // ComplianceReport specific fields
        reportId: this.generateUUID(),
        reportType: reportType as any,
        title: `${reportType} Compliance Report`,
        generatedDate: new Date(),
        generatedBy: 'captify-monitor',
        period: {
          start: startDate,
          end: endDate,
          type: this.getReportPeriodType(startDate, endDate)
        },
        executiveSummary: this.generateExecutiveSummary(complianceScore, findings),
        complianceScore: complianceScore.score,
        controlsByFamily: await this.getControlsByFamily(controlAssessments),
        findings: this.summarizeFindings(findings),
        poamSummary: await this.getPOAMSummary(),
        classification: 'internal'
      };

      // Generate OSCAL export
      report.oscalExport = await this.exportReportAsOscal(report);

      // Save report to S3
      const key = `reports/${reportType}/${Date.now()}.json`;
      await this.s3.send(new PutObjectCommand({
        Bucket: this.configuration.complianceBucket,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: 'application/json'
      }));

      return report as ComplianceReport;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  private async getAllFindings(): Promise<SecurityHubFinding[]> {
    // Implementation to get all findings
    return [];
  }

  private async getControlAssessments(): Promise<ControlAssessment[]> {
    // Implementation to get all control assessments
    return [];
  }

  private getReportPeriodType(start: Date, end: Date): any {
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'daily';
    if (days <= 7) return 'weekly';
    if (days <= 31) return 'monthly';
    if (days <= 93) return 'quarterly';
    if (days <= 366) return 'annual';
    return 'custom';
  }

  private generateExecutiveSummary(score: any, findings: any[]): string {
    return `Overall compliance score: ${score.score}%. Total findings: ${findings.length}.`;
  }

  private async getControlsByFamily(assessments: ControlAssessment[]): Promise<any[]> {
    // Group assessments by family and calculate stats
    return [];
  }

  private summarizeFindings(findings: SecurityHubFinding[]): any {
    const summary = {
      total: findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      newFindings: 0,
      closedFindings: 0
    };

    findings.forEach(finding => {
      switch (finding.severity.label) {
        case 'CRITICAL':
          summary.critical++;
          break;
        case 'HIGH':
          summary.high++;
          break;
        case 'MEDIUM':
          summary.medium++;
          break;
        case 'LOW':
          summary.low++;
          break;
        case 'INFORMATIONAL':
          summary.informational++;
          break;
      }

      if (finding.workflowState === 'NEW') summary.newFindings++;
      if (finding.recordState === 'ARCHIVED') summary.closedFindings++;
    });

    return summary;
  }

  private async getPOAMSummary(): Promise<any> {
    // Implementation to get POAM summary
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      dueThisMonth: 0,
      averageDaysOpen: 0
    };
  }

  private async exportReportAsOscal(report: ComplianceReport): Promise<string> {
    // Convert report to OSCAL format and upload
    const oscalReport = {
      // OSCAL report structure
    };

    const key = `oscal/reports/${report.reportId}.json`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.configuration.complianceBucket,
      Key: key,
      Body: JSON.stringify(oscalReport, null, 2),
      ContentType: 'application/json'
    }));

    return `s3://${this.configuration.complianceBucket}/${key}`;
  }

  /**
   * Utility Functions
   */
  
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * eMASS Integration
   */
  
  async syncWithEMASS(endpoint: string, apiKey: string): Promise<void> {
    try {
      // Implementation for eMASS synchronization
      // This would require the eMASS API client library
      console.log('Syncing with eMASS...');
    } catch (error) {
      console.error('Error syncing with eMASS:', error);
      throw error;
    }
  }
}

/**
 * Execute function for API calls
 */
export async function execute(
  request: any,
  credentials?: any,
  session?: any
): Promise<any> {
  try {
    const monitor = new MonitorService({
      credentials,
      region: process.env.AWS_REGION
    });

    switch (request.operation) {
      case 'getComplianceScore':
        return await monitor.getComplianceScore(request.params?.standardArn);
      
      case 'getControlFindings':
        return await monitor.getControlFindings(request.params.controlId);
      
      case 'updateFindingStatus':
        return await monitor.updateFindingStatus(
          request.params.findingId,
          request.params.status,
          request.params.note
        );
      
      case 'getMonitorPerformanceMetrics':
        return await monitor.getMonitorPerformanceMetrics(
          request.params.namespace,
          request.params.metricName,
          request.params.dimensions,
          request.params.startTime,
          request.params.endTime
        );
      
      case 'uploadEvidence':
        return await monitor.uploadEvidence(
          request.params.evidence,
          request.params.content
        );
      
      case 'importOscalCatalog':
        return await monitor.importOscalCatalog(request.params.catalogUrl);
      
      case 'generateComplianceReport':
        return await monitor.generateComplianceReport(
          request.params.reportType,
          request.params.startDate,
          request.params.endDate
        );
      
      case 'createAutomatedTask':
        return await monitor.createAutomatedTask(request.params.task);
      
      case 'executeTask':
        return await monitor.executeTask(request.params.taskId);
      
      case 'createAlert':
        return await monitor.createAlert(request.params.alert);
      
      default:
        throw new Error(`Unknown operation: ${request.operation}`);
    }
  } catch (error: any) {
    console.error('Monitor service error:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

export const monitor = {
  execute,
  MonitorService
};
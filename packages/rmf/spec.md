📘 Captify RMF/OSCAL Admin Dashboard Specification

1. Purpose

The Captify Admin Dashboard provides a unified platform for managing the full Risk Management Framework (RMF) lifecycle using NIST OSCAL as the canonical data model. It integrates with AWS GovCloud services and Captify’s own ontology to automate compliance activities, replace manual documentation, and continuously generate OSCAL packages exportable to eMASS, FedRAMP PMO, or DoD assessors.

2. Menu Structure

Menu

Policies & SOPs

Policies

SOPs

Plans (Contingency, Incident Response, etc.)

System Security Plan (SSP)

Components (AWS + Captify services)

Control Implementations

Inherited Controls (AWS baseline)

POA&Ms

Findings (auto-imported from AWS services)

Remediation Tasks

Milestone Tracking

Change Requests (CRs)

Infrastructure Changes (IaC)

Control Impact Analysis

Approval Workflow

Assessments

Assessment Plans

Assessment Results

Continuous Monitoring

Compliance Profiles

FedRAMP High baseline

DoD IL2/IL4/IL5 overlays

Classified overlays

Reports & Exports

OSCAL Export (SSP, POA&M, Assessments)

eMASS Upload Package

Audit Evidence Reports

Administration

Users & Roles

AWS Service Integrations

Platform Settings

3. Core Capabilities

OSCAL-Centric Models

All artifacts (SSPs, POA&Ms, Policies, CRs, Assessments) stored and represented in OSCAL JSON/YAML.

FedRAMP High baseline as default, with overlays for IL2, IL4, IL5, and classified deployments.

System Security Plan (SSP)

Automatically generate OSCAL system-implementation from IaC definitions (CloudFormation/Terraform/CDK).

Map AWS services (IAM, Config, GuardDuty, etc.) as components.

Link implemented controls to evidence (Audit Manager reports, Config Rule IDs, CloudTrail bucket ARNs).

POA&M Management

Ingest AWS Security Hub and Inspector findings.

Auto-generate OSCAL POA&M entries with remediation tasks.

Tie to AWS Systems Manager Automation runbooks for closure.

Change Requests (CRs)

Extend OSCAL with Captify-specific CR schema.

Link PRs/IaC changes → affected controls.

Provide approval workflow before merge.

Policies & SOPs

Store organizational policy documents.

Map each policy/SOP to related controls in OSCAL.

Enable versioning and linkage to SSP entries.

Assessments

Integrate AWS Audit Manager assessments.

Store Assessment Plans & Results in OSCAL format.

Link results to controls and POA&M items.

Profiles & Overlays

Baseline: FedRAMP High.

Downshift profiles for IL2/IL4.

Overlay for IL5 and above (classified).

Support inheritance of AWS’s published OSCAL packages for shared responsibility.

Reporting & Exports

Generate full OSCAL packages (SSP + POA&M + Assessments).

Export in eMASS-compliant format.

Provide summary compliance dashboards (control family coverage, % implemented, open POA&Ms).

4. AWS Service Integration

Access Control (AC) → IAM, Cognito, SAML Federation, SCPs

Audit & Accountability (AU) → CloudTrail, CloudWatch, Security Hub

Configuration Management (CM) → AWS Config, Conformance Packs

Contingency Planning (CP) → AWS Backup, Cross-region replication

Incident Response (IR) → GuardDuty, SNS/ChatOps, Security Hub findings

System Protection (SC) → VPC, WAF, Shield, KMS (FIPS endpoints)

Integrity (SI) → Inspector, Patch Manager, Security Hub

Inherited (PE) → AWS Data Center OSCAL baseline

5. Automation & Pipelines

IaC → OSCAL Sync: Infrastructure changes automatically update SSP JSON.

Evidence Sync: Config, Audit Manager, GuardDuty continuously push assessment results into OSCAL.

POA&M Auto-Generation: New findings → POA&M entries with remediation tracking.

Compliance Drift Detection: Config drift alerts trigger OSCAL deltas and CRs.

Continuous Monitoring: All updates reflected in dashboard in near real time.

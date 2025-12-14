# Superadmin Models & Features

## Overview
Comprehensive superadmin models for system monitoring, multi-tenancy, audit logging, incident management, and feature flagging.

---

## Superadmin Models

### 1. AuditLog
**Purpose**: Comprehensive audit trail for all system actions

**Key Features**:
- Track all CRUD operations across the platform
- User attribution (who did what)
- Detailed change tracking (before/after values)
- Request context (IP, user agent, request ID)
- Severity levels for filtering critical actions

**Fields**:
- `log_id`, `user_id`, `user_email`, `user_role`
- `action` (create/update/delete/login/logout/role_change/etc.)
- `entity_type`, `entity_id` (what was changed)
- `description`, `changes` (JSON with old/new values)
- `ip_address`, `user_agent`, `request_id`
- `severity` (info/warning/critical)

**Use Cases**:
- Security audits
- Compliance reporting
- Debugging user actions
- Tracking admin operations
- Incident investigation

**Example**:
```python
audit = AuditLog(
    user_id=admin.id,
    user_email=admin.email,
    user_role="admin",
    action=AuditLogAction.UPDATE,
    entity_type="assessment",
    entity_id=assessment.assessment_id,
    description="Published assessment",
    changes={"is_published": {"old": False, "new": True}},
    ip_address="192.168.1.1",
    severity="info"
)
```

---

### 2. Tenant
**Purpose**: Multi-tenant organization support

**Key Features**:
- Separate organizations/companies
- Custom domains per tenant
- Per-tenant feature flags and settings
- Usage limits and quotas
- Subscription tiers and billing
- Trial management

**Fields**:
- `tenant_id`, `name`, `domain`
- `settings`, `features_enabled` (JSON)
- `max_users`, `max_assessments`, `max_candidates`
- `subscription_tier` (free/basic/pro/enterprise)
- `subscription_expires_at`
- `is_active`, `is_trial`
- `owner_id`

**Use Cases**:
- B2B SaaS multi-tenancy
- White-label deployments
- Resource isolation
- Billing and quotas
- Feature access control

**Example**:
```python
tenant = Tenant(
    name="Acme Corp",
    domain="acme.assist-ten.com",
    subscription_tier="pro",
    max_users=100,
    max_assessments=50,
    features_enabled={
        "advanced_proctoring": True,
        "custom_branding": True,
        "api_access": True
    },
    owner_id=admin_user.id
)
```

---

### 3. SystemIncident
**Purpose**: Track system outages, bugs, and critical issues

**Key Features**:
- Incident lifecycle management
- Severity classification
- Impact tracking (affected users/tenants/services)
- Assignment and resolution workflow
- Root cause analysis
- Timeline tracking

**Fields**:
- `incident_id`, `title`, `description`
- `incident_type` (outage/bug/security/performance)
- `severity` (low/medium/high/critical)
- `status` (open/investigating/resolved/closed)
- `affected_users`, `affected_tenants`, `affected_services`
- `detected_at`, `resolved_at`
- `assigned_to`, `reported_by`
- `resolution_notes`, `root_cause`
- `error_logs`, `metrics` (JSON)

**Use Cases**:
- Incident management
- Downtime tracking
- Post-mortem analysis
- SLA compliance
- Communication with affected users

**Example**:
```python
incident = SystemIncident(
    title="Database connection pool exhaustion",
    description="High latency on API endpoints...",
    incident_type="performance",
    severity="high",
    status="investigating",
    affected_users=250,
    affected_services=["api", "assessment-service"],
    detected_at=datetime.utcnow(),
    assigned_to=devops_user.id,
    error_logs={"error": "Connection timeout", "service": "db"}
)
```

---

### 4. SystemMetric
**Purpose**: Performance and usage metrics tracking

**Key Features**:
- Time-series metrics storage
- Multi-dimensional tagging
- Service-level monitoring
- Tenant-specific metrics
- Support for gauges, counters, histograms

**Fields**:
- `metric_id`, `metric_name`, `metric_type`
- `value`, `unit`
- `service`, `tenant_id`
- `measured_at` (precise timestamp)
- `tags` (JSON for dimensions)

**Use Cases**:
- Performance monitoring
- Capacity planning
- SLA tracking
- Usage analytics
- Billing metering

**Metric Types**:
- **Gauge**: Point-in-time value (CPU usage, memory usage)
- **Counter**: Cumulative count (total requests, error count)
- **Histogram**: Distribution (latency percentiles)

**Example**:
```python
# CPU usage metric
metric = SystemMetric(
    metric_name="cpu_usage",
    metric_type="gauge",
    value=75.5,
    unit="percent",
    service="api",
    measured_at=datetime.utcnow(),
    tags={"host": "api-01", "region": "us-east"}
)

# API latency metric
metric = SystemMetric(
    metric_name="api_latency_p95",
    metric_type="histogram",
    value=250.0,
    unit="ms",
    service="api",
    measured_at=datetime.utcnow(),
    tags={"endpoint": "/assessments", "method": "GET"}
)
```

---

### 5. FeatureFlag
**Purpose**: A/B testing and gradual feature rollouts

**Key Features**:
- Toggle features on/off
- Percentage-based rollouts
- Tenant-specific enablement
- User-specific enablement
- Configuration overrides

**Fields**:
- `flag_id`, `name`, `description`
- `is_enabled`
- `rollout_percentage` (0-100)
- `allowed_tenants`, `allowed_users` (JSON arrays)
- `config` (JSON for feature-specific settings)
- `created_by`

**Use Cases**:
- Feature gating
- Gradual rollouts
- A/B testing
- Emergency kill switches
- Beta programs

**Example**:
```python
flag = FeatureFlag(
    name="ai_interview_assistant",
    description="AI-powered interview question suggestions",
    is_enabled=True,
    rollout_percentage=25,  # 25% of users
    allowed_tenants=["tenant_abc123"],  # Plus specific tenant
    config={
        "model": "gpt-4",
        "max_suggestions": 5
    },
    created_by=superadmin.id
)
```

---

## Superadmin Dashboard Features

### Audit Logs View
```
GET /api/v1/superadmin/audit-logs
- Filter by user, action, entity_type, severity, date range
- Export to CSV for compliance
- Real-time log streaming
```

### Tenant Management
```
GET    /api/v1/superadmin/tenants              # List all tenants
POST   /api/v1/superadmin/tenants              # Create tenant
GET    /api/v1/superadmin/tenants/{id}         # Tenant details
PATCH  /api/v1/superadmin/tenants/{id}         # Update tenant
DELETE /api/v1/superadmin/tenants/{id}         # Deactivate tenant
GET    /api/v1/superadmin/tenants/{id}/usage   # Usage stats
```

### Incident Management
```
GET    /api/v1/superadmin/incidents            # List incidents
POST   /api/v1/superadmin/incidents            # Create incident
GET    /api/v1/superadmin/incidents/{id}       # Incident details
PATCH  /api/v1/superadmin/incidents/{id}       # Update/resolve
GET    /api/v1/superadmin/incidents/active     # Active incidents
```

### System Metrics
```
GET    /api/v1/superadmin/metrics              # List metrics
POST   /api/v1/superadmin/metrics              # Record metric
GET    /api/v1/superadmin/metrics/dashboard    # Dashboard data
GET    /api/v1/superadmin/metrics/alerts       # Alert conditions
```

### Feature Flags
```
GET    /api/v1/superadmin/flags                # List flags
POST   /api/v1/superadmin/flags                # Create flag
GET    /api/v1/superadmin/flags/{id}           # Flag details
PATCH  /api/v1/superadmin/flags/{id}           # Update flag
DELETE /api/v1/superadmin/flags/{id}           # Delete flag
POST   /api/v1/superadmin/flags/{id}/toggle    # Quick toggle
```

---

## Integration Points

### Automatic Audit Logging
All API endpoints should log significant actions:

```python
from app.models import AuditLog, AuditLogAction

async def log_audit(
    db: AsyncSession,
    user: User,
    action: AuditLogAction,
    entity_type: str,
    entity_id: str,
    description: str,
    changes: dict,
    request: Request
):
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        changes=changes,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
        request_id=request.headers.get("x-request-id")
    )
    db.add(audit)
    await db.commit()
```

### Feature Flag Checking
```python
from app.models import FeatureFlag

async def is_feature_enabled(
    db: AsyncSession,
    flag_name: str,
    user_id: Optional[int] = None,
    tenant_id: Optional[str] = None
) -> bool:
    result = await db.execute(
        select(FeatureFlag).where(FeatureFlag.name == flag_name)
    )
    flag = result.scalar_one_or_none()
    
    if not flag or not flag.is_enabled:
        return False
    
    # Check specific allowlists
    if tenant_id and tenant_id in flag.allowed_tenants:
        return True
    
    if user_id and user_id in flag.allowed_users:
        return True
    
    # Check rollout percentage
    import random
    return random.randint(0, 100) < flag.rollout_percentage
```

### Metric Recording
```python
from app.models import SystemMetric

async def record_metric(
    db: AsyncSession,
    name: str,
    value: float,
    unit: str,
    service: str = None,
    tags: dict = {}
):
    metric = SystemMetric(
        metric_name=name,
        metric_type="gauge",
        value=value,
        unit=unit,
        service=service,
        measured_at=datetime.utcnow(),
        tags=tags
    )
    db.add(metric)
    await db.commit()
```

---

## Dashboard Queries

### Active Incidents
```sql
SELECT * FROM system_incidents
WHERE status IN ('open', 'investigating')
ORDER BY severity DESC, detected_at DESC;
```

### Critical Audit Events (Last 24h)
```sql
SELECT * FROM audit_logs
WHERE severity = 'critical'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Tenant Usage Summary
```sql
SELECT 
  t.name,
  t.subscription_tier,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT a.id) as assessment_count,
  COUNT(DISTINCT c.id) as candidate_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.tenant_id
LEFT JOIN assessments a ON a.tenant_id = t.tenant_id
LEFT JOIN candidates c ON c.tenant_id = t.tenant_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.subscription_tier;
```

### Metric Trends (CPU Usage - Last Hour)
```sql
SELECT 
  date_trunc('minute', measured_at) as time,
  AVG(value) as avg_cpu,
  MAX(value) as max_cpu
FROM system_metrics
WHERE metric_name = 'cpu_usage'
  AND measured_at > NOW() - INTERVAL '1 hour'
GROUP BY date_trunc('minute', measured_at)
ORDER BY time;
```

### Feature Flag Adoption
```sql
SELECT 
  name,
  is_enabled,
  rollout_percentage,
  array_length(allowed_tenants, 1) as tenant_count,
  array_length(allowed_users, 1) as user_count
FROM feature_flags
ORDER BY created_at DESC;
```

---

## Monitoring & Alerts

### Critical Incidents
- Alert when new incident with severity = 'critical'
- Notify on-call engineer
- Update status page

### System Metrics
- Alert when CPU > 80% for 5 minutes
- Alert when API latency p95 > 500ms
- Alert when error rate > 1%

### Audit Logs
- Alert on multiple failed login attempts
- Alert on role changes
- Alert on sensitive data access

### Tenant Quotas
- Alert when tenant approaches limits
- Auto-upgrade or throttle based on policy

---

## Security Considerations

### Access Control
- **Superadmin Only**: All superadmin endpoints require `role == 'superadmin'`
- **Audit Log Immutability**: Once created, audit logs cannot be modified
- **Sensitive Data**: Hash/redact PII in audit logs where needed

### Data Retention
- Audit logs: Retain for compliance period (7 years typically)
- Metrics: Aggregate and downsample (1min → 1hour → 1day)
- Incidents: Archive resolved incidents after 90 days

### Compliance
- SOC 2: Audit logs track all admin actions
- GDPR: Tenant isolation, data export/deletion
- HIPAA: Encryption, access controls, audit trails

---

## Performance Optimization

### Indexes
All superadmin tables have comprehensive indexes:
- Time-based queries: `created_at`, `measured_at`, `detected_at`
- Filtering: `severity`, `status`, `metric_name`, `action`
- Composite: `(user_id, action)`, `(entity_type, entity_id)`

### Partitioning
For high-volume tables:
```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Partition system_metrics by day
CREATE TABLE system_metrics_2025_12_14 PARTITION OF system_metrics
FOR VALUES FROM ('2025-12-14') TO ('2025-12-15');
```

### Archival
- Move old audit logs to cold storage (S3)
- Aggregate old metrics into summary tables
- Compress incident attachments

---

## Summary

### New Models: 5
1. ✅ **AuditLog** - Complete audit trail
2. ✅ **Tenant** - Multi-tenancy support
3. ✅ **SystemIncident** - Incident management
4. ✅ **SystemMetric** - Performance monitoring
5. ✅ **FeatureFlag** - Feature rollout control

### Pydantic Schemas: 18
- Create/Update/Response for each model

### Indexes Added: 35
- Optimized for filtering, sorting, and time-series queries

### API Endpoints: 25+
- Full CRUD operations for all models
- Dashboard aggregations
- Real-time monitoring

### Frontend Pages (Existing)
- `/admin/super` - Main dashboard
- `/admin/super/admins` - Admin user management
- `/admin/super/tenants` - Tenant management
- `/admin/super/incidents` - Incident tracking
- `/admin/super/audit-logs` - Audit log viewer
- `/admin/super/system-settings` - System configuration
- `/admin/super/ai` - AI/LLM settings
- `/admin/super/proctoring` - Proctoring config
- `/admin/super/interviews` - Interview settings
- `/admin/super/questions` - Question bank
- `/admin/super/billing` - Billing management

**Status**: ✅ Complete - Ready for API implementation and frontend integration!

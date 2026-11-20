use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaintenanceTask {
    pub id: i64,
    pub code: String,
    pub frequency: String,
    pub system_asset: String,
    pub activity: String,
    pub procedure: String,
    pub suggested_owner: String,
    pub assigned_owner: String,
    pub recommended_timing: String,
    pub priority: String,
    pub evidence_record: String,
    pub status: String,
    pub last_completed: Option<String>,
    pub next_due: Option<String>,
    pub work_order: String,
    pub comments: String,
}

#[derive(Debug, Deserialize)]
pub struct MaintenanceTaskCreate {
    pub code: String,
    pub frequency: String,
    pub system_asset: String,
    pub activity: String,
    #[serde(default)]
    pub procedure: String,
    #[serde(default)]
    pub suggested_owner: String,
    #[serde(default)]
    pub assigned_owner: String,
    #[serde(default)]
    pub recommended_timing: String,
    #[serde(default = "default_priority")]
    pub priority: String,
    #[serde(default)]
    pub evidence_record: String,
    #[serde(default = "default_status")]
    pub status: String,
    pub last_completed: Option<String>,
    pub next_due: Option<String>,
    #[serde(default)]
    pub work_order: String,
    #[serde(default)]
    pub comments: String,
}

fn default_priority() -> String { "Medium".to_string() }
fn default_status() -> String { "Not Started".to_string() }

#[derive(Debug, Deserialize)]
pub struct MaintenanceTaskPatch {
    pub frequency: Option<String>,
    pub system_asset: Option<String>,
    pub activity: Option<String>,
    pub procedure: Option<String>,
    pub suggested_owner: Option<String>,
    pub assigned_owner: Option<String>,
    pub recommended_timing: Option<String>,
    pub priority: Option<String>,
    pub evidence_record: Option<String>,
    pub status: Option<String>,
    pub last_completed: Option<Option<String>>,
    pub next_due: Option<Option<String>>,
    pub work_order: Option<String>,
    pub comments: Option<String>,
}

pub struct MaintenanceStore {
    path: PathBuf,
    tasks: Mutex<Vec<MaintenanceTask>>,
}

impl MaintenanceStore {
    pub fn init(app_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        fs::create_dir_all(&app_dir)?;
        let path = app_dir.join("maintenance_tasks.json");
        let tasks = if path.exists() {
            let content = fs::read_to_string(&path)?;
            serde_json::from_str::<Vec<MaintenanceTask>>(&content).unwrap_or_else(|_| seed_tasks())
        } else {
            let seeded = seed_tasks();
            let json = serde_json::to_string_pretty(&seeded)?;
            fs::write(&path, json)?;
            seeded
        };
        Ok(Self {
            path,
            tasks: Mutex::new(tasks),
        })
    }

    fn persist(&self, tasks: &[MaintenanceTask]) -> Result<(), String> {
        let json = serde_json::to_string_pretty(tasks).map_err(|e| e.to_string())?;
        fs::write(&self.path, json).map_err(|e| e.to_string())
    }
}

fn today_iso_plus(days: i64) -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
        + days * 86_400;
    // Civil date from days since Unix epoch (Howard Hinnant algorithm)
    let z = secs.div_euclid(86_400) + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if m <= 2 { y + 1 } else { y };
    format!("{:04}-{:02}-{:02}", year, m, d)
}

fn frequency_days(freq: &str) -> Option<i64> {
    match freq {
        "Daily" => Some(1),
        "Weekly" => Some(7),
        "Monthly" => Some(30),
        "Quarterly" => Some(90),
        "Semi-annual" => Some(182),
        "Annual" => Some(365),
        _ => None,
    }
}

#[tauri::command]
pub fn maintenance_list(store: State<'_, MaintenanceStore>) -> Result<Vec<MaintenanceTask>, String> {
    let tasks = store.tasks.lock().map_err(|e| e.to_string())?;
    Ok(tasks.clone())
}

#[tauri::command]
pub fn maintenance_create(
    store: State<'_, MaintenanceStore>,
    payload: MaintenanceTaskCreate,
) -> Result<MaintenanceTask, String> {
    let mut tasks = store.tasks.lock().map_err(|e| e.to_string())?;
    let next_id = tasks.iter().map(|t| t.id).max().unwrap_or(0) + 1;
    let task = MaintenanceTask {
        id: next_id,
        code: payload.code.trim().to_uppercase(),
        frequency: payload.frequency,
        system_asset: payload.system_asset,
        activity: payload.activity,
        procedure: payload.procedure,
        suggested_owner: payload.suggested_owner,
        assigned_owner: payload.assigned_owner,
        recommended_timing: payload.recommended_timing,
        priority: payload.priority,
        evidence_record: payload.evidence_record,
        status: payload.status,
        last_completed: payload.last_completed,
        next_due: payload.next_due,
        work_order: payload.work_order,
        comments: payload.comments,
    };
    tasks.push(task.clone());
    store.persist(&tasks)?;
    Ok(task)
}

#[tauri::command]
pub fn maintenance_update(
    store: State<'_, MaintenanceStore>,
    id: i64,
    payload: MaintenanceTaskPatch,
) -> Result<MaintenanceTask, String> {
    let mut tasks = store.tasks.lock().map_err(|e| e.to_string())?;
    let task = tasks
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Maintenance task {} not found", id))?;

    if let Some(v) = payload.frequency { task.frequency = v; }
    if let Some(v) = payload.system_asset { task.system_asset = v; }
    if let Some(v) = payload.activity { task.activity = v; }
    if let Some(v) = payload.procedure { task.procedure = v; }
    if let Some(v) = payload.suggested_owner { task.suggested_owner = v; }
    if let Some(v) = payload.assigned_owner { task.assigned_owner = v; }
    if let Some(v) = payload.recommended_timing { task.recommended_timing = v; }
    if let Some(v) = payload.priority { task.priority = v; }
    if let Some(v) = payload.evidence_record { task.evidence_record = v; }
    if let Some(v) = payload.status { task.status = v; }
    if let Some(v) = payload.last_completed { task.last_completed = v; }
    if let Some(v) = payload.next_due { task.next_due = v; }
    if let Some(v) = payload.work_order { task.work_order = v; }
    if let Some(v) = payload.comments { task.comments = v; }

    let updated = task.clone();
    store.persist(&tasks)?;
    Ok(updated)
}

#[tauri::command]
pub fn maintenance_complete(
    store: State<'_, MaintenanceStore>,
    id: i64,
) -> Result<MaintenanceTask, String> {
    let mut tasks = store.tasks.lock().map_err(|e| e.to_string())?;
    let task = tasks
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Maintenance task {} not found", id))?;

    task.status = "Completed".to_string();
    task.last_completed = Some(today_iso_plus(0));
    task.next_due = frequency_days(&task.frequency).map(today_iso_plus);

    let updated = task.clone();
    store.persist(&tasks)?;
    Ok(updated)
}

#[tauri::command]
pub fn maintenance_delete(store: State<'_, MaintenanceStore>, id: i64) -> Result<bool, String> {
    let mut tasks = store.tasks.lock().map_err(|e| e.to_string())?;
    let before = tasks.len();
    tasks.retain(|t| t.id != id);
    if tasks.len() == before {
        return Err(format!("Maintenance task {} not found", id));
    }
    store.persist(&tasks)?;
    Ok(true)
}

fn seed_tasks() -> Vec<MaintenanceTask> {
    let raw: &[(&str, &str, &str, &str, &str, &str, &str, &str, &str)] = &[
        ("D-01", "Daily", "Server room / data centre", "Check server-room environmental conditions", "Check temperature, humidity, cooling, airflow, water leaks, dust and physical access. Escalate abnormal readings or alarms.", "IT Infrastructure", "Start of each shift", "High", "Environmental log / alarm record"),
        ("D-02", "Daily", "Servers and virtualisation", "Review server health and critical alerts", "Review hardware, hypervisor, storage, CPU, memory, disk-space and service alerts; investigate critical warnings.", "Systems Administrator", "Start of each shift", "Critical", "Monitoring dashboard / ticket"),
        ("D-03", "Daily", "Backups", "Verify previous backup jobs", "Confirm scheduled backups completed; review failures, missed jobs, unusual durations and capacity warnings. Do not assume a successful job proves recoverability.", "Backup Administrator", "Morning", "Critical", "Backup job report"),
        ("D-04", "Daily", "Network / internet / LAN", "Check core network availability", "Review core switch, router, firewall, WAN and internet status; check packet loss, latency and interface errors; escalate site-wide outages.", "Network Administrator", "Start of each shift", "High", "Network monitoring log"),
        ("D-05", "Daily", "CCTV / cameras / NVR", "Check critical camera coverage and recording", "Confirm key operational, gate, perimeter and plant-area cameras are online, correctly positioned and recording on the NVR/VMS. Follow site security access rules.", "CCTV / IT Support", "Start of each shift", "High", "CCTV health checklist"),
        ("D-06", "Daily", "Microsoft 365 / user accounts", "Review account and security alerts", "Review sign-in risk, MFA, suspicious activity, service health and administrative alerts; escalate suspected compromise immediately.", "M365 Administrator", "Morning", "Critical", "Security alert / incident ticket"),
        ("D-07", "Daily", "Workstations / user support", "Review service desk queue and critical endpoints", "Prioritise production-impacting incidents; check recurring endpoint alerts, failed updates and devices reported offline.", "IT Support", "Start of each shift", "High", "Service desk queue"),
        ("D-08", "Daily", "UPS / power protection", "Check UPS status and alarms", "Review UPS load, battery status, bypass/fault alarms and power events; do not conduct live battery or electrical work unless authorised.", "IT Infrastructure / Facilities", "Start of each shift", "High", "UPS status log"),
        ("D-09", "Daily", "IT operations", "Record and hand over outstanding issues", "Update incident records, maintenance actions, outages, vendor cases and shift handover notes.", "IT Team Lead", "End of each shift", "Medium", "Daily handover log"),
        ("W-01", "Weekly", "Servers / operating systems", "Review capacity and performance trends", "Review CPU, RAM, disk, storage pool, event logs, service uptime and growth trends; plan remediation before thresholds are reached.", "Systems Administrator", "Monday / start of week", "High", "Weekly server health report"),
        ("W-02", "Weekly", "Backup infrastructure", "Review backup capacity and sample restore", "Check repository capacity, retention, replication and off-site copy status; perform a controlled sample file restore to an approved test location.", "Backup Administrator", "Weekly", "Critical", "Restore-test record"),
        ("W-03", "Weekly", "Workstations / laptops", "Inspect endpoint protection and update compliance", "Check EDR/antivirus health, definition status, encryption status where applicable, update failures and devices not checking in.", "Endpoint Administrator", "Weekly", "High", "Endpoint compliance report"),
        ("W-04", "Weekly", "Network switches / routers / firewall", "Review network device health and configuration changes", "Check interface errors, port utilisation, device temperature, CPU/memory, logs, firewall alerts and unauthorised configuration changes.", "Network Administrator", "Weekly", "High", "Network health report / config audit"),
        ("W-05", "Weekly", "Fibre and Ethernet cabling", "Inspect accessible cable routes and patching", "Look for damaged jackets, crushed cables, loose patch leads, poor labelling, blocked cabinets and unsafe routing. Do not bend, pull or disconnect live fibre without authorisation.", "Network Technician", "Weekly", "Medium", "Cable inspection checklist"),
        ("W-06", "Weekly", "CCTV / NVR / VMS", "Review recording retention and storage", "Check recording continuity, NVR disk health, storage capacity, time synchronisation and retention against site security requirements.", "CCTV / IT Support", "Weekly", "High", "CCTV storage report"),
        ("W-07", "Weekly", "Microsoft 365", "Review mailbox, OneDrive and SharePoint service issues", "Review service health, quota warnings, mail-flow issues, sync errors, shared mailbox access and reported collaboration problems.", "M365 Administrator", "Weekly", "Medium", "M365 service review"),
        ("W-08", "Weekly", "Printers / scanners / peripherals", "Inspect shared printing services", "Check print queues, toner/consumables, paper jams, scan-to-email and network connectivity; remove stale jobs and log recurring faults.", "IT Support", "Weekly", "Low", "Printer checklist"),
        ("W-09", "Weekly", "IT security", "Review security and administrative logs", "Review privileged activity, failed logins, endpoint detections, firewall events and alerts; confirm incidents have owners and actions.", "Security / Systems Administrator", "Weekly", "Critical", "Security review log"),
        ("W-10", "Weekly", "IT stores / spares", "Check critical spare equipment", "Check availability and condition of spare disks, SFPs, patch leads, power supplies, keyboards, mice and approved replacement devices.", "IT Team Lead / Stores", "Weekly", "Medium", "IT spares register"),
        ("M-01", "Monthly", "Servers / firmware", "Review patching and firmware status", "Assess OS and application patches, hypervisor updates, firmware advisories and vendor notices; test and schedule approved changes in a maintenance window.", "Systems Administrator", "Monthly maintenance window", "Critical", "Patch and change record"),
        ("M-02", "Monthly", "Microsoft 365 / Entra ID", "Review users, groups, licences and privileged roles", "Identify leavers, inactive accounts, excess licences, guest accounts and privileged-role assignments; obtain approval before disabling or changing access.", "M365 Administrator / HR liaison", "Monthly", "High", "Access review sign-off"),
        ("M-03", "Monthly", "Workstations / laptops", "Apply approved OS and software updates", "Deploy tested updates in phases; confirm restart, application compatibility, encryption and endpoint protection after installation.", "Endpoint Administrator", "Monthly maintenance window", "High", "Patch compliance report"),
        ("M-04", "Monthly", "Network equipment", "Back up and review network configurations", "Export configurations for switches, routers, firewalls and wireless controllers; verify backup readability and restrict access to configuration files.", "Network Administrator", "Monthly", "Critical", "Configuration backup log"),
        ("M-05", "Monthly", "Fibre / Ethernet infrastructure", "Test selected network links and document port maps", "Use approved testers and optical tools to investigate suspect links; verify labels, patch-panel records, fibre link levels where supported and switch-port mapping.", "Network Technician", "Monthly sample / risk-based", "High", "Cable test results / updated topology"),
        ("M-06", "Monthly", "CCTV / access to video", "Review camera time, image quality and permissions", "Check focus, field of view, night/IR performance, time synchronisation, user permissions and audit logs for video access/export.", "CCTV / IT Support + Security", "Monthly", "High", "Camera inspection / access review"),
        ("M-07", "Monthly", "UPS / generators interface", "Review power protection maintenance indicators", "Review self-test results, battery age, runtime estimates, load and alarms; coordinate any load test or electrical work with Facilities and approved vendors.", "IT Infrastructure + Facilities", "Monthly", "High", "UPS inspection report"),
        ("M-08", "Monthly", "Software and licences", "Reconcile installed software and licence usage", "Compare approved software inventory with installations and subscriptions; identify unauthorised, unsupported or unused software and renewals due.", "IT Asset / Licence Administrator", "Monthly", "High", "Software and licence register"),
        ("M-09", "Monthly", "Security controls", "Review firewall rules, VPN and remote access", "Review business justification, owners, expiry dates, MFA enforcement and least-privilege access; remove only after owner approval and change control.", "Network / Security Administrator", "Monthly", "Critical", "Firewall and remote access review"),
        ("M-10", "Monthly", "IT asset management", "Reconcile hardware inventory", "Verify asset tags, assigned user, location, warranty, condition, hostname and lifecycle status for a rotating sample or all critical assets.", "IT Asset Administrator", "Monthly", "Medium", "Updated asset register"),
        ("M-11", "Monthly", "Server room", "Clean approved external surfaces and inspect racks", "Remove dust from accessible external surfaces using approved methods; check rack security, blanking panels, airflow and cable management. Do not open equipment or use liquids on powered devices.", "IT Support / Facilities", "Monthly", "Medium", "Server-room checklist"),
        ("Q-01", "Quarterly", "Disaster recovery", "Conduct disaster recovery tabletop or recovery test", "Test agreed recovery scenarios, contacts, dependencies, RTO/RPO assumptions and restoration steps; document gaps and corrective actions.", "IT Manager / Systems Team", "Quarterly", "Critical", "DR test report"),
        ("Q-02", "Quarterly", "Backup systems", "Perform documented restore test for critical systems", "Restore selected server, database or application backups to an isolated approved environment; validate data integrity and application owner sign-off.", "Backup / Application Administrator", "Quarterly", "Critical", "Restore validation report"),
        ("Q-03", "Quarterly", "Microsoft 365 / identity", "Conduct formal access recertification", "Ask system and department owners to confirm access for staff, contractors, guests, shared mailboxes and privileged roles; record approvals and removals.", "M365 Administrator + Department Heads", "Quarterly", "High", "Signed access review"),
        ("Q-04", "Quarterly", "CCTV / NVR", "Test critical camera and recording recovery", "Test playback and retrieval for sampled dates/cameras, confirm export process, retention settings, time accuracy and recovery of a failed camera or recorder where feasible.", "CCTV / IT Support + Security", "Quarterly", "High", "CCTV functional test"),
        ("Q-05", "Quarterly", "Network / fibre", "Review network topology and critical link resilience", "Validate diagrams, uplinks, fibre paths, switch stack/redundancy, spare optics and single points of failure; coordinate testing to avoid disrupting plant operations.", "Network Administrator", "Quarterly", "High", "Updated network diagram / risk log"),
        ("Q-06", "Quarterly", "Cybersecurity", "Review vulnerability and remediation status", "Run approved vulnerability scans on in-scope IT assets; prioritise exploitable and critical findings, assign owners and track remediation or documented exceptions.", "Security / Systems Administrator", "Quarterly", "Critical", "Vulnerability report"),
        ("Q-07", "Quarterly", "IT governance", "Review IT procedures and contact lists", "Review escalation matrix, vendor contacts, system owners, maintenance windows, backup procedures and emergency communication details.", "IT Manager", "Quarterly", "Medium", "Approved procedure revisions"),
        ("SA-01", "Semi-annual", "UPS / batteries", "Arrange approved UPS battery and runtime assessment", "Have competent personnel/vendor assess battery condition, runtime, alarms and replacement needs; coordinate with Facilities and avoid unapproved live electrical work.", "Facilities / UPS Vendor + IT", "Every 6 months", "High", "Vendor service report"),
        ("SA-02", "Semi-annual", "Fibre backbone", "Inspect critical fibre routes and termination points", "Coordinate route inspection with site operations; inspect accessible enclosures, trays, patch panels, labels and environmental protection; test suspect strands with approved equipment.", "Network Team / Approved Fibre Contractor", "Every 6 months", "High", "Fibre inspection and test report"),
        ("SA-03", "Semi-annual", "Server room / cooling", "Service precision cooling and room safeguards", "Coordinate HVAC service, condensate/drain checks, alarms, airflow and environmental sensor calibration with Facilities or approved contractor.", "Facilities / HVAC Vendor", "Every 6 months", "High", "HVAC service report"),
        ("SA-04", "Semi-annual", "IT security", "Review privileged accounts and emergency access", "Revalidate break-glass accounts, password vault access, admin workstations, MFA methods and emergency access logging; test only under approved procedure.", "IT Manager / Security Administrator", "Every 6 months", "Critical", "Privileged access review"),
        ("A-01", "Annual", "IT infrastructure", "Review lifecycle, capacity and refresh plan", "Assess server, storage, network, CCTV, UPS and workstation age, warranty, vendor support, capacity, risk and replacement budget.", "IT Manager / Asset Team", "Annually / budget cycle", "High", "Annual lifecycle plan"),
        ("A-02", "Annual", "Cybersecurity / continuity", "Review and approve IT disaster recovery plan", "Update business impact assumptions, system priorities, recovery contacts, supplier dependencies, RTO/RPO and test schedule; obtain management approval.", "IT Manager + Business Owners", "Annually", "Critical", "Approved DR/BCP plan"),
        ("A-03", "Annual", "Software / licences", "Complete annual software licence and support audit", "Reconcile entitlements, deployments, renewals, support contracts, end-of-life products and vendor contacts; plan renewals before expiry.", "IT Asset / Procurement", "Annually", "High", "Licence audit / renewal calendar"),
        ("A-04", "Annual", "CCTV / security systems", "Review CCTV coverage and retention requirements", "With Security and relevant site owners, assess blind spots, camera condition, retention, access governance and legal/site policy requirements.", "Security Manager + IT", "Annually", "High", "Coverage review and action plan"),
        ("A-05", "Annual", "Network cabling", "Certify critical copper/fibre links where required", "Arrange competent contractor testing/certification for critical links or after major changes; retain test results and update as-built drawings.", "Network Manager / Approved Contractor", "Annually or after major works", "High", "Cable certification reports"),
        ("A-06", "Annual", "IT operations", "Review vendor support and maintenance contracts", "Check SLA performance, warranty coverage, support contacts, escalation paths, renewal dates and critical vendor dependencies.", "IT Manager / Procurement", "Annually", "Medium", "Vendor and SLA review"),
        ("E-01", "Event-driven", "All IT systems", "Perform post-change validation", "After approved changes, confirm service availability, monitoring, backup status, user access and rollback readiness; close change only after owner validation.", "Change Owner", "After every change", "High", "Change record / validation"),
        ("E-02", "Event-driven", "Servers / storage / network", "Investigate and remediate hardware alerts", "On disk, fan, PSU, memory, temperature or link failure alert, log incident, assess redundancy and arrange approved repair/replacement.", "Relevant Infrastructure Owner", "On alert", "Critical", "Incident and repair report"),
        ("E-03", "Event-driven", "Workstations / accounts", "Offboarding and role-change access control", "On HR-approved notification, disable or amend access, revoke sessions/tokens as appropriate, recover devices and transfer business data under policy.", "M365 Administrator / IT Support + HR", "On staff change", "Critical", "Offboarding checklist"),
        ("E-04", "Event-driven", "CCTV / network / cabling", "Restore service after damage or outage", "Coordinate with Security, Engineering and Operations; isolate hazards, protect evidence, repair/replace using approved contractors and verify end-to-end service.", "IT / Security / Engineering", "After incident", "Critical", "Incident report / test result"),
        ("E-05", "Event-driven", "Cybersecurity", "Respond to suspected compromise", "Follow incident response plan: preserve evidence, notify designated responders, contain only under authority, reset/revoke credentials as directed and document timeline.", "Incident Response Lead", "Immediately on suspicion", "Critical", "Security incident record"),
    ];

    raw.iter()
        .enumerate()
        .map(|(i, r)| MaintenanceTask {
            id: (i + 1) as i64,
            code: r.0.to_string(),
            frequency: r.1.to_string(),
            system_asset: r.2.to_string(),
            activity: r.3.to_string(),
            procedure: r.4.to_string(),
            suggested_owner: r.5.to_string(),
            assigned_owner: String::new(),
            recommended_timing: r.6.to_string(),
            priority: r.7.to_string(),
            evidence_record: r.8.to_string(),
            status: "Not Started".to_string(),
            last_completed: None,
            next_due: None,
            work_order: String::new(),
            comments: String::new(),
        })
        .collect()
}

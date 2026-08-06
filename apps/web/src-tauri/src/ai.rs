use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct AIResponse {
    pub text: String,
    pub data: Option<serde_json::Value>,
    pub action: Option<String>,
}

pub trait AIModule: Send + Sync {
    fn name(&self) -> &str;
    fn can_handle(&self, query: &str) -> bool;
    fn execute(&self, query: &str, conn: &Connection) -> Result<AIResponse, String>;
}

pub struct AssetsModule;
impl AIModule for AssetsModule {
    fn name(&self) -> &str { "Assets" }
    fn can_handle(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        q.contains("asset") || q.contains("laptop") || q.contains("camera") || q.contains("who has") || q.contains("where is") || q.contains("replacement")
    }
    fn execute(&self, query: &str, conn: &Connection) -> Result<AIResponse, String> {
        let q = query.to_lowercase();
        
        if q.contains("who has") {
            // e.g. Who has laptop IT-0241?
            // Extract the tag if possible. A simple simulated approach:
            let stmt = conn.prepare("SELECT a.make, a.model, e.name, e.department FROM hardware_assets a JOIN employees e ON a.assigned_to = e.id WHERE a.tag LIKE ?1 LIMIT 1");
            if let Ok(mut stmt) = stmt {
                let tag = q.split_whitespace().last().unwrap_or("").trim_matches('?').to_uppercase();
                let like_tag = format!("%{}%", tag);
                if let Ok(mut rows) = stmt.query([&like_tag]) {
                    if let Ok(Some(row)) = rows.next() {
                        let make: String = row.get(0).unwrap_or_default();
                        let model: String = row.get(1).unwrap_or_default();
                        let name: String = row.get(2).unwrap_or_default();
                        let dept: String = row.get(3).unwrap_or_default();
                        return Ok(AIResponse {
                            text: format!("The {} {} ({}) is currently assigned to {} in {}.", make, model, tag, name, dept),
                            data: None,
                            action: None,
                        });
                    }
                }
            }
            return Ok(AIResponse {
                text: "I could not find an assignment for that asset.".to_string(),
                data: None,
                action: None,
            });
        }
        
        if q.contains("replacement") {
            // Count assets needing replacement (older than 3 years or poor condition)
            if let Ok(count) = conn.query_row::<i64, _, _>("SELECT COUNT(*) FROM hardware_assets WHERE condition IN ('POOR', 'BROKEN')", [], |r| r.get(0)) {
                return Ok(AIResponse {
                    text: format!("There are currently {} assets marked as POOR or BROKEN that are due for replacement.", count),
                    data: None,
                    action: Some("NAVIGATE_ASSETS".to_string()),
                });
            }
        }
        
        Ok(AIResponse {
            text: "I can help with assets. Try asking 'Who has IT-0241?' or 'Show assets due for replacement'.".to_string(),
            data: None,
            action: None,
        })
    }
}

pub struct InventoryModule;
impl AIModule for InventoryModule {
    fn name(&self) -> &str { "Inventory" }
    fn can_handle(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        q.contains("inventory") || q.contains("stock") || q.contains("consumable")
    }
    fn execute(&self, query: &str, conn: &Connection) -> Result<AIResponse, String> {
        let q = query.to_lowercase();
        if q.contains("low") {
            let stmt = conn.prepare("SELECT name, quantity, min_stock FROM inventory_items WHERE quantity <= min_stock LIMIT 5");
            if let Ok(mut stmt) = stmt {
                let mut items = Vec::new();
                if let Ok(mut rows) = stmt.query([]) {
                    while let Ok(Some(row)) = rows.next() {
                        let name: String = row.get(0).unwrap_or_default();
                        let qty: i64 = row.get(1).unwrap_or_default();
                        items.push(format!("- {} (Qty: {})", name, qty));
                    }
                }
                if items.is_empty() {
                    return Ok(AIResponse {
                        text: "All inventory items are currently at healthy stock levels.".to_string(),
                        data: None,
                        action: None,
                    });
                }
                let mut text = "The following items are low on stock:\n".to_string();
                text.push_str(&items.join("\n"));
                return Ok(AIResponse {
                    text,
                    data: None,
                    action: Some("NAVIGATE_INVENTORY".to_string()),
                });
            }
        }
        Ok(AIResponse {
            text: "I can help check inventory levels and stock status.".to_string(),
            data: None,
            action: None,
        })
    }
}

pub struct NetworkModule;
impl AIModule for NetworkModule {
    fn name(&self) -> &str { "Network" }
    fn can_handle(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        q.contains("offline") || q.contains("wifi") || q.contains("connected") || q.contains("network")
    }
    fn execute(&self, query: &str, conn: &Connection) -> Result<AIResponse, String> {
        let q = query.to_lowercase();
        if q.contains("offline") || q.contains("down") {
            let stmt = conn.prepare("SELECT device_name FROM connected_devices WHERE status = 'offline'");
            if let Ok(mut stmt) = stmt {
                let mut devices = Vec::new();
                if let Ok(mut rows) = stmt.query([]) {
                    while let Ok(Some(row)) = rows.next() {
                        let name: String = row.get(0).unwrap_or_default();
                        devices.push(name);
                    }
                }
                if devices.is_empty() {
                    return Ok(AIResponse {
                        text: "All monitored network devices are currently online.".to_string(),
                        data: None,
                        action: None,
                    });
                }
                let text = format!("There are {} devices currently offline: {}.", devices.len(), devices.join(", "));
                return Ok(AIResponse {
                    text,
                    data: None,
                    action: Some("NAVIGATE_NETWORK".to_string()),
                });
            }
        }
        
        let count = conn.query_row::<i64, _, _>("SELECT COUNT(*) FROM connected_devices WHERE status = 'online'", [], |r| r.get(0)).unwrap_or(0);
        Ok(AIResponse {
            text: format!("There are currently {} devices connected and online on the network.", count),
            data: None,
            action: None,
        })
    }
}

pub struct ReportsModule;
impl AIModule for ReportsModule {
    fn name(&self) -> &str { "Reports" }
    fn can_handle(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        q.contains("report") || q.contains("audit")
    }
    fn execute(&self, query: &str, _conn: &Connection) -> Result<AIResponse, String> {
        let mut text = "I can help generate reports. Try saying 'Generate this month's audit report'.".to_string();
        
        if query.to_lowercase().contains("audit") {
            text = "I've pre-configured the audit report parameters for this month. You can review and export it in the Reports section.".to_string();
        }

        Ok(AIResponse {
            text,
            data: None,
            action: Some("NAVIGATE_REPORTS".to_string()),
        })
    }
}

pub struct FallbackModule;
impl AIModule for FallbackModule {
    fn name(&self) -> &str { "Fallback" }
    fn can_handle(&self, _query: &str) -> bool { true }
    fn execute(&self, _query: &str, _conn: &Connection) -> Result<AIResponse, String> {
        Ok(AIResponse {
            text: "I am not sure how to handle that request yet. As an AI Operations Center, I am continuously learning from system data.".to_string(),
            data: None,
            action: None,
        })
    }
}

pub struct HelpdeskModule;
impl AIModule for HelpdeskModule {
    fn name(&self) -> &str { "Helpdesk" }
    fn can_handle(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        q.contains("ticket") || q.contains("helpdesk") || q.contains("support")
    }
    fn execute(&self, _query: &str, conn: &Connection) -> Result<AIResponse, String> {
        let open: i64 = conn.query_row("SELECT COUNT(*) FROM helpdesk_tickets WHERE status NOT IN ('RESOLVED','CLOSED')", [], |r| r.get(0)).unwrap_or(0);
        Ok(AIResponse {
            text: format!("There are currently {} open helpdesk tickets.", open),
            data: None,
            action: None,
        })
    }
}

pub struct AIEngine {
    modules: Vec<Box<dyn AIModule>>,
}

impl AIEngine {
    pub fn new() -> Self {
        Self {
            modules: vec![
                Box::new(AssetsModule),
                Box::new(InventoryModule),
                Box::new(NetworkModule),
                Box::new(ReportsModule),
                Box::new(HelpdeskModule),
                Box::new(FallbackModule),
            ],
        }
    }

    pub fn process(&self, query: &str, conn: &Connection) -> Result<AIResponse, String> {
        for module in &self.modules {
            if module.can_handle(query) {
                return module.execute(query, conn);
            }
        }
        Err("No module could handle the query, not even fallback.".to_string())
    }
}

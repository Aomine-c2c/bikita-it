// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use simplelog::*;
use std::fs::File;

use tauri::Emitter;

#[tauri::command]
fn ping_network(app: tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn(async move {
        use tokio::process::Command;
        use serde_json::json;
        use quick_xml::events::Event;
        use quick_xml::Reader;
        use get_if_addrs::get_if_addrs;
        use ipnet::Ipv4Net;
        
        log::info!("Starting background nmap scan...");
        
        // 1. Get all local interfaces and calculate subnets
        let mut target_subnets = Vec::new();
        if let Ok(interfaces) = get_if_addrs() {
            for iface in interfaces {
                if iface.is_loopback() { continue; }
                if let get_if_addrs::IfAddr::V4(ipv4_addr) = iface.addr {
                    let ipv4 = ipv4_addr.ip;
                    let netmask = ipv4_addr.netmask;
                    
                    if let Ok(net) = Ipv4Net::with_netmask(ipv4, netmask) {
                        // Only scan subnets /16 or smaller
                        if net.prefix_len() >= 16 {
                            target_subnets.push(net);
                        }
                    }
                }
            }
        }
        
        target_subnets.sort_by_key(|net| net.network());
        target_subnets.dedup_by_key(|net| net.network());
        
        for subnet in target_subnets {
            let target = format!("{}/{}", subnet.network(), subnet.prefix_len());
            log::info!("Scanning subnet {} with nmap...", target);
            
            let output = Command::new("nmap")
                .args(["-sn", "-oX", "-", &target])
                .output()
                .await;
                
            if let Ok(out) = output {
                let xml = String::from_utf8_lossy(&out.stdout);
                
                let mut reader = Reader::from_str(&xml);
                
                let mut buf = Vec::new();
                
                let mut current_ip = String::new();
                let mut current_mac = String::new();
                let mut current_vendor = String::new();
                let mut current_hostname = String::new();
                
                loop {
                    match reader.read_event_into(&mut buf) {
                        Ok(Event::Empty(ref e)) | Ok(Event::Start(ref e)) => {
                            if e.name().as_ref() == b"address" {
                                let mut is_mac = false;
                                let mut addr = String::new();
                                let mut vendor = String::new();
                                
                                for attr in e.attributes() {
                                    if let Ok(a) = attr {
                                        if a.key.as_ref() == b"addrtype" && a.value.as_ref() == b"mac" {
                                            is_mac = true;
                                        } else if a.key.as_ref() == b"addr" {
                                            addr = String::from_utf8_lossy(&a.value).into_owned();
                                        } else if a.key.as_ref() == b"vendor" {
                                            vendor = String::from_utf8_lossy(&a.value).into_owned();
                                        }
                                    }
                                }
                                
                                if is_mac {
                                    current_mac = addr;
                                    current_vendor = vendor;
                                } else if current_ip.is_empty() {
                                    current_ip = addr;
                                }
                            } else if e.name().as_ref() == b"hostname" {
                                for attr in e.attributes() {
                                    if let Ok(a) = attr {
                                        if a.key.as_ref() == b"name" {
                                            current_hostname = String::from_utf8_lossy(&a.value).into_owned();
                                        }
                                    }
                                }
                            }
                        },
                        Ok(Event::End(ref e)) => {
                            if e.name().as_ref() == b"host" {
                                if !current_ip.is_empty() {
                                    let mac = if current_mac.is_empty() { "UNKNOWN".to_string() } else { current_mac.clone() };
                                    let vendor_str = if current_vendor.is_empty() { None } else { Some(current_vendor.clone()) };
                                    
                                    let device = json!({
                                        "ip_address": current_ip,
                                        "mac_address": mac,
                                        "hostname": if current_hostname.is_empty() { "Unknown Device" } else { &current_hostname },
                                        "vendor": vendor_str,
                                        "status": "Online"
                                    });
                                    
                                    let _ = app.emit("device_discovered", device);
                                }
                                
                                current_ip.clear();
                                current_mac.clear();
                                current_vendor.clear();
                                current_hostname.clear();
                            }
                        },
                        Ok(Event::Eof) => break,
                        Err(_) => break,
                        _ => (),
                    }
                    buf.clear();
                }
            } else {
                log::error!("Failed to execute nmap. Is it installed?");
            }
        }
        
        let _ = app.emit("scan_complete", ());
        log::info!("Nmap multi-subnet scan complete.");
    });
    
    Ok(())
}

#[tauri::command]
fn scan_cameras(app: tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn(async move {
        use tokio::net::UdpSocket;
        use tokio::time::{timeout, Duration};
        use serde_json::json;
        use quick_xml::events::Event;
        use quick_xml::Reader;

        log::info!("Starting native SADP camera scan...");

        let socket = match UdpSocket::bind("0.0.0.0:0").await {
            Ok(s) => s,
            Err(e) => {
                log::error!("Failed to bind UDP socket: {}", e);
                return;
            }
        };

        if let Err(e) = socket.set_broadcast(true) {
            log::error!("Failed to set broadcast: {}", e);
            return;
        }

        let probe_msg = r#"<?xml version="1.0" encoding="utf-8"?><Probe><Uuid>8A79E2A8-3606-4A00-8F0E-921C1DF8E0DE</Uuid><Types>inquiry</Types></Probe>"#;
        
        let target = "239.255.255.250:37020";
        if let Err(e) = socket.send_to(probe_msg.as_bytes(), target).await {
            log::error!("Failed to send SADP probe: {}", e);
            return;
        }
        
        let target_bcast = "255.255.255.255:37020";
        let _ = socket.send_to(probe_msg.as_bytes(), target_bcast).await;

        let mut buf = [0u8; 4096];
        
        // Listen for responses for 5 seconds
        let start_time = std::time::Instant::now();
        while start_time.elapsed() < Duration::from_secs(5) {
            match timeout(Duration::from_millis(500), socket.recv_from(&mut buf)).await {
                Ok(Ok((size, addr))) => {
                    let xml = String::from_utf8_lossy(&buf[..size]);
                    
                    let mut reader = Reader::from_str(&xml);
                    
                    let mut current_tag = String::new();
                    let mut mac_address = String::new();
                    let mut ip_address = String::new();
                    let mut device_type = String::new();
                    let mut software_version = String::new();
                    let mut serial_number = String::new();
                    
                    let mut event_buf = Vec::new();
                    loop {
                        match reader.read_event_into(&mut event_buf) {
                            Ok(Event::Start(ref e)) => {
                                current_tag = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                            },
                            Ok(Event::Text(e)) => {
                                let txt = String::from_utf8_lossy(e.as_ref()).trim().to_string();
                                match current_tag.as_str() {
                                    "MAC" => mac_address = txt,
                                    "IPv4Address" => ip_address = txt,
                                    "DeviceDescription" => device_type = txt,
                                    "SoftwareVersion" => software_version = txt,
                                    "SerialNumber" => serial_number = txt,
                                    _ => {}
                                }
                            },
                            Ok(Event::End(_)) => {
                                current_tag.clear();
                            },
                            Ok(Event::Eof) | Err(_) => break,
                            _ => (),
                        }
                        event_buf.clear();
                    }
                    
                    if !ip_address.is_empty() && !mac_address.is_empty() {
                        let device = json!({
                            "ip_address": ip_address,
                            "mac_address": mac_address,
                            "hostname": device_type,
                            "vendor": "Hikvision",
                            "status": "Online",
                            "os": software_version,
                            "deviceType": "Camera"
                        });
                        let _ = app.emit("device_discovered", device);
                    }
                },
                _ => {} // Timeout or error, just continue loop until 5s is up
            }
        }

        let _ = app.emit("scan_complete", ());
        log::info!("SADP scan complete.");
    });
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![ping_network, scan_cameras])
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir)?;

            let log_file_path = app_dir.join("pulse.log");
            let _ = WriteLogger::init(
                LevelFilter::Info,
                Config::default(),
                File::options().create(true).append(true).open(log_file_path)?
            );
            log::info!("Starting Pulse IT Operations...");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running pulse");
}

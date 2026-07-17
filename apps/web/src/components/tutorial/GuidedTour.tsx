"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function GuidedTour() {
  useEffect(() => {
    // Only run on client side and if not already shown
    if (typeof window === "undefined") return;
    
    const hasSeenTour = localStorage.getItem("xiphos_tour_completed");
    if (hasSeenTour) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayClickBehavior: "close",
        popoverClass: "max-w-[calc(100vw-2rem)]",
        steps: [
          {
            element: "body",
            popover: {
              title: "Welcome to Xiphos! 👋",
              description: "This is your enterprise IT operations platform. Let's take a comprehensive tour of the main features.",
              side: "top",
              align: "center"
            }
          },
          {
            element: "#tour-sidebar-nav",
            popover: {
              title: "Navigation Menu",
              description: "Use the sidebar to jump between Core Operations, Infrastructure, and Governance modules. You can manage Assets, Network topology, Repairs, and more.",
              side: "right",
              align: "start"
            }
          },
          {
            element: "#tour-search",
            popover: {
              title: "Global Search",
              description: "Quickly find assets, tickets, users, or any other resource across the platform using the global search.",
              side: "bottom",
              align: "start"
            }
          },
          {
            element: "#tour-ai",
            popover: {
              title: "AI Assistant",
              description: "Stuck? Ask the integrated AI Assistant for help with IT queries, troubleshooting, or navigating the platform.",
              side: "bottom",
              align: "center"
            }
          },
          {
            element: "#tour-dashboard-kpis",
            popover: {
              title: "Critical KPIs",
              description: "At a glance, monitor Total Hardware Assets, Assets At Risk, Low Stock Items, and Active Network Devices. These metrics reflect real-time database data.",
              side: "bottom",
              align: "start"
            }
          },
          {
            element: "#tour-inventory-trend",
            popover: {
              title: "Inventory Transactions Trend",
              description: "Visualize hardware intake vs issue trends over the last 7 days to forecast equipment needs.",
              side: "top",
              align: "start"
            }
          },
          {
            element: "#tour-system-status",
            popover: {
              title: "System Status",
              description: "Monitor the uptime and latency of core infrastructure systems like the VPN Gateway, ERP Integration, and Email Servers.",
              side: "left",
              align: "start"
            }
          },
          {
            element: "#tour-recent-activity",
            popover: {
              title: "Recent Activity Feed",
              description: "A chronological audit trail of all recent operations and transactions across the platform.",
              side: "top",
              align: "start"
            }
          },
          {
            element: "#tour-active-repairs",
            popover: {
              title: "Active Repairs",
              description: "Stay on top of ongoing maintenance. View current repair tickets, assigned technicians, and expected resolution times.",
              side: "left",
              align: "start"
            }
          },
          {
            element: ".fixed.bottom-6.right-6",
            popover: {
              title: "Quick Actions",
              description: "Click this floating action button anytime to add new assets or log transactions quickly from anywhere.",
              side: "left",
              align: "end"
            }
          }
        ],
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the tour?")) {
            driverObj.destroy();
            localStorage.setItem("xiphos_tour_completed", "true");
          }
        }
      });

      driverObj.drive();
    }, 1500); // Increased delay slightly to ensure network fetches are done before tour triggers

    return () => clearTimeout(timer);
  }, []);

  return null;
}

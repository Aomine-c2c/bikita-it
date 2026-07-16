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
        steps: [
          {
            element: "body",
            popover: {
              title: "Welcome to Xiphos! 👋",
              description: "This is your enterprise IT operations platform. Let's take a quick tour of the main features.",
              side: "top",
              align: "center"
            }
          },
          {
            element: "nav", // The sidebar
            popover: {
              title: "Navigation",
              description: "Use the sidebar to jump between Inventory, Network topology, Repairs, and more.",
              side: "right",
              align: "start"
            }
          },
          {
            element: ".fixed.bottom-6.right-6", // The FAB button (if present)
            popover: {
              title: "Quick Actions",
              description: "Click this floating button anytime to add new assets or receive stock quickly.",
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
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render any UI itself
}

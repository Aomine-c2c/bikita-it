import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function NotFound() {
  return (
    <DashboardLayout>
      <section role="alert" className="h-[60vh] grid place-items-center text-center">
        <div>
          <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            The page or route you requested does not exist.
          </p>
          <Link 
            href="/" 
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}

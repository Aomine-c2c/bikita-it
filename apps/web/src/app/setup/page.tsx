"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // First time setup complete, redirect to dashboard
        router.push("/");
      } else {
        setError(data.message || "Failed to initialize system.");
      }
    } catch (err) {
      setError("Network error. Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center]" />
      
      <Card className="w-full max-w-md relative border-primary/20 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Xiphos Initialization</CardTitle>
            <CardDescription className="text-base mt-2">
              Welcome. Let's create your master administrator account to secure the system.
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                required 
                value={formData.name}
                onChange={handleChange}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="admin@company.com" 
                required 
                value={formData.email}
                onChange={handleChange}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={handleChange}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-11"
              />
            </div>
          </CardContent>
          
          <CardFooter className="pb-8 pt-4">
            <Button type="submit" className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Initializing System...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((res) => {
        if (res.ok) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/admin/login");
        }
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return null;
}

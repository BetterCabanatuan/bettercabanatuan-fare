"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/admin/login");
        })
      }
    >
      Sign out
    </Button>
  );
}

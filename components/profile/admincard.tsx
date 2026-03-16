"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pen, LogOut, Crown, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { useState } from "react";
import ChangeRoleDialog from "@/components/profile/changeRole";
import { AdminsListDialog } from "@/components/profile/AdminsListDialog";

export function AdminCard({
  email,
  isAdmin,
  isSuperAdmin,
  userRole,
}: {
  email: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  userRole?: number;
}) {
  const router = useRouter();
  const { setLoggedIn, setGlobalLoading } = useGContext();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminsListOpen, setAdminsListOpen] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL;

  if (!BACKEND_URL) {
    toast.error("Backend URL not configured");
    return null;
  }



  if (!isAdmin) return null;

  return (
    <Card className="overflow-hidden pt-4 pb-6">
      <p className="mt-2 text-2xl text-white text-center font-semibold">
        {isSuperAdmin ? "Super Admin Tools" : "Admin Tools"}
      </p>

      <div className="flex flex-wrap gap-4 mt-6 justify-center">
        {isSuperAdmin && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
              onClick={() => setAdminDialogOpen(true)}
              title="Make Admin (Super Admin Only)"
            >
              <Crown className="h-5 w-5" />
            </Button>

            <ChangeRoleDialog
              open={adminDialogOpen}
              onOpenChange={setAdminDialogOpen}
              isSuperAdmin={isSuperAdmin}
            />
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
          onClick={() => setAdminsListOpen(true)}
          title="View Admins"
        >
          <Users className="h-5 w-5" />
        </Button>

        <AdminsListDialog
          open={adminsListOpen}
          onOpenChange={setAdminsListOpen}
          isSuperAdmin={isSuperAdmin}
        />

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shadow-md hover:shadow-lg transition-all hover:scale-105"
          onClick={() => router.push("/admin/publishNotice")}
          title="Publish Notice"
        >
          <Pen className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}
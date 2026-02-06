"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Crown } from "lucide-react";

interface Admin {
  adminId?: string;
  email: string;
  name: string;
  rollNo: string;
  role: number;
}

export function AdminsListDialog({
  open,
  onOpenChange,
  isSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin?: boolean;
}) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<Admin | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL;

  useEffect(() => {
    if (!open) return;
    
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/admin/list`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setAdmins(data.admins || []);
        } else {
          toast.error("Failed to fetch admins list");
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
        toast.error("Error fetching admins");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();

    // Listen for admin updates
    const handleAdminsUpdated = () => {
      fetchAdmins();
    };

    window.addEventListener('adminsUpdated', handleAdminsUpdated);
    return () => window.removeEventListener('adminsUpdated', handleAdminsUpdated);
  }, [open, BACKEND_URL]);

  const handleRemoveAdmin = (admin: Admin) => {
    setAdminToRemove(admin);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!adminToRemove) return;

    try {
      setRemoving(adminToRemove.email);
      const res = await fetch(`${BACKEND_URL}/api/admin/remove-admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminToRemove.email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Admin removed successfully");
        setAdmins(admins.filter((admin) => admin.email !== adminToRemove.email));
      } else {
        toast.error(data.error || "Failed to remove admin");
      }
    } catch {
      toast.error("Error removing admin");
    } finally {
      setRemoving(null);
      setConfirmDialogOpen(false);
      setAdminToRemove(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admins List</DialogTitle>
          <DialogDescription>
            Total Admins: {admins.length}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No admins found
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => {
              const isSuperAdminRole = admin.role === 101;
              return (
                <Card
                  key={admin.email}
                  className={`p-5 flex justify-between hover:shadow-md transition-shadow gap-4 ${
                    isSuperAdminRole
                      ? "border-2 border-amber-500 align-right bg-gradient-to-r from-amber-transparent to-amber-0"
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isSuperAdminRole && (
                        <Crown className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      )}
                      <p className="font-bold text-lg break-words">{admin.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground break-words">{admin.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {isSuperAdminRole ? "Super Admin" : `Roll: ${admin.rollNo}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isSuperAdmin && !isSuperAdminRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin)}
                        disabled={removing === admin.email}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove Admin"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>

      {/* Confirmation Dialog for Removing Admin */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {adminToRemove?.name} from admin role?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Email: <span className="font-medium">{adminToRemove?.email}</span>
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setAdminToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={removing !== null}
            >
              {removing ? "Removing..." : "Remove Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


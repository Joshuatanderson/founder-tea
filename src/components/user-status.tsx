"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { User, Check, LogOut } from "lucide-react";
import { IDENTITY_STORAGE_PREFIX, IDENTITY_CHANGED_EVENT, getGroupIdFromStorageKey, notifyIdentityChanged } from "@/lib/constants";

type VerifiedGroup = {
  id: string;
  name: string;
};

export function UserStatus() {
  const [verifiedGroups, setVerifiedGroups] = useState<VerifiedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVerifiedGroups = async () => {
    // Find all semaphore identity keys in localStorage
    const groupIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(IDENTITY_STORAGE_PREFIX)) {
        const groupId = getGroupIdFromStorageKey(key);
        if (groupId) {
          groupIds.push(groupId);
        }
      }
    }

    if (groupIds.length === 0) {
      setVerifiedGroups([]);
      setIsLoading(false);
      return;
    }

    // Fetch group names from Supabase
    const supabase = createClient();
    const { data, error } = await supabase
      .from("validation_group")
      .select("id, name")
      .in("id", groupIds);

    if (!error && data) {
      setVerifiedGroups(data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadVerifiedGroups();

    // Listen for identity changes from other components
    const handleIdentityChange = () => {
      loadVerifiedGroups();
    };

    window.addEventListener(IDENTITY_CHANGED_EVENT, handleIdentityChange);
    return () => {
      window.removeEventListener(IDENTITY_CHANGED_EVENT, handleIdentityChange);
    };
  }, []);

  const handleLogout = () => {
    // Remove all semaphore identity keys from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(IDENTITY_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Update state and notify other components
    setVerifiedGroups([]);
    notifyIdentityChanged();
  };

  if (isLoading) {
    return (
      <Avatar size="sm">
        <AvatarFallback>
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (verifiedGroups.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>
            <User className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">Not verified</span>
      </div>
    );
  }

  // Get initials from first verified group
  const primaryGroup = verifiedGroups[0];
  const initials = primaryGroup.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer">
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
          <AvatarBadge className="bg-green-500">
            <Check className="h-2 w-2 text-white" />
          </AvatarBadge>
        </Avatar>
        <span className="text-sm font-medium">{primaryGroup.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-3 py-2 text-xs text-muted-foreground">Verified as</div>
        {verifiedGroups.map((group) => (
          <DropdownMenuItem key={group.id} disabled>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            {group.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

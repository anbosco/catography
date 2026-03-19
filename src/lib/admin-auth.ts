import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminAccountRow = {
  user_id: string;
  email: string;
  username: string;
  display_name: string;
  is_active: boolean;
};

export type AdminAccount = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  isActive: boolean;
};

function mapAdminAccount(row: AdminAccountRow): AdminAccount {
  return {
    userId: row.user_id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    isActive: row.is_active,
  };
}

export async function getAdminAccountByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("user_id, email, username, display_name, is_active")
    .ilike("username", normalizedUsername)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapAdminAccount(data as AdminAccountRow) : null;
}

export async function getAdminAccountByUserId(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("user_id, email, username, display_name, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapAdminAccount(data as AdminAccountRow) : null;
}

export async function getAdminAccountsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, AdminAccount>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("user_id, email, username, display_name, is_active")
    .in("user_id", userIds)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return new Map(
    ((data || []) as AdminAccountRow[]).map((row) => {
      const account = mapAdminAccount(row);
      return [account.userId, account] as const;
    }),
  );
}

export async function getCurrentAdminAccount(
  user: Pick<User, "id"> | null | undefined,
) {
  if (!user?.id) {
    return null;
  }

  return getAdminAccountByUserId(user.id);
}

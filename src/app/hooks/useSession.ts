import useSWR from "swr"
import { useRef } from "react";
import { getMe } from "@/lib/auth";

export type SessionUser = { id: string, pseudo: string, address: string | null }

export function useSession() {
  const lastUser = useRef<SessionUser | null>(null);
  const { data, error, isLoading, mutate } = useSWR<SessionUser | null>(
    "/api/user",
    async (url) => {
      const baseUser = await getMe();
      if (!baseUser) return null;
      const r = await fetch(url);
      if (!r.ok) return null;
      const heatboardUser = await r.json();
      return { ...heatboardUser, pseudo: baseUser.pseudo };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 3_600_000,
      shouldRetryOnError: false,
    }
  );

  if (data) lastUser.current = data;

  return {
    user: lastUser.current,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

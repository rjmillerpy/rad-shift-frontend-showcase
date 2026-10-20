"use client";
import { useCallback, useEffect, useState } from "react";
import { ambleGet, amblePut } from "../lib/api";
import {
  AvatarResponseSchema,
  AvatarSchema,
  type Avatar,
  type AvatarResponse,
} from "../data/schema";

const ENDPOINT = "/amble/avatar";

export type AvatarStatus = "loading" | "missing" | "ready" | "error";

export type UseAvatarResult = {
  status: AvatarStatus;
  avatar: Avatar | null;
  error: string | null;
  saving: boolean;
  saveAvatar: (avatar: Avatar) => Promise<void>;
  refresh: () => Promise<void>;
};

const LOAD_ERROR_MESSAGE = "Could not load your avatar";
const SAVE_ERROR_MESSAGE = "Could not save your avatar";
const VALIDATION_MESSAGE = "Avatar could not be saved — one of the choices is invalid";

/**
 * Owns the client-side avatar lifecycle:
 *   - GET /amble/avatar on mount → { avatar, exists } → status transitions
 *   - PUT /amble/avatar on save → parses the response before storing
 *
 * Every response goes through Zod (rule 5) so a schema drift on the backend
 * never lets an invalid avatar leak into the UI.
 */
export function useAvatar(): UseAvatarResult {
  const [status, setStatus] = useState<AvatarStatus>("loading");
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyResponse = useCallback((response: AvatarResponse) => {
    if (response.exists && response.avatar !== null) {
      setAvatar(response.avatar);
      setStatus("ready");
      return;
    }
    setAvatar(null);
    setStatus("missing");
  }, []);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const raw = await ambleGet<unknown>(ENDPOINT);
      const parsed = AvatarResponseSchema.parse(raw);
      applyResponse(parsed);
    } catch (cause) {
      console.error("useAvatar.refresh failed", { cause });
      setError(LOAD_ERROR_MESSAGE);
      setStatus("error");
    }
  }, [applyResponse]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveAvatar = useCallback(
    async (next: Avatar): Promise<void> => {
      const validated = AvatarSchema.safeParse(next);
      if (!validated.success) {
        setError(VALIDATION_MESSAGE);
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const raw = await amblePut<unknown>(ENDPOINT, { avatar: validated.data });
        const parsed = AvatarResponseSchema.parse(raw);
        applyResponse(parsed);
      } catch (cause) {
        console.error("useAvatar.saveAvatar failed", { cause });
        setError(SAVE_ERROR_MESSAGE);
      } finally {
        setSaving(false);
      }
    },
    [applyResponse],
  );

  return { status, avatar, error, saving, saveAvatar, refresh };
}

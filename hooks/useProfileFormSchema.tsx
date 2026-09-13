import { useEffect, useState } from 'react';
import { DEFAULT_PROFILE_SCHEMA, getProfileFormSchema } from '@/lib/hackmatch.api';
import type { ParticipantIdentity, ProfileFormSchema } from '@/lib/hackmatch.types';

export function useProfileFormSchema(identity?: ParticipantIdentity | null) {
  const [schema, setSchema] = useState<ProfileFormSchema>(DEFAULT_PROFILE_SCHEMA);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void getProfileFormSchema(identity)
      .then((result) => {
        if (active) setSchema(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [identity]);
  return { schema, loading };
}

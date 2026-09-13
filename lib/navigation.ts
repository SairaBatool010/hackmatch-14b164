import { router, type Href } from 'expo-router';
import type { Channel } from '@/lib/hackmatch.types';

export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function channelHref(channel: Channel): Href {
  return {
    pathname: '/channel/[id]',
    params: {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      group_id: channel.group_id ?? '',
      allows_posting: channel.allows_posting === false ? 'false' : 'true',
    },
  };
}

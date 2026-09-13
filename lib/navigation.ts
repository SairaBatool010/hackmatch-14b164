import { router, type Href } from 'expo-router';
import type { Channel } from '@/lib/hackmatch.types';

export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function requestThreadHref(inviteId: string, name: string): Href {
  return { pathname: '/request/[id]', params: { id: inviteId, name } };
}

export function memberProfileHref(userId: string): Href {
  return { pathname: '/member/[id]', params: { id: userId } };
}

export function channelMembersHref(channel: Channel): Href {
  return {
    pathname: '/channel/[id]/members',
    params: { id: channel.id, name: channel.name, group_id: channel.group_id ?? '' },
  };
}

export function adminTeamsHref(filter: 'no_group' | 'partial' | 'complete'): Href {
  return { pathname: '/admin/teams/[filter]', params: { filter } };
}

export function adminTeamHref(id: string, name: string): Href {
  return { pathname: '/admin/team/[id]', params: { id, name } };
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

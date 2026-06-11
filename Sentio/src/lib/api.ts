/**
 * The only module that talks to Supabase. Screens and contexts call these
 * functions; every function throws an Error with a readable message on
 * failure so callers can catch and surface it.
 */

import { supabase } from '@/lib/supabase';
import type {
  Checkin,
  FeedItem,
  FriendData,
  FriendshipStatus,
  JournalEntry,
  PendingRequest,
  Profile,
  Rating,
} from '@/lib/types';
import { asRating } from '@/lib/types';

function fail(context: string, message: string): never {
  throw new Error(`${context}: ${message}`);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signUp(
  email: string,
  password: string,
  username: string
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) fail('Sign up failed', error.message);
  return { needsEmailConfirmation: data.session === null };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail('Sign in failed', error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) fail('Sign out failed', error.message);
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) fail('Could not load profile', error.message);
  return data;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  if (error) fail('Could not check username', error.message);
  return data !== null;
}

export async function searchProfiles(
  query: string,
  excludeUserId: string
): Promise<Profile[]> {
  const sanitized = query.trim().replace(/[%_]/g, '');
  if (sanitized.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${sanitized}%`)
    .neq('id', excludeUserId)
    .limit(20);
  if (error) fail('Search failed', error.message);
  return data;
}

// ---------------------------------------------------------------------------
// Friendships
// ---------------------------------------------------------------------------

export async function getFriendData(userId: string): Promise<FriendData> {
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) fail('Could not load friends', error.message);

  const otherIds = rows.map((r) =>
    r.requester_id === userId ? r.addressee_id : r.requester_id
  );
  const profileById = new Map<string, Profile>();
  if (otherIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherIds);
    if (profilesError) fail('Could not load friends', profilesError.message);
    for (const p of profiles) profileById.set(p.id, p);
  }

  const friends: Profile[] = [];
  const incoming: PendingRequest[] = [];
  const outgoing: PendingRequest[] = [];
  for (const row of rows) {
    const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    const profile = profileById.get(otherId);
    if (!profile) continue;
    const status = row.status as FriendshipStatus;
    if (status === 'accepted') {
      friends.push(profile);
    } else if (row.addressee_id === userId) {
      incoming.push({ profile, createdAt: row.created_at });
    } else {
      outgoing.push({ profile, createdAt: row.created_at });
    }
  }
  friends.sort((a, b) => a.username.localeCompare(b.username));
  return { friends, incoming, outgoing };
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  if (error) {
    if (error.code === '23505') {
      fail('Friend request failed', 'A request already exists between you two');
    }
    fail('Friend request failed', error.message);
  }
}

export async function acceptFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId);
  if (error) fail('Could not accept request', error.message);
}

/** Decline an incoming request, cancel an outgoing one, or unfriend. */
export async function removeFriendship(
  userA: string,
  userB: string
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${userA},addressee_id.eq.${userB}),and(requester_id.eq.${userB},addressee_id.eq.${userA})`
    );
  if (error) fail('Could not remove friendship', error.message);
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

function toCheckin(row: {
  id: string;
  user_id: string;
  date: string;
  rating: number;
  chips: string[];
  created_at: string;
}): Checkin {
  return { ...row, rating: asRating(row.rating) };
}

export async function getCheckin(
  userId: string,
  date: string
): Promise<Checkin | null> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) fail('Could not load check-in', error.message);
  return data ? toCheckin(data) : null;
}

export async function upsertCheckin(
  userId: string,
  date: string,
  rating: Rating,
  chips: string[]
): Promise<Checkin> {
  const { data, error } = await supabase
    .from('checkins')
    .upsert(
      { user_id: userId, date, rating, chips },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();
  if (error) fail('Could not save check-in', error.message);
  return toCheckin(data);
}

/** All of the user's check-ins, oldest first (streaks, history, stats). */
export async function getMyCheckins(userId: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) fail('Could not load your check-ins', error.message);
  return data.map(toCheckin);
}

/** Friends' check-ins since `sinceDate`, newest first. */
export async function getFriendsFeed(
  friends: Profile[],
  sinceDate: string
): Promise<FeedItem[]> {
  if (friends.length === 0) return [];
  const usernameById = new Map(friends.map((f) => [f.id, f.username]));
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .in('user_id', friends.map((f) => f.id))
    .gte('date', sinceDate)
    .order('created_at', { ascending: false });
  if (error) fail('Could not load the feed', error.message);
  return data.map((row) => ({
    checkin: toCheckin(row),
    username: usernameById.get(row.user_id) ?? 'unknown',
  }));
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) fail('Could not load journal', error.message);
  return data;
}

export async function upsertJournalEntry(
  userId: string,
  date: string,
  body: string
): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, date, body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();
  if (error) fail('Could not save journal entry', error.message);
  return data;
}

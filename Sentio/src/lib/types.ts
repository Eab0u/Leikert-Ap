export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function asRating(value: number): Rating {
  const clamped = Math.min(Math.max(Math.round(value), 1), 7);
  return clamped as Rating;
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD, user-local
  rating: Rating;
  chips: string[];
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD, user-local
  body: string;
  updated_at: string;
}

/** A pending friend request, seen from either side. */
export interface PendingRequest {
  profile: Profile;
  createdAt: string;
}

export interface FriendData {
  friends: Profile[];
  incoming: PendingRequest[];
  outgoing: PendingRequest[];
}

/** A friend's check-in joined with their profile, for the feed. */
export interface FeedItem {
  checkin: Checkin;
  username: string;
}

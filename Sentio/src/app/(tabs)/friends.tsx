import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CheckinCard } from '@/components/CheckinCard';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { Fonts, Spacing } from '@/constants/theme';
import { useRequiredUserId } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import {
  acceptFriendRequest,
  getFriendData,
  getFriendsFeed,
  removeFriendship,
  searchProfiles,
  sendFriendRequest,
} from '@/lib/api';
import { addDays, todayLocalDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import type { FeedItem, FriendData, Profile } from '@/lib/types';

type RelationToMe = 'none' | 'friends' | 'incoming' | 'outgoing';

function relationTo(profileId: string, data: FriendData): RelationToMe {
  if (data.friends.some((f) => f.id === profileId)) return 'friends';
  if (data.incoming.some((r) => r.profile.id === profileId)) return 'incoming';
  if (data.outgoing.some((r) => r.profile.id === profileId)) return 'outgoing';
  return 'none';
}

export default function FriendsScreen() {
  const userId = useRequiredUserId();
  const { palette } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendData, setFriendData] = useState<FriendData>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getFriendData(userId);
      const items = await getFriendsFeed(
        data.friends,
        addDays(todayLocalDate(), -7)
      );
      setFriendData(data);
      setFeed(items);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      setResults(await searchProfiles(trimmed, userId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSearching(false);
    }
  };

  const withBusy = async (id: string, action: () => Promise<void>) => {
    setActionBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setActionBusyId(null);
    }
  };

  const renderSearchAction = (profile: Profile) => {
    const relation = relationTo(profile.id, friendData);
    if (relation === 'friends') {
      return <Text style={[styles.relation, { color: palette.success }]}>Friends ✓</Text>;
    }
    if (relation === 'outgoing') {
      return <Text style={[styles.relation, { color: palette.textMuted }]}>Pending…</Text>;
    }
    if (relation === 'incoming') {
      return (
        <Button
          title="Accept"
          variant="secondary"
          loading={actionBusyId === profile.id}
          onPress={() =>
            void withBusy(profile.id, () => acceptFriendRequest(profile.id, userId))
          }
          style={styles.smallButton}
        />
      );
    }
    return (
      <Button
        title="Add"
        loading={actionBusyId === profile.id}
        onPress={() =>
          void withBusy(profile.id, () => sendFriendRequest(userId, profile.id))
        }
        style={styles.smallButton}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={palette.primary}
          />
        }>
        <Text style={[styles.title, { color: palette.text }]}>Friends</Text>

        {error ? (
          <Card style={{ borderColor: palette.danger }}>
            <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Search by username"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => void runSearch()}
            />
          </View>
          <Button
            title="Find"
            variant="secondary"
            loading={searching}
            onPress={() => void runSearch()}
            style={styles.searchButton}
          />
        </View>

        {results !== null ? (
          <View style={styles.section}>
            {results.length === 0 ? (
              <Text style={[styles.muted, { color: palette.textMuted }]}>
                No one found with that username.
              </Text>
            ) : (
              results.map((profile) => (
                <Card key={profile.id} style={styles.rowCard}>
                  <Text style={[styles.username, { color: palette.text }]}>
                    {profile.username}
                  </Text>
                  {renderSearchAction(profile)}
                </Card>
              ))
            )}
            <Pressable
              onPress={() => {
                setResults(null);
                setQuery('');
              }}>
              <Text style={[styles.clearSearch, { color: palette.primary }]}>
                Clear search
              </Text>
            </Pressable>
          </View>
        ) : null}

        {friendData.incoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Friend requests
            </Text>
            {friendData.incoming.map(({ profile }) => (
              <Card key={profile.id} style={styles.rowCard}>
                <Text style={[styles.username, { color: palette.text }]}>
                  {profile.username}
                </Text>
                <View style={styles.requestActions}>
                  <Button
                    title="Accept"
                    variant="secondary"
                    loading={actionBusyId === profile.id}
                    onPress={() =>
                      void withBusy(profile.id, () =>
                        acceptFriendRequest(profile.id, userId)
                      )
                    }
                    style={styles.smallButton}
                  />
                  <Button
                    title="Decline"
                    variant="outline"
                    loading={actionBusyId === `decline-${profile.id}`}
                    onPress={() =>
                      void withBusy(`decline-${profile.id}`, () =>
                        removeFriendship(userId, profile.id)
                      )
                    }
                    style={styles.smallButton}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Last 7 days
          </Text>
          {loading ? (
            <ActivityIndicator color={palette.primary} />
          ) : feed.length === 0 ? (
            <EmptyState
              emoji="🪺"
              title="It's quiet in here"
              message="Add a friend to see how their days are going."
            />
          ) : (
            feed.map((item) => <CheckinCard key={item.checkin.id} item={item} />)
          )}
        </View>

        {friendData.friends.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Your friends ({friendData.friends.length})
            </Text>
            {friendData.friends.map((friend) => (
              <Card key={friend.id} style={styles.rowCard}>
                <Text style={[styles.username, { color: palette.text }]}>
                  {friend.username}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${friend.username}`}
                  onPress={() =>
                    void withBusy(`remove-${friend.id}`, () =>
                      removeFriendship(userId, friend.id)
                    )
                  }
                  style={styles.removeButton}>
                  <Text style={[styles.removeText, { color: palette.textMuted }]}>
                    Remove
                  </Text>
                </Pressable>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  searchField: {
    flex: 1,
  },
  searchButton: {
    paddingHorizontal: 18,
  },
  section: {
    gap: Spacing.sm + 4,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  username: {
    fontFamily: Fonts.label,
    fontSize: 16,
    flexShrink: 1,
  },
  relation: {
    fontFamily: Fonts.label,
    fontSize: 14,
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallButton: {
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  muted: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  clearSearch: {
    fontFamily: Fonts.label,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  removeButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  removeText: {
    fontFamily: Fonts.label,
    fontSize: 13,
  },
});

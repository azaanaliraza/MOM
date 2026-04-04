import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  
  // Note: we'd import the real queries here once we know the schema
  // const data = useQuery(api.something.get);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back,</Text>
      <Text style={styles.subtitle}>{user?.firstName || 'Marketer'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Roadmap Data</Text>
        <Text style={styles.cardBody}>
          Native dashboards load faster! Data from Convex goes here.
        </Text>
      </View>

      <View style={{ marginTop: 'auto' }}>
        <Button title="Sign Out" onPress={() => signOut()} color="#ef4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#666',
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
  },
  card: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 14,
    color: '#444',
  },
});

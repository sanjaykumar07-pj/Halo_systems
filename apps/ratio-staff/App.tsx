import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { getOpenIncidents, updateIncidentStatus, subscribeToIncidents, supabase } from './lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const SEVERITY_COLOR: Record<number, string> = {
  1: '#ef5350', 2: '#ffa726', 3: '#ffee58', 4: '#4caf50', 5: '#42a5f5',
};
const SEVERITY_LABEL: Record<number, string> = {
  1: 'CRITICAL', 2: 'HIGH', 3: 'MEDIUM', 4: 'LOW', 5: 'INFO',
};
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  medical: 'medkit-outline', security: 'shield-outline', spill: 'water-outline', fire: 'flame-outline',
  structural: 'business-outline', noise: 'volume-high-outline', accessibility: 'accessibility-outline', other: 'pin-outline',
};

// Simulated logged-in worker
const DEMO_WORKER = { name: 'John Martinez', id: '10001', type: 'janitor', section: 102 };

export default function HomeScreen() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'done'>('open');
  const [showProfile, setShowProfile] = useState(false);

  const load = async () => {
    const data = await getOpenIncidents();
    setIncidents(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { 
    load(); 
    const sub = subscribeToIncidents(() => {
      load();
    });
    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleAccept = async (incident: any) => {
    Alert.alert(
      'Accept Task',
      `Accept this ${incident.parsed_type} incident at Section ${incident.section_id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept', onPress: async () => {
            await updateIncidentStatus(incident.id, 'in-progress');
            load();
          },
        },
      ],
    );
  };

  const handleResolve = async (incident: any) => {
    await updateIncidentStatus(incident.id, 'resolved');
    load();
  };

  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const doneIncidents = incidents.filter((i) => i.status === 'resolved');
  const displayed = activeTab === 'open' ? openIncidents : doneIncidents;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good Day,</Text>
          <Text style={s.workerName}>{DEMO_WORKER.name}</Text>
          <Text style={s.workerMeta}>
            ID #{DEMO_WORKER.id} · {DEMO_WORKER.type} · Section {DEMO_WORKER.section}
          </Text>
        </View>
        <TouchableOpacity style={s.avatar} onPress={() => setShowProfile(true)}>
          <Text style={s.avatarText}>{DEMO_WORKER.name[0]}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={[s.statPill, { borderColor: '#ef5350' }]}>
          <Text style={[s.statNum, { color: '#ef5350' }]}>{openIncidents.filter((i) => i.severity === 1).length}</Text>
          <Text style={s.statLabel}>Critical</Text>
        </View>
        <View style={[s.statPill, { borderColor: '#ffa726' }]}>
          <Text style={[s.statNum, { color: '#ffa726' }]}>{openIncidents.length}</Text>
          <Text style={s.statLabel}>Open</Text>
        </View>
        <View style={[s.statPill, { borderColor: '#4caf50' }]}>
          <Text style={[s.statNum, { color: '#4caf50' }]}>{doneIncidents.length}</Text>
          <Text style={s.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab === 'open' && s.tabActive]} onPress={() => setActiveTab('open')}>
          <Text style={[s.tabText, activeTab === 'open' && s.tabTextActive]}>Open Tasks ({openIncidents.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'done' && s.tabActive]} onPress={() => setActiveTab('done')}>
          <Text style={[s.tabText, activeTab === 'done' && s.tabTextActive]}>Done ({doneIncidents.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Incident List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#c62828" /></View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#c62828" />}
        >
          {displayed.length === 0 ? (
            <View style={s.empty}><Text style={s.emptyText}>No tasks here</Text></View>
          ) : displayed.map((incident) => (
            <View key={incident.id} style={s.card}>
              {/* Severity bar */}
              <View style={[s.severityBar, { backgroundColor: SEVERITY_COLOR[incident.severity] }]} />
              <View style={s.cardBody}>
                <View style={s.cardHeader}>
                  <Ionicons name={TYPE_ICON[incident.parsed_type] ?? 'pin-outline'} size={22} color="#f0f0f5" />
                  <View style={s.cardTitleBlock}>
                    <Text style={s.cardType}>{incident.parsed_type?.toUpperCase()}</Text>
                    <Text style={s.cardSection}>Section {incident.section_id ?? '—'}</Text>
                  </View>
                  <View style={[s.severityTag, { backgroundColor: SEVERITY_COLOR[incident.severity] + '22' }]}>
                    <Text style={[s.severityText, { color: SEVERITY_COLOR[incident.severity] }]}>
                      {SEVERITY_LABEL[incident.severity]}
                    </Text>
                  </View>
                </View>

                <Text style={s.cardMessage}>{incident.english_translation ?? incident.raw_text}</Text>
                <Text style={s.cardLocation}>{incident.location_description ?? 'Location unknown'}</Text>

                {/* Status */}
                <View style={s.cardFooter}>
                  <View style={s.statusDot}>
                    <View style={[s.dot, { backgroundColor: incident.status === 'in-progress' ? '#4caf50' : '#ffa726' }]} />
                    <Text style={s.statusText}>{incident.status}</Text>
                  </View>
                  {activeTab === 'open' && (
                    <View style={s.actions}>
                      {incident.status !== 'in-progress' && (
                        <TouchableOpacity style={s.btnAccept} onPress={() => handleAccept(incident)}>
                          <Text style={s.btnText}>Accept</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={s.btnResolve} onPress={() => handleResolve(incident)}>
                        <Text style={s.btnText}>Resolve</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Profile Overlay */}
      {showProfile && (
        <View style={s.profileOverlay}>
          <View style={s.profileCard}>
            <TouchableOpacity style={s.closeProfile} onPress={() => setShowProfile(false)}>
              <Ionicons name="close" size={24} color="#8888a0" />
            </TouchableOpacity>
            
            <View style={s.profileHeader}>
              <View style={[s.avatar, { width: 80, height: 80, borderRadius: 40, marginBottom: 16 }]}>
                <Text style={[s.avatarText, { fontSize: 32 }]}>{DEMO_WORKER.name[0]}</Text>
              </View>
              <Text style={s.workerName}>{DEMO_WORKER.name}</Text>
              <Text style={s.workerMeta}>{DEMO_WORKER.type.toUpperCase()}</Text>
            </View>

            <View style={s.profileInfoRow}>
              <View style={s.profileInfoBox}>
                <Text style={s.profileInfoLabel}>Worker ID</Text>
                <Text style={s.profileInfoVal}>#{DEMO_WORKER.id}</Text>
              </View>
              <View style={s.profileInfoBox}>
                <Text style={s.profileInfoLabel}>Section</Text>
                <Text style={s.profileInfoVal}>{DEMO_WORKER.section}</Text>
              </View>
            </View>

            <View style={s.profileInfoRow}>
              <View style={s.profileInfoBox}>
                <Text style={s.profileInfoLabel}>Status</Text>
                <Text style={[s.profileInfoVal, { color: '#4caf50' }]}>On-Duty</Text>
              </View>
              <View style={s.profileInfoBox}>
                <Text style={s.profileInfoLabel}>Efficiency</Text>
                <Text style={s.profileInfoVal}>100%</Text>
              </View>
            </View>
            
            <TouchableOpacity style={s.logoutBtn} onPress={() => { 
              setShowProfile(false); 
              if (typeof window !== 'undefined') {
                localStorage.removeItem('halo_user');
                window.location.href = 'http://localhost:5000';
              }
            }}>
              <Text style={s.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050508' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 24 },
  greeting: { fontSize: 13, color: '#8888a0', marginBottom: 2 },
  workerName: { fontSize: 22, fontWeight: '800', color: '#f0f0f5' },
  workerMeta: { fontSize: 12, color: '#8888a0', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#c62828', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statPill: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#0d0d12', borderWidth: 1 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#8888a0', marginTop: 2 },

  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#0d0d12', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#c62828' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8888a0' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#8888a0', fontSize: 14 },

  card: { backgroundColor: '#0d0d12', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e2e', overflow: 'hidden', flexDirection: 'row' },
  severityBar: { width: 4 },
  cardBody: { flex: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 22 },
  cardTitleBlock: { flex: 1 },
  cardType: { fontSize: 12, fontWeight: '800', color: '#f0f0f5', letterSpacing: 0.5 },
  cardSection: { fontSize: 11, color: '#8888a0' },
  severityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '800' },
  cardMessage: { fontSize: 14, color: '#c0c0d0', lineHeight: 20 },
  cardLocation: { fontSize: 12, color: '#8888a0' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#8888a0', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 8 },
  btnAccept: { backgroundColor: '#c62828', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  btnResolve: { backgroundColor: '#1e3a1e', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#4caf50' },
  btnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Profile
  profileOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,8,0.9)', justifyContent: 'center', padding: 20, zIndex: 100 },
  profileCard: { backgroundColor: '#0d0d12', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1e1e2e', alignItems: 'center' },
  closeProfile: { position: 'absolute', top: 16, right: 16, padding: 8 },
  profileHeader: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  profileInfoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  profileInfoBox: { flex: 1, backgroundColor: '#14141d', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e2e' },
  profileInfoLabel: { fontSize: 11, color: '#8888a0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  profileInfoVal: { fontSize: 16, fontWeight: '800', color: '#f0f0f5' },
  logoutBtn: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ef5350', alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#ef5350', fontWeight: '700', fontSize: 14 },
});

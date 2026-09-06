import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { submitIncident, getSections } from './lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'hi', label: '🇮🇳 हिन्दी' },
];

const CATEGORIES = [
  { key: 'medical',       label: 'Medical',       icon: 'medkit-outline', color: '#ef5350' },
  { key: 'security',      label: 'Security',      icon: 'shield-outline', color: '#ffa726' },
  { key: 'spill',         label: 'Spill',         icon: 'water-outline', color: '#42a5f5' },
  { key: 'accessibility', label: 'Accessibility', icon: 'accessibility-outline', color: '#ab47bc' },
  { key: 'structural',    label: 'Structural',    icon: 'business-outline', color: '#78909c' },
  { key: 'noise',         label: 'Noise',         icon: 'volume-high-outline', color: '#ffee58' },
  { key: 'other',         label: 'Other',         icon: 'pin-outline', color: '#8888a0' },
];

type Screen = 'home' | 'report' | 'success';

export default function FIFAFanApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [lang, setLang] = useState('en');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incidentRef, setIncidentRef] = useState('');

  const handleSubmit = async () => {
    if (!message.trim() || !name.trim()) {
      Alert.alert('Missing Info', 'Please enter your name and describe the issue.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitIncident({
        reporter_name: name,
        raw_text: message,
        detected_language: lang,
        section_id: section ? parseInt(section) : undefined,
      });
      setIncidentRef(result.id.slice(0, 8).toUpperCase());
      setScreen('success');
    } catch (e) {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setScreen('home'); setCategory(''); setMessage(''); setSection(''); setName('');
  };

  // ─── Home Screen ────────────────────────────────────────────
  if (screen === 'home') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />
      <ScrollView contentContainerStyle={s.homeContent}>
        {/* Stadium header */}
        <View style={s.homeHeader}>
          <View style={s.stadiumIcon}>
            <Ionicons name="business-outline" size={36} color="#fff" />
          </View>
          <Text style={s.homeTitle}>HALO Fan</Text>
          <Text style={s.homeSubtitle}>Your stadium companion</Text>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE — Match Day</Text>
          </View>
          <TouchableOpacity 
            style={s.signOutBtn}
            onPress={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('halo_user');
                window.location.href = 'http://localhost:5000';
              }
            }}
          >
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Language picker */}
        <Text style={s.sectionTitle}>Language / اللغة / 语言</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.langScroll}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity key={l.code} style={[s.langChip, lang === l.code && s.langChipActive]} onPress={() => setLang(l.code)}>
              <Text style={[s.langText, lang === l.code && s.langTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Emergency button */}
        <TouchableOpacity style={s.emergencyBtn} onPress={() => { setCategory('medical'); setScreen('report'); }}
          activeOpacity={0.8}>
          <Ionicons name="alert-circle-outline" size={36} color="#ef5350" style={{ marginBottom: 6 }} />
          <Text style={s.emergencyText}>EMERGENCY</Text>
          <Text style={s.emergencySubtext}>Tap for immediate help</Text>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={s.sectionTitle}>Report an Issue</Text>
        <View style={s.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.key} style={s.categoryCard}
              onPress={() => { setCategory(cat.key); setScreen('report'); }}>
              <View style={[s.catIconCircle, { backgroundColor: cat.color + '22' }]}>
                <Ionicons name={cat.icon as any} size={20} color={cat.color} />
              </View>
              <Text style={s.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info row */}
        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <Text style={s.infoNum}>50</Text>
            <Text style={s.infoLabel}>Staff On-Duty</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoNum}>3 min</Text>
            <Text style={s.infoLabel}>Avg. Response</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoNum}>16</Text>
            <Text style={s.infoLabel}>Stadium Sections</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ─── Report Screen ──────────────────────────────────────────
  if (screen === 'report') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.reportContent}>
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => setScreen('home')}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={s.reportTitle}>Report an Issue</Text>
          <Text style={s.reportSubtitle}>Your report goes directly to stadium operations. Respond time ~3 min.</Text>

          {/* Category chips */}
          <Text style={s.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.key} style={[s.catChip, category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setCategory(cat.key)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={cat.icon as any} size={14} color={category === cat.key ? '#fff' : '#c0c0d0'} />
                  <Text style={[s.catChipText, category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Name */}
          <Text style={s.fieldLabel}>Your Name</Text>
          <TextInput style={s.input} placeholder="Enter your name" placeholderTextColor="#8888a0" value={name}
            onChangeText={setName} />

          {/* Section */}
          <Text style={s.fieldLabel}>Section Number (optional)</Text>
          <TextInput style={s.input} placeholder="e.g. 203" placeholderTextColor="#8888a0" value={section}
            onChangeText={setSection} keyboardType="numeric" />

          {/* Message */}
          <Text style={s.fieldLabel}>Describe the Issue ({lang.toUpperCase()})</Text>
          <TextInput style={[s.input, s.textArea]} placeholder="Describe what's happening…" placeholderTextColor="#8888a0"
            value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />

          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={s.submitText}>{submitting ? 'Sending…' : 'Send Report'}</Text>
            {!submitting && <Ionicons name="send-outline" size={18} color="#fff" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ─── Success Screen ─────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />
      <View style={s.successContent}>
        <View style={s.successIcon}><Ionicons name="checkmark-circle-outline" size={44} color="#4caf50" /></View>
        <Text style={s.successTitle}>Report Sent!</Text>
        <Text style={s.successRef}>Ref # {incidentRef}</Text>
        <Text style={s.successMsg}>Stadium staff have been notified. A team member will respond within ~3 minutes.</Text>
        <View style={s.etaCard}>
          <Text style={s.etaNum}>~3 min</Text>
          <Text style={s.etaLabel}>Estimated Response Time</Text>
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={resetForm}>
          <Text style={s.submitText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050508' },

  // Home
  homeContent: { paddingHorizontal: 20, paddingBottom: 40 },
  homeHeader: { alignItems: 'center', paddingVertical: 32 },
  stadiumIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#c62828', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stadiumEmoji: { fontSize: 36 },
  homeTitle: { fontSize: 28, fontWeight: '900', color: '#f0f0f5', letterSpacing: 1 },
  homeSubtitle: { fontSize: 14, color: '#8888a0', marginTop: 4 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#0d1f0d', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#4caf50' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#4caf50', letterSpacing: 0.5 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8888a0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  langScroll: { marginBottom: 20 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#1e1e2e', marginRight: 8 },
  langChipActive: { backgroundColor: '#c62828', borderColor: '#c62828' },
  langText: { fontSize: 13, color: '#8888a0' },
  langTextActive: { color: '#fff', fontWeight: '700' },

  emergencyBtn: { backgroundColor: '#1a0505', borderWidth: 2, borderColor: '#c62828', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  emergencyIcon: { fontSize: 36, marginBottom: 6 },
  emergencyText: { fontSize: 20, fontWeight: '900', color: '#ef5350', letterSpacing: 2 },
  emergencySubtext: { fontSize: 12, color: '#8888a0', marginTop: 4 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  categoryCard: { width: '30%', backgroundColor: '#0d0d12', borderRadius: 14, borderWidth: 1, borderColor: '#1e1e2e', padding: 14, alignItems: 'center', gap: 8 },
  catIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catIcon: { fontSize: 20 },
  catLabel: { fontSize: 11, color: '#c0c0d0', fontWeight: '600', textAlign: 'center' },

  infoRow: { flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, backgroundColor: '#0d0d12', borderRadius: 12, borderWidth: 1, borderColor: '#1e1e2e', padding: 14, alignItems: 'center' },
  infoNum: { fontSize: 18, fontWeight: '800', color: '#f0f0f5' },
  infoLabel: { fontSize: 10, color: '#8888a0', marginTop: 2, textAlign: 'center' },

  // Report
  reportContent: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#c62828', fontSize: 15, fontWeight: '600' },
  reportTitle: { fontSize: 24, fontWeight: '800', color: '#f0f0f5', marginBottom: 6 },
  reportSubtitle: { fontSize: 13, color: '#8888a0', marginBottom: 24, lineHeight: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#8888a0', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#1e1e2e', borderRadius: 12, padding: 14, fontSize: 15, color: '#f0f0f5', marginBottom: 20 },
  textArea: { height: 120 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#1e1e2e', marginRight: 8 },
  catChipText: { fontSize: 13, color: '#c0c0d0', fontWeight: '600' },
  submitBtn: { backgroundColor: '#c62828', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Success
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0d1f0d', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successEmoji: { fontSize: 44 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#f0f0f5', marginBottom: 8 },
  successRef: { fontSize: 14, color: '#8888a0', marginBottom: 16, fontFamily: 'monospace' },
  successMsg: { fontSize: 14, color: '#c0c0d0', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  etaCard: { backgroundColor: '#0d1f0d', borderWidth: 1, borderColor: '#4caf50', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 28, width: '100%' },
  etaNum: { fontSize: 32, fontWeight: '900', color: '#4caf50' },
  etaLabel: { fontSize: 12, color: '#8888a0', marginTop: 4 },

  signOutBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ef5350' },
  signOutText: { color: '#ef5350', fontSize: 12, fontWeight: '700' },
});

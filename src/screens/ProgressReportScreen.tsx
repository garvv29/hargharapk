import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Title, Surface, Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchTotalFamiliesAndPhotos } from '../utils/api';

interface ProgressReportScreenProps {
  navigation: any;
}

export default function ProgressReportScreen({ navigation }: ProgressReportScreenProps) {
  const handleBack = () => {
    navigation.goBack();
  };

  // Static data for total families and photo uploads
  const [loading, setLoading] = useState(true);
  const [totalFamilies, setTotalFamilies] = useState<number | null>(null);
  const [photoUploads, setPhotoUploads] = useState<number | null>(null);

  useEffect(() => {
    fetchTotalFamiliesAndPhotos()
      .then((data) => {
        setTotalFamilies(data.total_students);
        setPhotoUploads(data.total_images_uploaded);
      })
      .catch(() => {
        setTotalFamilies(null);
        setPhotoUploads(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>प्रगति रिपोर्ट</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Surface style={styles.headerSection}>
          <Text style={styles.headerTitle}>हर घर मुंगा प्रगति</Text>
          <Text style={styles.headerSubtitle}>अभियान की वर्तमान स्थिति</Text>
        </Surface>

        {/* Stats Grid */}
          {loading ? (
          <Surface style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>डेटा लोड हो रहा है...</Text>
          </Surface>
        ) : (
          <View style={styles.statsGrid}>
            {/* Total Families Card */}
            <Surface style={[styles.statCard, styles.familiesCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.cardEmoji}>👨‍👩‍👧‍👦</Text>
                </View>
                <Text style={styles.cardTitle}>कुल परिवार</Text>
              </View>
              <Text style={styles.cardNumber}>{totalFamilies !== null ? totalFamilies : '0'}</Text>
              <Text style={styles.cardDescription}>पंजीकृत परिवारों की संख्या</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
            </Surface>

            {/* Distributed Plants Card */}
            <Surface style={[styles.statCard, styles.plantsCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.cardEmoji}>🌱</Text>
                </View>
                <Text style={styles.cardTitle}>वितरित पौधे</Text>
            </View>
              <Text style={styles.cardNumber}>{totalFamilies !== null ? totalFamilies : '0'}</Text>
              <Text style={styles.cardDescription}>मूंगा पौधे वितरित किए गए</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
            </Surface>

            {/* Photo Uploads Card */}
            <Surface style={[styles.statCard, styles.photosCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.cardEmoji}>📸</Text>
                </View>
                <Text style={styles.cardTitle}>फोटो अपलोड</Text>
              </View>
              <Text style={styles.cardNumber}>{photoUploads !== null ? photoUploads : '0'}</Text>
              <Text style={styles.cardDescription}>प्रगति फोटो अपलोड किए गए</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((photoUploads || 0) / (totalFamilies || 1) * 100, 100)}%` }]} />
              </View>
            </Surface>
          </View>
          )}

        {/* Success Rate Card */}
        {!loading && (
          <Surface style={styles.successCard}>
            <Text style={styles.successTitle}>सफलता दर</Text>
            <Text style={styles.successRate}>
              {totalFamilies && photoUploads ? Math.min(Math.round((photoUploads / totalFamilies) * 100), 100) : 0}%
            </Text>
            <Text style={styles.successDescription}>
              परिवारों ने अपनी प्रगति फोटो अपलोड की है
            </Text>
        </Surface>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4CAF50',
    fontSize: 16,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  familiesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  plantsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  photosCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  successCard: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successRate: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

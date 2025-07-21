import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Title, Paragraph, Button, Surface, Text, Chip, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface FamilyProgressScreenProps {
  navigation: any;
}

export default function FamilyProgressScreen({ navigation }: FamilyProgressScreenProps) {
  const [plantProgress] = useState({
    plantName: 'मूंनगा पौधा #123',
    plantAge: '45 दिन',
    healthStatus: 'स्वस्थ',
    growthStage: 'बढ़ रहा है',
    careScore: 85,
    photoCount: 12,
    lastWatered: 'आज, सुबह 8:00',
    nextWatering: 'कल, सुबह 8:00',
    height: '35 सेमी',
    leafCount: 8,
    hasFlowers: false,
    hasFruits: false,
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const handleUploadPhoto = () => {
    navigation.navigate('UploadPhoto');
  };

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
        <Text style={styles.headerTitle}>मेरी प्रगति</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plant Overview */}
        <Surface style={styles.overviewContainer}>
          <View style={styles.plantHeader}>
            <View style={styles.plantIcon}>
              <Text style={styles.plantEmoji}>🌱</Text>
            </View>
            <View style={styles.plantInfo}>
              <Title style={styles.plantTitle}>{plantProgress.plantName}</Title>
              <Text style={styles.plantAge}>{plantProgress.plantAge}</Text>
              <Chip style={styles.healthChip} textStyle={styles.healthChipText}>
                {plantProgress.healthStatus}
              </Chip>
            </View>
          </View>
          
          <View style={styles.careProgress}>
            <Text style={styles.progressLabel}>देखभाल स्कोर</Text>
            <ProgressBar 
              progress={Math.min(plantProgress.careScore / 100, 1)} 
              color="#4CAF50" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>{Math.min(plantProgress.careScore, 100)}%</Text>
          </View>
        </Surface>

        {/* Growth Stats */}
        <Surface style={styles.statsContainer}>
          <Title style={styles.sectionTitle}>विकास आंकड़े</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📏</Text>
              <Text style={styles.statNumber}>{plantProgress.height}</Text>
              <Text style={styles.statLabel}>ऊंचाई</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🍃</Text>
              <Text style={styles.statNumber}>{plantProgress.leafCount}</Text>
              <Text style={styles.statLabel}>पत्तियां</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📸</Text>
              <Text style={styles.statNumber}>{plantProgress.photoCount}</Text>
              <Text style={styles.statLabel}>फोटो</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💧</Text>
              <Text style={styles.statNumber}>नियमित</Text>
              <Text style={styles.statLabel}>पानी</Text>
            </View>
          </View>
        </Surface>



        {/* Action Button */}
        <Surface style={styles.actionContainer}>
          <Button
            mode="contained"
            icon="camera"
            style={styles.actionButton}
            buttonColor="#4CAF50"
            onPress={handleUploadPhoto}
          >
            नया फोटो अपलोड करें
          </Button>
        </Surface>
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
  overviewContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  plantIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plantEmoji: {
    fontSize: 28,
  },
  plantInfo: {
    flex: 1,
  },
  plantTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  plantAge: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  healthChip: {
    backgroundColor: '#E8F5E8',
    alignSelf: 'flex-start',
  },
  healthChipText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  careProgress: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
  },
  actionButton: {
    borderRadius: 8,
  },
}); 
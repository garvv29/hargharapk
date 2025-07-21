// src/screens/FamilyDashboard.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Text, FAB, Chip, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, FamilyData } from '../utils/api';
import { API_BASE_URL } from '../utils/api';

const { width } = Dimensions.get('window');

interface FamilyDashboardProps {
  navigation: any;
  route?: {
    params?: {
      userData?: any;
      userId?: string; // This is the username from login
      name?: string;  // This is the user's name from login
      age?: string;
      guardianName?: string;
      fatherName?: string;
      motherName?: string;
      aanganwadi_code?: string;
      // NEW: Add parameters for AI prediction results
      uploadedPredictionMessage?: string; // Message from backend (e.g., success/failure/moringa/not moringa)
      uploadedIsMoringa?: boolean | null; // True if moringa, False if not, null if prediction failed
      uploadedConfidence?: number | null; // Confidence score
    };
  };
}

export default function FamilyDashboard({ navigation, route }: FamilyDashboardProps) {
  const [plantData, setPlantData] = useState({
    plantName: 'मूंनगा पौधा #123',
    plantAge: '0 दिन',
    healthStatus: 'स्वस्थ',
    growthStage: 'बढ़ रहा है',
    lastWatered: 'आज, सुबह 8:00',
    nextWatering: 'कल, सुबह 8:00',
    photoCount: 0,
    plantStartDate: new Date(), // Track when plant was started
  });

  const [waterCompleted, setWaterCompleted] = useState(false);
  const [latestPhotoUri, setLatestPhotoUri] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalImagesYet, setTotalImagesYet] = useState<number>(0);

  // NEW STATE: To store prediction results received from UploadPhotoScreen
  const [aiPredictionStatus, setAiPredictionStatus] = useState<string | null>(null);
  const [aiIsMoringa, setAiIsMoringa] = useState<boolean | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const username = route?.params?.userId || '';
  const name = route?.params?.name || '';

  const TOTAL_IMAGES_TO_BE_UPLOADED = 8;
  const careScore = Math.round((totalImagesYet / TOTAL_IMAGES_TO_BE_UPLOADED) * 100);

  // Helper functions to save and load latest photo URL
  const saveLatestPhotoUrl = async (photoUrl: string) => {
    try {
      const key = `latestPhoto_${username}`;
      await AsyncStorage.setItem(key, photoUrl);
      console.log('Latest photo URL saved locally:', photoUrl);
    } catch (error) {
      console.error('Error saving latest photo URL:', error);
    }
  };

  const loadLatestPhotoUrl = async () => {
    try {
      const key = `latestPhoto_${username}`;
      const savedPhotoUrl = await AsyncStorage.getItem(key);
      if (savedPhotoUrl) {
        console.log('Latest photo URL loaded from local storage:', savedPhotoUrl);
        setLatestPhotoUri(savedPhotoUrl);
      }
    } catch (error) {
      console.error('Error loading latest photo URL:', error);
    }
  };

  useEffect(() => {
    console.log("Route params received in FamilyDashboard:", route?.params);
    console.log("Aanganwadi code in dashboard:", route?.params?.aanganwadi_code);
    
    // NEW: Capture prediction results from route params if they exist
    if (route?.params?.uploadedPredictionMessage) {
      setAiPredictionStatus(route.params.uploadedPredictionMessage);
      // Safely assign, converting 'undefined' to 'null' for the state variables
      setAiIsMoringa(route.params.uploadedIsMoringa === undefined ? null : route.params.uploadedIsMoringa);
      setAiConfidence(route.params.uploadedConfidence === undefined ? null : route.params.uploadedConfidence);
      // Clear these params after using them to avoid stale data on subsequent visits
      navigation.setParams({
        uploadedPredictionMessage: undefined,
        uploadedIsMoringa: undefined,
        uploadedConfidence: undefined
      });
    }
    
    const fetchFamilyData = async () => {
      try {
        const userId = route?.params?.userId;
        if (userId) {
          console.log('Fetching family data for user ID:', userId);
          const data: FamilyData = await apiService.getFamilyByUserId(userId);
          setFamilyData(data);
          setTotalImagesYet(data.totalImagesYet || 0);
          setPlantData(prev => ({
            ...prev,
            photoCount: data.totalImagesYet || 0,
          }));
          
          // First try to load from server
          if (data.plant_photo) {
            const serverPhotoUrl = `${API_BASE_URL}/uploads/${data.plant_photo}`;
            setLatestPhotoUri(serverPhotoUrl);
            // Save to local storage for persistence
            await saveLatestPhotoUrl(serverPhotoUrl);
          } else {
            // If no server photo, try to load from local storage
            await loadLatestPhotoUrl();
          }
          
          console.log('Family data fetched:', data);
        } else {
          console.warn('FamilyDashboard received without userId in route.params.');
          Alert.alert('त्रुटि', 'उपयोगकर्ता की जानकारी उपलब्ध नहीं है। कृपया पुनः लॉग इन करें।');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
        // If server fetch fails, try to load from local storage
        await loadLatestPhotoUrl();
        Alert.alert('त्रुटि', 'परिवार की जानकारी लोड नहीं हो पाई।');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
 }, [route?.params?.userId, navigation, route?.params?.uploadedPredictionMessage, route?.params?.uploadedIsMoringa, route?.params?.uploadedConfidence]); // Added new route params to dependencies

  const handleUploadPhoto = () => {
    navigation.navigate('UploadPhoto', {
      username: username,
      name: name,
      onPhotoUpload: async (
        uploadedImageUri: string, 
        predictionMessage?: string, 
        isMoringa?: boolean | null, 
        confidence?: number | null
      ) => {
        // IMMEDIATELY show the uploaded photo
        setLatestPhotoUri(uploadedImageUri);
        await saveLatestPhotoUrl(uploadedImageUri);
        
        // Update local state with the new total image count
        setTotalImagesYet(prev => prev + 1);
        setPlantData(prev => ({
          ...prev,
          photoCount: prev.photoCount + 1,
        }));
        
        // Store the AI prediction results separately
        setAiPredictionStatus(predictionMessage || null);
        setAiIsMoringa(isMoringa === undefined ? null : isMoringa);
        setAiConfidence(confidence === undefined ? null : confidence);

        // Photo stays as uploaded - no API fetch needed
        // The uploaded photo URI will persist until next upload
      }
    });
  };

  // Calculate plant age dynamically
  const calculatePlantAge = () => {
    const now = new Date();
    const startDate = plantData.plantStartDate;
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} दिन`;
  };

  // Update plant age every day
  useEffect(() => {
    const updatePlantAge = () => {
      setPlantData(prev => ({
        ...prev,
        plantAge: calculatePlantAge()
      }));
    };

    // Update immediately
    updatePlantAge();

    // Update every day at midnight
    const interval = setInterval(updatePlantAge, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [plantData.plantStartDate]);

  const handleWaterPlant = () => {
    setWaterCompleted(true);
    setPlantData(prev => ({
      ...prev,
      lastWatered: 'अभी, ' + new Date().toLocaleTimeString('hi-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      nextWatering: 'कल, सुबह 8:00'
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>जानकारी लोड हो रही है...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>👨‍👩‍👧‍👦</Text>
              </View>
            </View>
            <View style={styles.headerText}>
              <Title style={styles.headerTitle}>मेरा पौधा</Title>
              <View style={styles.familyInfo}>
                <View style={styles.nameAgeRow}>
                  <Text style={styles.familyLabel}>नाम: {name || familyData?.childName || 'लोड हो रहा है...'}</Text>
                  {route?.params?.age && <Text style={styles.familyAge}> (उम्र: {route.params.age} वर्ष)</Text>}
                </View>
                <Text style={styles.familyLabel}>माता: {route?.params?.motherName || familyData?.motherName || 'लोड हो रहा है...'}</Text>
                <Text style={styles.familyLabel}>पिता: {route?.params?.fatherName || familyData?.fatherName || 'लोड हो रहा है...'}</Text>
                <Text style={styles.familyLabel}>आंगनबाड़ी कोड: {route?.params?.aanganwadi_code || familyData?.anganwadiCode || 'लोड हो रहा है...'}</Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Plant Status Card */}
        <Surface style={styles.plantCard}>
          <View style={styles.plantHeader}>
            <View style={styles.plantIcon}>
              <Text style={styles.plantEmoji}>🌱</Text>
            </View>
            <View style={styles.plantInfo}>
              <Title style={styles.plantTitle}>
                {name ? `${name} का पौधा` : familyData?.childName ? `${familyData.childName} का पौधा` : plantData.plantName}
              </Title>
              <Text style={styles.plantAge}>{plantData.plantAge}</Text>
            </View>
            <Chip style={styles.healthChip} textStyle={styles.healthChipText}>
              {plantData.healthStatus}
            </Chip>
          </View>
          
          <View style={styles.careProgress}>
            <Text style={styles.progressLabel}>देखभाल स्कोर</Text>
            <ProgressBar 
              progress={Math.min(careScore / 100, 1)} 
              color="#4CAF50" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>{Math.min(careScore, 100)}%</Text>
          </View>

          {/* Display Total Images Yet */}
          <View style={styles.careProgress}>
            <Text style={styles.progressLabel}>अपलोड की गई कुल तस्वीरें</Text>
            <Text style={styles.progressText}>{totalImagesYet}</Text>
          </View>
        </Surface>



        {/* Plant Statistics */}
        <Surface style={styles.statsContainer}>
          <Title style={styles.sectionTitle}>पौधे की स्थिति</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📸</Text>
              <Text style={styles.statNumber}>{totalImagesYet}</Text>
              <Text style={styles.statLabel}>कुल फोटो</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statNumber}>{Math.min(careScore, 100)}%</Text>
              <Text style={styles.statLabel}>देखभाल स्कोर</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🌱</Text>
              <Text style={styles.statNumber}>{plantData.plantAge}</Text>
              <Text style={styles.statLabel}>पौधे की उम्र</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💧</Text>
              <Text style={styles.statNumber}>{waterCompleted ? 'हाँ' : 'नहीं'}</Text>
              <Text style={styles.statLabel}>आज पानी दिया</Text>
            </View>
          </View>
        </Surface>

        {/* Plant Care Schedule */}
        <Surface style={styles.scheduleContainer}>
          <Title style={styles.sectionTitle}>देखभाल कार्यक्रम</Title>
          <View style={styles.scheduleList}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Text style={styles.scheduleEmoji}>💧</Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>पानी देना</Text>
                <Text style={styles.scheduleTime}>{plantData.nextWatering}</Text>
                <Text style={styles.scheduleStatus}>अंतिम: {plantData.lastWatered}</Text>
              </View>
              <Button 
                mode="contained" 
                style={styles.scheduleButton}
                buttonColor={waterCompleted ? "#666666" : "#4CAF50"}
                disabled={waterCompleted}
                onPress={handleWaterPlant}
              >
                {waterCompleted ? 'पूर्ण' : 'पूर्ण करें'}
              </Button>
            </View>
            
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Text style={styles.scheduleEmoji}>📸</Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>फोटो अपलोड</Text>
                <Text style={styles.scheduleTime}>साप्ताहिक</Text>
                <Text style={styles.scheduleStatus}>प्रगति ट्रैक करने के लिए</Text>
              </View>
              <Button 
                mode="outlined" 
                style={styles.scheduleButton}
                textColor="#4CAF50"
                onPress={handleUploadPhoto}
              >
                अपलोड करें
              </Button>
            </View>
          </View>
        </Surface>

        {/* Latest Photo - Only show if recently uploaded */}
        {latestPhotoUri && (aiPredictionStatus || route?.params?.uploadedPredictionMessage) && (
          <Surface style={styles.latestPhotoContainer}>
            <Title style={styles.sectionTitle}>नवीनतम फोटो</Title>
            <Image
              source={{ uri: latestPhotoUri }}
              style={styles.latestPhoto}
              resizeMode="cover"
            />
          </Surface>
        )}

        {/* AI Prediction Result */}
        {aiPredictionStatus && (
          <Surface style={styles.aiPredictionContainer}>
            <Title style={styles.sectionTitle}>AI विश्लेषण</Title>
            <View style={styles.aiPredictionBox}>
              <Text style={[
                styles.aiPredictionText,
                aiIsMoringa === true ? styles.aiPredictionMoringa : styles.aiPredictionNotMoringa
              ]}>
                {aiIsMoringa === true ? '✅ यह मोरिंगा पौधा है (AI द्वारा)' : 
                 aiIsMoringa === false ? '❌ यह मोरिंगा पौधा नहीं लगता (AI द्वारा)' :
                 '❗ AI पहचान में त्रुटि हुई'}
              </Text>
              {aiConfidence !== null && (
                <Text style={[
                  styles.aiConfidenceText,
                  aiIsMoringa === true ? styles.aiPredictionMoringa : styles.aiPredictionNotMoringa
                ]}>
                  आत्मविश्वास: {aiConfidence}%
                </Text>
              )}
            </View>
          </Surface>
        )}




        {/* Munga Benefits */}
        <Surface style={styles.nutritionContainer}>
          <Title style={styles.sectionTitle}>मूंगा उगाने के फायदे</Title>
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionEmoji}>🌱</Text>
            <Text style={styles.nutritionTitle}>स्वास्थ्य लाभ</Text>
            <Text style={styles.nutritionDesc}>
              • आयरन की कमी दूर होती है{'\n'}
              • रोग प्रतिरोधक क्षमता बढ़ती है{'\n'}
              • विटामिन A, C और K मिलते हैं{'\n'}
              • एनीमिया से बचाव होता है
            </Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionEmoji}>💰</Text>
            <Text style={styles.nutritionTitle}>आर्थिक लाभ</Text>
            <Text style={styles.nutritionDesc}>
              • घर में ही ताजी सब्जी मिलती है{'\n'}
              • बाजार से खरीदने की जरूरत नहीं{'\n'}
              • पैसे की बचत होती है{'\n'}
              • अतिरिक्त आय का स्रोत
            </Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionEmoji}>🌍</Text>
            <Text style={styles.nutritionTitle}>पर्यावरण लाभ</Text>
            <Text style={styles.nutritionDesc}>
              • हवा शुद्ध होती है{'\n'}
              • मिट्टी की गुणवत्ता बेहतर होती है{'\n'}
              • जैविक खेती को बढ़ावा{'\n'}
              • प्रदूषण कम होता है
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="camera"
        style={styles.fab}
        onPress={handleUploadPhoto}
        color="#FFFFFF"
      />
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    elevation: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoText: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  familyInfo: {
    marginTop: 4,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  familyLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  familyAge: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  plantCard: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  plantIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plantEmoji: {
    fontSize: 24,
  },
  plantInfo: {
    flex: 1,
  },
  plantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  plantAge: {
    fontSize: 12,
    color: '#666666',
  },
  healthChip: {
    backgroundColor: '#E8F5E8',
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
  actionsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Center buttons if they don't fill width
    gap: 12,
  },
  actionButton: {
    flexGrow: 1, // Allow buttons to grow
    minWidth: '45%', // Ensure they take up reasonable space
    borderRadius: 12,
    paddingVertical: 8,
  },
  fullWidthButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  latestPhotoContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center', // Center content horizontally
  },
  latestPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  // NEW STYLES for AI Prediction
  aiPredictionBox: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    width: '95%', // Make it slightly smaller than full width
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPredictionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  aiConfidenceText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  aiPredictionMoringa: {
    color: '#2E7D32', // Green
    borderColor: '#66BB6A', // Lighter green border
    backgroundColor: '#E8F5E8', // Very light green background
  },
  aiPredictionNotMoringa: {
    color: '#D32F2F', // Red
    borderColor: '#EF9A9A', // Lighter red border
    backgroundColor: '#FFEBEE', // Very light red background
  },
  scheduleContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  scheduleList: {
    gap: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CFD8DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleEmoji: {
    fontSize: 20,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scheduleTime: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  scheduleStatus: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  scheduleButton: {
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  guideContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideButton: {
    borderRadius: 8,
    borderColor: '#4CAF50',
  },
  guidePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guidePreviewItem: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  guidePreviewEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  guidePreviewText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  achievementContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  achievementList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  achievementCompleted: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#4CAF50',
  },
  achievementEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666666',
  },
  achievementStatus: {
    fontSize: 18,
    marginLeft: 8,
  },
  timelineContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  timeline: {
    paddingVertical: 10,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -35, // Adjust to align with the line
    marginRight: 15,
    elevation: 2,
  },
  timelineEmoji: {
    fontSize: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    color: '#666666',
  },
  nutritionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20, // Keep some margin for FAB
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  nutritionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  nutritionDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  aiPredictionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
});
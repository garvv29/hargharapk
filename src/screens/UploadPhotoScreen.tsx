import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, Alert, Image } from 'react-native';
import { Card, Button, Surface, Text, TextInput, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// Assuming you have an apiService with an uploadPhoto method.
// You will need to define this in your src/utils/api.ts
import { apiService, API_BASE_URL } from '../utils/api'; 


interface UploadResponse {
  success: boolean;
  message: string;
  photo_url: string;
  total_images_uploaded: number;
  is_moringa: boolean | null; // This is the new field
  confidence: number | null; // This is the new field
}


const { width } = Dimensions.get('window');

interface UploadPhotoScreenProps {
  navigation: any;
  route?: {
    params?: {
      username: string; // Ensure these are always strings
      name: string;     // Ensure these are always strings
      // MODIFIED: onPhotoUpload now accepts prediction message, is_moringa, and confidence
      onPhotoUpload?: (
        uploadedImageUri: string, 
        predictionMessage?: string, 
        isMoringa?: boolean | null, 
        confidence?: number | null
      ) => void;
    };
  };
}

export default function UploadPhotoScreen({ navigation, route }: UploadPhotoScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [plantStage, setPlantStage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Directly access username and name from route.params,
  // assuming they are always passed (as per previous discussion).
  const username = route?.params?.username || '';
  const name = route?.params?.name || '';

  // Request permissions once when component mounts
  useEffect(() => {
    (async () => {
      // Request camera and media library permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'अनुमति आवश्यक', 
          'फोटो लेने और अपलोड करने के लिए कैमरा और गैलरी दोनों की अनुमति आवश्यक है।',
          [{ text: 'ठीक है', onPress: () => navigation.goBack() }] // Go back if permissions not granted
        );
      }
    })();
  }, []); // Run only once on mount

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Remove crop/edit option
      quality: 0.7,       // Slightly reduced quality for faster uploads, still good visuals
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // Remove crop/edit option
      quality: 0.7,       // Slightly reduced quality for faster uploads
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    // Client-side validation:
    if (!selectedImage) {
      Alert.alert('चेतावनी', 'कृपया एक फोटो चुनें।');
      return;
    }
    if (!plantStage) {
      Alert.alert('चेतावनी', 'कृपया पौधे की अवस्था चुनें।');
      return;
    }
    // Ensure username and name are available
    if (!username || !name) {
      console.log('⚠️ User info missing, redirecting to login...');
      // Silent redirect instead of error alert
      navigation.navigate('Login');
      return;
    }

    setLoading(true);

    try {
      // Use the apiService to upload the photo
      // Explicitly cast the response to the defined interface for better type safety
      const responseData: UploadResponse = await apiService.uploadPlantPhoto(
        selectedImage,
        username,
        name,
        plantStage,
        description
      ) as UploadResponse; // <-- The fix is here: type assertion to resolve the error

      console.log('Upload successful:', responseData);

      // MODIFIED: Call the callback function provided by FamilyDashboard 
      // with the prediction message, is_moringa, and confidence
      if (route?.params?.onPhotoUpload) {
        route.params.onPhotoUpload(
          selectedImage, // Pass the local URI
          responseData.message, 
          responseData.is_moringa, 
          responseData.confidence
        ); 
      }
      
      // Clear any image cache in React Native
      // This helps ensure fresh images are loaded
      console.log('🔄 Clearing image cache after upload...');
      
      // Use the message from the backend response directly for the alert
      Alert.alert(
        'सफलता', 
        responseData.message, // Use the dynamic message from backend here!
        [
          {
            text: 'ठीक है',
            onPress: () => {
              // Navigate back and trigger photo refresh
              navigation.goBack();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Check if it's a network error
      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        console.log('⚠️ Network error during upload, photo saved locally');
        Alert.alert('नेटवर्क समस्या', 'फोटो सेव हो गई है। नेटवर्क कनेक्शन बेहतर होने पर यह अपलोड हो जाएगी।', [
          {
            text: 'ठीक है',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'फोटो अपलोड करने में कुछ गलत हो गया। कृपया पुनः प्रयास करें।';
        Alert.alert('त्रुटि', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const plantStages = [
    { label: 'नया पौधा', value: 'new' },
    { label: 'बढ़ रहा है', value: 'growing' },
    { label: 'पत्तियां आ रही हैं', value: 'leaves' },
    { label: 'फूल आ रहे हैं',value: 'flowering' },
    { label: 'फल आ रहे हैं', value: 'fruiting' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <Text variant="titleLarge" style={styles.headerTitle}>पौधे का फोटो अपलोड करें</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>अपने मूंनगा पौधे की तस्वीर अपलोड करें और प्रगति ट्रैक करें</Text>
        </Surface>

        {/* Photo Selection */}
        <Surface style={styles.photoContainer}>
          <Text style={styles.sectionTitle}>फोटो चुनें</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="contain" />
              
              <Button 
                mode="outlined" 
                onPress={() => {
                  setSelectedImage(null);
                }}
                style={styles.changeButton}
                textColor="#4CAF50"
              >
                फोटो बदलें
              </Button>
            </View>
          ) : (
            <View style={styles.photoOptions}>
              <Button 
                mode="contained" 
                icon="camera"
                style={styles.photoButton}
                buttonColor="#4CAF50"
                onPress={takePhoto}
              >
                कैमरा से फोटो लें
              </Button>
              <Button 
                mode="outlined" 
                icon="image"
                style={styles.photoButton}
                textColor="#4CAF50"
                onPress={pickImage}
              >
                गैलरी से फोटो चुनें
              </Button>
            </View>
          )}
        </Surface>

        {/* Plant Stage Selection */}
        <Surface style={styles.stageContainer}>
          <Text style={styles.sectionTitle}>पौधे की अवस्था</Text>
          <Text style={styles.sectionDesc}>
            अपने पौधे की वर्तमान अवस्था चुनें
          </Text>
          
          <View style={styles.stageGrid}>
            {plantStages.map((stage) => (
              <Chip
                key={stage.value}
                selected={plantStage === stage.value}
                onPress={() => setPlantStage(stage.value)}
                style={[
                  styles.stageChip,
                  plantStage === stage.value && styles.selectedChip
                ]}
                textStyle={[
                  styles.stageText,
                  plantStage === stage.value && styles.selectedStageText
                ]}
              >
                {stage.label}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Description */}
        <Surface style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>विवरण (वैकल्पिक)</Text>
          <Text style={styles.sectionDesc}>
            अपने पौधे के बारे में कुछ जानकारी साझा करें
          </Text>
          
          <TextInput
            label="पौधे के बारे में लिखें..."
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
            outlineColor="#E0E0E0"
            activeOutlineColor="#4CAF50"
            theme={{ colors: { primary: '#4CAF50' } }}
          />
        </Surface>

        {/* Upload Button */}
        <Surface style={styles.uploadContainer}>
          <Button 
            mode="contained" 
            icon="upload"
            style={styles.uploadButton}
            buttonColor="#2E7D32"
            loading={loading}
            // Button is only disabled if loading, no image selected, or no plant stage selected
            disabled={loading || !selectedImage || !plantStage}
            onPress={handleUpload}
          >
            {loading ? 'अपलोड हो रहा है...' : 'फोटो अपलोड करें'}
          </Button>
          
          <Text style={styles.uploadNote}>
            फोटो अपलोड करने के बाद आपकी प्रगति अपडेट हो जाएगी
          </Text>
        </Surface>

        {/* Tips */}
        <Surface style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>फोटो लेने के टिप्स</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>📸</Text>
              <Text style={styles.tipText}>अच्छी रोशनी में फोटो लें</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🌱</Text>
              <Text style={styles.tipText}>पौधे को केंद्र में रखें</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>📏</Text>
              <Text style={styles.tipText}>पौधे की ऊंचाई दिखाएं</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🍃</Text>
              <Text style={styles.tipText}>पत्तियों की स्थिति दिखाएं</Text>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  photoContainer: {
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
  photoOptions: {
    gap: 12,
  },
  photoButton: {
    borderRadius: 12,
    marginBottom: 8,
  },
  imagePreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  selectedImage: {
    width: '100%', // Take full width of its container
    height: 200,   // Fixed height for preview
    borderRadius: 8,
    marginBottom: 15,
  },
  previewText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 12,
  },
  changeButton: {
    borderRadius: 8,
  },
  aiCheckButton: {
    borderRadius: 8,
    marginBottom: 15,
  },
  aiButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 15,
  },
  skipAiButton: {
    borderRadius: 8,
    borderColor: '#4CAF50',
  },
  aiResultContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  aiSuccessContainer: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  aiErrorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  aiResultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  aiSuccessText: {
    color: '#2E7D32',
  },
  aiErrorText: {
    color: '#C62828',
  },
  aiConfidenceText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  aiMessageText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stageContainer: {
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
  sectionDesc: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageChip: {
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedChip: {
    backgroundColor: '#E8F5E8',
  },
  stageText: {
    color: '#666666',
  },
  selectedStageText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  descriptionContainer: {
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
  descriptionInput: {
    backgroundColor: '#ffffff',
  },
  uploadContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  uploadButton: {
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  uploadNote: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  tipsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
});
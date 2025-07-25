import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, Alert, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Appbar, Card, Title, Button, Surface, Text, Snackbar, IconButton, Modal, Portal, Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 5x2 grid with proper spacing

// Storage key for persisting photos
const STORAGE_KEY = 'plant_photos_storage';

// Custom theme to prevent color conflicts in APK
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50',
    primaryContainer: '#E8F5E8',
    secondary: '#2E7D32',
    secondaryContainer: '#C8E6C9',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    outline: '#E0E0E0',
    onSurface: '#1a1a1a',
    onSurfaceVariant: '#666666',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
};

interface PlantOptionsScreenProps {
  navigation: any;
}

interface PlantOption {
  id: number;
  name: string;
  hindiName: string;
  emoji: string;
  description: string;
}

const plantOptions: PlantOption[] = [
  { id: 1, name: 'Munga 1', hindiName: 'मुंगा 1', emoji: '🌱', description: 'मुंगा किस्म 1' },
  { id: 2, name: 'Munga 2', hindiName: 'मुंगा 2', emoji: '🌱', description: 'मुंगा किस्म 2' },
  { id: 3, name: 'Munga 3', hindiName: 'मुंगा 3', emoji: '🌱', description: 'मुंगा किस्म 3' },
  { id: 4, name: 'Munga 4', hindiName: 'मुंगा 4', emoji: '🌱', description: 'मुंगा किस्म 4' },
  { id: 5, name: 'Munga 5', hindiName: 'मुंगा 5', emoji: '🌱', description: 'मुंगा किस्म 5' },
  { id: 6, name: 'Munga 6', hindiName: 'मुंगा 6', emoji: '🌱', description: 'मुंगा किस्म 6' },
  { id: 7, name: 'Munga 7', hindiName: 'मुंगा 7', emoji: '🌱', description: 'मुंगा किस्म 7' },
  { id: 8, name: 'Munga 8', hindiName: 'मुंगा 8', emoji: '🌱', description: 'मुंगा किस्म 8' },
  { id: 9, name: 'Munga 9', hindiName: 'मुंगा 9', emoji: '🌱', description: 'मुंगा किस्म 9' },
  { id: 10, name: 'Munga 10', hindiName: 'मुंगा 10', emoji: '🌱', description: 'मुंगा किस्म 10' },
];

export default function PlantOptionsScreen({ navigation }: PlantOptionsScreenProps) {
  const [uploadedImages, setUploadedImages] = useState<{[key: number]: string}>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);

  // Load saved photos from AsyncStorage when component mounts
  // This useEffect ensures that when the app starts or this screen is opened,
  // it checks AsyncStorage for any previously saved photos and displays them.
  useEffect(() => {
    loadSavedPhotos();
  }, []);

  const loadSavedPhotos = async () => {
    try {
      // Attempt to retrieve the saved photos string from AsyncStorage
      const savedPhotos = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPhotos) {
        // If data exists, parse the JSON string back into an object
        const parsedPhotos = JSON.parse(savedPhotos);
        console.log('📷 Loaded saved photos:', parsedPhotos);
        // Update the state with the loaded photos, which will trigger a re-render
        setUploadedImages(parsedPhotos);
      }
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const savePhotosToStorage = async (newPhotos: {[key: number]: string}) => {
    try {
      // Convert the current photos object to a JSON string and save it to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
      console.log('💾 Photos saved to storage:', newPhotos);
    } catch (error) {
      console.error('Error saving photos to storage:', error);
    }
  };

  const pickImage = async (plantId: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = {
          ...uploadedImages,
          [plantId]: result.assets[0].uri
        };
        setUploadedImages(newPhotos);
        // After updating the state, immediately save the new state to storage
        await savePhotosToStorage(newPhotos); 
        
        setSnackbarMessage('फोटो सफलतापूर्वक अपलोड हुई!');
        setSnackbarVisible(true);
      }
    } catch (error) {
      Alert.alert('त्रुटि', 'फोटो अपलोड करने में समस्या हुई।');
    }
  };

  const takePhoto = async (plantId: number) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = {
          ...uploadedImages,
          [plantId]: result.assets[0].uri
        };
        setUploadedImages(newPhotos);
        // After updating the state, immediately save the new state to storage
        await savePhotosToStorage(newPhotos); 
        
        setSnackbarMessage('फोटो सफलतापूर्वक अपलोड हुई!');
        setSnackbarVisible(true);
      }
    } catch (error) {
      Alert.alert('त्रुटि', 'फोटो लेने में समस्या हुई।');
    }
  };

  const showImageOptions = (plantId: number) => {
    Alert.alert(
      'फोटो चुनें',
      'आप कैसे फोटो अपलोड करना चाहते हैं?',
      [
        { text: 'कैमरा', onPress: () => takePhoto(plantId) },
        { text: 'गैलरी', onPress: () => pickImage(plantId) },
        { text: 'रद्द करें', style: 'cancel' },
      ]
    );
  };

  const viewPhoto = (plantId: number) => {
    setSelectedPlantId(plantId);
    setModalVisible(true);
  };

  const renderPlantCard = (plant: PlantOption, index: number) => (
    <Card key={plant.id} style={[styles.plantCard, { width: cardWidth }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.plantHeader}>
          <Text style={styles.plantEmoji}>{plant.emoji}</Text>
          <Text style={styles.plantName}>{plant.hindiName}</Text>
        </View>
        
        <Text style={styles.plantDescription}>{plant.description}</Text>
        
        {uploadedImages[plant.id] ? (
          <View style={styles.uploadedImageContainer}>
            <Text style={styles.uploadedLabel}>अपलोड की गई फोटो:</Text>
            <TouchableOpacity onPress={() => viewPhoto(plant.id)} activeOpacity={0.8}>
              <Image
                source={{ uri: uploadedImages[plant.id] }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View style={styles.photoActions}>
              <IconButton
                icon="eye"
                size={16}
                onPress={() => viewPhoto(plant.id)}
                style={styles.actionButton}
                iconColor="#2196F3"
                mode="contained-tonal"
              />
              <IconButton
                icon="camera"
                size={16}
                onPress={() => showImageOptions(plant.id)}
                style={styles.actionButton}
                iconColor="#4CAF50"
                mode="contained-tonal"
              />
            </View>
          </View>
        ) : (
          <View style={styles.noPhotoContainer}>
            <Text style={styles.noPhotoText}>फोटो नहीं है</Text>
          </View>
        )}
        
        <Button
          mode="contained"
          icon="camera"
          style={styles.uploadButton}
          buttonColor={uploadedImages[plant.id] ? "#4CAF50" : "#2E7D32"}
          textColor="#FFFFFF"
          labelStyle={styles.buttonLabel}
          onPress={() => showImageOptions(plant.id)}
        >
          {uploadedImages[plant.id] ? 'फोटो बदलें' : 'अपलोड करें'}
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider theme={customTheme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#2E7D32" 
        translucent={false}
      />
      <View style={styles.container}>
        <LinearGradient
          colors={['#2E7D32', '#4CAF50', '#66BB6A']}
          style={styles.backgroundGradient}
        />
        
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#FFFFFF" />
          <Appbar.Content title="हमारे पौधे" titleStyle={styles.headerTitle} />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Surface style={styles.titleContainer} elevation={4}>
            <Title style={styles.pageTitle}>हमारे पौधे</Title>
            <Text style={styles.subtitle}>नीचे दिए गए पौधों में से चुनें और फोटो अपलोड करें</Text>
          </Surface>

          <View style={styles.plantsGrid}>
            {plantOptions.map((plant, index) => renderPlantCard(plant, index))}
          </View>
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
          theme={customTheme}
        >
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </Snackbar>

        {/* Photo View Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContent}
          >
            {selectedPlantId && uploadedImages[selectedPlantId] && (
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {plantOptions.find(p => p.id === selectedPlantId)?.hindiName} की फोटो
                  </Text>
                  <IconButton
                    icon="close"
                    onPress={() => setModalVisible(false)}
                    iconColor="#333"
                    style={styles.closeButton}
                  />
                </View>
                
                <Image
                  source={{ uri: uploadedImages[selectedPlantId] }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    icon="camera"
                    style={styles.modalButton}
                    labelStyle={styles.modalButtonText}
                    onPress={() => {
                      setModalVisible(false);
                      showImageOptions(selectedPlantId);
                    }}
                  >
                    फोटो बदलें
                  </Button>
                </View>
              </View>
            )}
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
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
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  plantCard: {
    marginBottom: 15,
    elevation: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  plantHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  plantEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 20,
  },
  plantDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  uploadedImageContainer: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  uploadedLabel: {
    fontSize: 11,
    color: '#4CAF50',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  uploadedImageBox: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  uploadButton: {
    width: '100%',
    borderRadius: 8,
    elevation: 2,
  },
  snackbar: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Photo preview and modal styles
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    elevation: 2,
  },
  noPhotoContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noPhotoText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modal styles
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
  },
  modalContainer: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  fullImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    minWidth: 150,
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
});
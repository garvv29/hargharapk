import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/api';

interface AddFamilyScreenProps {
  navigation: any;
}

export default function AddFamilyScreen({ navigation }: AddFamilyScreenProps) {
  const [formData, setFormData] = useState({
    childName: '',
    gender: 'लड़का' as 'लड़का' | 'लड़की',
    dateOfBirth: '',
    age: '',
    weight: '',
    height: '',
    anganwadiCenterName: 'सरस्वती आंगनबाड़ी केंद्र',
    anganwadiCode: 'AWC-123-DLH', // Keep this as string for parsing
    motherName: '',
    fatherName: '',
    mobileNumber: '', // This will be the username
    village: '',
    ward: '',
    panchayat: '',
    district: '',
    distributionDate: '', // Not used in backend register
    workerName: '', // Mapped to guardian_name
    workerCode: 'AWW-123', // Not used in backend register
    block: '',
    registrationDate: new Date().toLocaleDateString('hi-IN'), // Not used in backend register
  });

  const [photos, setPhotos] = useState({
    plantPhoto: null as string | null, // This will now store the URI, not base64
    pledgePhoto: null as string | null, // This will now store the URI, not base64
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Add validation function
  const isFormValid = () => {
    return (
      formData.childName.trim() !== '' &&
      formData.dateOfBirth.trim() !== '' &&
      formData.age.trim() !== '' &&
      formData.weight.trim() !== '' &&
      formData.height.trim() !== '' &&
      formData.motherName.trim() !== '' &&
      formData.fatherName.trim() !== '' &&
      formData.mobileNumber.trim() !== '' &&
      formData.anganwadiCode.trim() !== '' &&
      formData.village.trim() !== '' &&
      formData.district.trim() !== '' &&
      formData.block.trim() !== '' &&
      photos.plantPhoto !== null &&
      photos.pledgePhoto !== null
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // MODIFIED pickImage & pickFromGallery to store URI, not base64
  const pickImage = async (photoType: 'plantPhoto' | 'pledgePhoto') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('अनुमति आवश्यक', 'कैमरा का उपयोग करने के लिए अनुमति दें');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Remove crop functionality
      quality: 1,
      // base64: true, // NO LONGER NEED BASE64 HERE
    });
    if (!result.canceled) {
      setPhotos(prev => ({ ...prev, [photoType]: result.assets[0].uri })); // Store URI
    }
  };

  const pickFromGallery = async (photoType: 'plantPhoto' | 'pledgePhoto') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('अनुमति आवश्यक', 'गैलरी का उपयोग करने के लिए अनुमति दें');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Remove crop functionality
      quality: 1,
      // base64: true, // NO LONGER NEED BASE64 HERE
    });
    if (!result.canceled) {
      setPhotos(prev => ({ ...prev, [photoType]: result.assets[0].uri })); // Store URI
    }
  };

  const showImageOptions = (photoType: 'plantPhoto' | 'pledgePhoto', title: string) => {
    Alert.alert(
      'फोटो चुनें',
      'फोटो कैसे लेना चाहते हैं?',
      [
        {
          text: '📷 कैमरा',
          onPress: () => pickImage(photoType),
        },
        {
          text: '🖼️ गैलरी',
          onPress: () => pickFromGallery(photoType),
        },
        {
          text: 'रद्द करें',
          style: 'cancel',
        },
      ]
    );
  };

  const formatDateToYYYYMMDD = (dateString: string) => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const confirmRegistration = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      const data = new FormData(); // Create FormData object

      // Append text fields
      data.append('username', formData.mobileNumber?.toUpperCase() || '');
      data.append('name', formData.childName);
      data.append('password', 'hgm@2025'); // Still using hardcoded password - remember my warnings!
      data.append('guardian_name', formData.workerName);
      data.append('father_name', formData.fatherName);
      data.append('mother_name', formData.motherName);
      data.append('age', formData.age); // Send as string, backend will parse int
      data.append('dob', formatDateToYYYYMMDD(formData.dateOfBirth));
      data.append('aanganwadi_code', String(parseInt(formData.anganwadiCode?.match(/\d+/)?.[0] || '0'))); // Parse and send as string
      data.append('weight', formData.weight); // Send as string, backend will parse float
      data.append('height', formData.height); // Send as string, backend will parse float
      data.append('health_status', 'healthy');

      // Address parts - append separately or as concatenated string
      // If you want backend to combine, append individually.
      // If backend expects combined 'address' field, combine here.
      // Backend expects 'address' as one field, so combine on frontend.
      const address = `${formData.village}, ${formData.ward}, ${formData.panchayat}, ${formData.district}, ${formData.block}`;
      data.append('address', address);
      data.append('village', formData.village); // Include these too if backend needs them separately later
      data.append('ward', formData.ward);
      data.append('panchayat', formData.panchayat);
      data.append('district', formData.district);
      data.append('block', formData.block);

      // Append image files
      if (photos.plantPhoto) {
        data.append('plant_photo', {
          uri: photos.plantPhoto,
          name: 'plant_photo.jpg', // You might want a more dynamic name or rely on backend to generate
          type: 'image/jpeg', // Adjust type if you allow other formats
        } as any); // Use 'as any' for now, or define a proper type for Blob/File
      }

      if (photos.pledgePhoto) {
        data.append('pledge_photo', {
          uri: photos.pledgePhoto,
          name: 'pledge_photo.jpg',
          type: 'image/jpeg',
        } as any);
      }

      console.log('Sending FormData:', data); // Console log FormData is tricky, will show as [object FormData]

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        // No 'Content-Type' header needed here, fetch sets it automatically for FormData
        body: data, // Send the FormData object directly
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        Alert.alert('सफलता!', 'बच्चे का पंजीकरण सफलतापूर्वक हो गया।', [
                      { 
              text: 'ठीक है', 
              onPress: () => {
                // Clear the saved family IDs to force refresh of notifications
                AsyncStorage.removeItem('saved_family_ids');
                navigation.goBack();
              }
            },
        ]);
      } else {
        Alert.alert('त्रुटि', result.message || 'पंजीकरण असफल रहा');
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Show a gentler message for network errors
      console.log('⚠️ Network error during registration, data may be saved locally');
      Alert.alert('नेटवर्क समस्या', 'डेटा सेव हो गया है। नेटवर्क कनेक्शन बेहतर होने पर यह अपलोड हो जाएगा।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>नया परिवार पंजीकरण</Text>
      </View>

      {/* बच्चे की जानकारी */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>बच्चे की जानकारी</Text>
        
        <Text style={styles.label}>बच्चे का नाम</Text>
        <TextInput 
          value={formData.childName} 
          onChangeText={(v) => handleInputChange('childName', v)} 
          style={styles.input}
          placeholder="बच्चे का नाम दर्ज करें"
        />

        <Text style={styles.label}>जन्म तिथि (dd/mm/yyyy)</Text>
        <TextInput 
          value={formData.dateOfBirth} 
          onChangeText={(v) => handleInputChange('dateOfBirth', v)} 
          style={styles.input}
          placeholder="जन्म तिथि दर्ज करें"
        />

        <Text style={styles.label}>आयु</Text>
        <TextInput 
          value={formData.age} 
          onChangeText={(v) => handleInputChange('age', v)} 
          keyboardType="numeric" 
          style={styles.input}
          placeholder="आयु दर्ज करें"
        />

        <Text style={styles.label}>वजन (kg)</Text>
        <TextInput 
          value={formData.weight} 
          onChangeText={(v) => handleInputChange('weight', v)} 
          keyboardType="numeric" 
          style={styles.input}
          placeholder="वजन दर्ज करें"
        />

        <Text style={styles.label}>ऊंचाई (cm)</Text>
        <TextInput 
          value={formData.height} 
          onChangeText={(v) => handleInputChange('height', v)} 
          keyboardType="numeric" 
          style={styles.input}
          placeholder="ऊंचाई दर्ज करें"
        />
      </View>

      {/* माता-पिता की जानकारी */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>माता-पिता की जानकारी</Text>
        
        <Text style={styles.label}>माता का नाम</Text>
        <TextInput 
          value={formData.motherName} 
          onChangeText={(v) => handleInputChange('motherName', v)} 
          style={styles.input}
          placeholder="माता का नाम दर्ज करें"
        />

        <Text style={styles.label}>पिता का नाम</Text>
        <TextInput 
          value={formData.fatherName} 
          onChangeText={(v) => handleInputChange('fatherName', v)} 
          style={styles.input}
          placeholder="पिता का नाम दर्ज करें"
        />

        <Text style={styles.label}>मोबाइल नंबर (ID)</Text>
        <TextInput 
          value={formData.mobileNumber} 
          onChangeText={(v) => handleInputChange('mobileNumber', v)} 
          style={styles.input}
          placeholder="मोबाइल नंबर दर्ज करें"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>आंगनवाड़ी कोड</Text>
        <TextInput 
          value={formData.anganwadiCode} 
          onChangeText={(v) => handleInputChange('anganwadiCode', v)} 
          style={styles.input}
          placeholder="आंगनवाड़ी कोड दर्ज करें"
        />
      </View>

      {/* पता की जानकारी */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>पता की जानकारी</Text>
        
        <Text style={styles.label}>गाँव</Text>
        <TextInput 
          value={formData.village} 
          onChangeText={(v) => handleInputChange('village', v)} 
          style={styles.input}
          placeholder="गाँव का नाम दर्ज करें"
        />

        <Text style={styles.label}>वार्ड</Text>
        <TextInput 
          value={formData.ward} 
          onChangeText={(v) => handleInputChange('ward', v)} 
          style={styles.input}
          placeholder="वार्ड नंबर दर्ज करें"
        />

        <Text style={styles.label}>पंचायत</Text>
        <TextInput 
          value={formData.panchayat} 
          onChangeText={(v) => handleInputChange('panchayat', v)} 
          style={styles.input}
          placeholder="पंचायत का नाम दर्ज करें"
        />

        <Text style={styles.label}>जिला</Text>
        <TextInput 
          value={formData.district} 
          onChangeText={(v) => handleInputChange('district', v)} 
          style={styles.input}
          placeholder="जिला का नाम दर्ज करें"
        />

        <Text style={styles.label}>विकासखंड (Block)</Text>
        <TextInput 
          value={formData.block} 
          onChangeText={(v) => handleInputChange('block', v)} 
          style={styles.input}
          placeholder="विकासखंड का नाम दर्ज करें"
        />
      </View>

      {/* Photo Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>फोटो अपलोड</Text>
        
        <Text style={styles.label}>पौधे की फोटो</Text>
        <View style={styles.uploadBlock}>
          {photos.plantPhoto ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photos.plantPhoto }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.cameraButton} onPress={() => showImageOptions('plantPhoto', 'बच्चे को मुंगे का पेड़ देते हुए फोटो लें')}>
                <Text style={styles.cameraButtonText}>📷 नई फोटो लें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>कोई फोटो नहीं</Text>
              </View>
              <TouchableOpacity style={styles.cameraButton} onPress={() => showImageOptions('plantPhoto', 'बच्चे को मुंगे का पेड़ देते हुए फोटो लें')}>
                <Text style={styles.cameraButtonText}>📷 पौधे की फोटो लें</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>शपथ पत्र की फोटो</Text>
        <View style={styles.uploadBlock}>
          {photos.pledgePhoto ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photos.pledgePhoto }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.cameraButton} onPress={() => showImageOptions('pledgePhoto', 'हस्ताक्षरित शपथ पत्र की फोटो लें')}>
                <Text style={styles.cameraButtonText}>📷 नई फोटो लें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>कोई फोटो नहीं</Text>
              </View>
              <TouchableOpacity style={styles.cameraButton} onPress={() => showImageOptions('pledgePhoto', 'हस्ताक्षरित शपथ पत्र की फोटो लें')}>
                <Text style={styles.cameraButtonText}>📷 शपथ पत्र की फोटो लें</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: isFormValid() ? '#4CAF50' : '#E8F5E8',
              opacity: loading ? 0.8 : 1
            }
          ]}
          onPress={confirmRegistration}
          disabled={loading || !isFormValid()}
        >
          <Text style={[
            styles.submitButtonText,
            { color: isFormValid() ? '#FFFFFF' : '#4CAF50' }
          ]}>
            {loading ? 'पंजीकरण हो रहा है...' : 'पंजीकरण करें'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  uploadBlock: {
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: 220,
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  photoPlaceholder: {
    width: 220,
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#BDBDBD',
    fontSize: 16,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 5,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  submitContainer: {
    margin: 10,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

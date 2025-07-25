import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator, Linking, Image, Platform, Share, PermissionsAndroid } from 'react-native'; // <--- Ensure Image is imported
import { Card, Title, Button, Surface, Text, TextInput, Appbar, Chip, Avatar, IconButton, Modal, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Keyboard } from 'react-native';
import { API_BASE_URL } from '../utils/api';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// Extend FamilyData to include all details needed for the popup
// These fields are expected from the /families/user/{userId} endpoint
interface FullFamilyData {
  id: string;
  username: string; // The username from the DB, often the mobile number
  childName: string; // 'name' from DB
  parentName: string; // 'guardian_name' from DB
  motherName: string; // 'mother_name' from DB
  fatherName: string; // 'father_name' from DB
  mobileNumber: string; // 'mobile' from DB (used for display and call)
  village: string; // 'address' from DB
  age: number;
  dateOfBirth: string; // 'dob' from DB
  weight: number;
  height: number;
  anganwadiCode: number; // 'aanganwadi_code' from DB
  plant_photo?: string; // URL to plant photo
  pledge_photo?: string; // URL to pledge photo - still in interface, but won't be displayed
  totalImagesYet: number;
  health_status: string; // 'health_status' from DB
}

interface SearchFamiliesScreenProps {
  navigation: any;
}

// Initial FamilyData interface (from search results) - updated to include both photos
interface FamilyData {
  id: string;
  childName: string;
  parentName: string;
  mobileNumber: string;
  village: string;
  plantDistributed: boolean;
  plant_photo?: string; // Add photo URL to display in list
  pledge_photo?: string; // Add pledge photo URL
}


const apiService = {
  searchFamilies: async (query: string, signal?: AbortSignal): Promise<FamilyData[]> => {
    // Use backend's /search endpoint
    let url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`;

    console.log("FETCHING URL:", url);

    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("RECEIVED DATA:", data);
      return data as FamilyData[];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('ERROR FETCHING SEARCH RESULTS:', error);
        console.log('⚠️ API error, showing empty results:', error.message);
      }
      return [];
    }
  },
  
  // Updated to use backend's /get_photo POST endpoint - returns both photos
  getPhoto: async (mobile: string, name: string): Promise<{plant_photo: string | null, pledge_photo: string | null}> => {
    let url = `${API_BASE_URL}/get_photo`;

    console.log("FETCHING PHOTO URL:", url);
    console.log("POST data:", { mobile, name });

    try {
      const formData = new FormData();
      formData.append('mobile', mobile);
      formData.append('name', name);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        console.log(`Photo fetch failed with status: ${response.status}`);
        return { plant_photo: null, pledge_photo: null };
      }
      
      const data = await response.json();
      console.log("RECEIVED PHOTO DATA:", data);
      
      // Backend returns array with photo data
      if (Array.isArray(data) && data.length > 0 && data[0]) {
        const photoData = data[0];
        
        let plantPhotoUrl = null;
        let pledgePhotoUrl = null;
        
        if (photoData.plant_photo) {
          plantPhotoUrl = `${API_BASE_URL}/static/${photoData.plant_photo}`;
          console.log('✅ Plant photo URL constructed:', plantPhotoUrl);
        }
        
        if (photoData.pledge_photo) {
          pledgePhotoUrl = `${API_BASE_URL}/static/${photoData.pledge_photo}`;
          console.log('✅ Pledge photo URL constructed:', pledgePhotoUrl);
        }
        
        return { plant_photo: plantPhotoUrl, pledge_photo: pledgePhotoUrl };
      } else {
        console.log('No photos found for this student');
        return { plant_photo: null, pledge_photo: null };
      }
    } catch (error: any) {
      console.error('ERROR FETCHING PHOTO:', error);
      console.log('⚠️ Photo fetch failed:', error.message);
      return { plant_photo: null, pledge_photo: null };
    }
  },

  // Updated family details to match backend endpoint
  getFamilyDetails: async (userId: string): Promise<FullFamilyData | null> => {
    let url = `${API_BASE_URL}/families/user1/${userId}`;

    console.log("FETCHING FULL FAMILY DETAILS URL:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("RECEIVED FULL FAMILY DETAILS DATA:", data);
      return data as FullFamilyData;
    } catch (error: any) {
      console.error('ERROR FETCHING FULL FAMILY DETAILS:', error);
      console.log('⚠️ Family details load failed, will show basic info only:', error.message);
      return null;
    }
  }
};

export default function SearchFamiliesScreen({ navigation }: SearchFamiliesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFamilies, setFilteredFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFamilyDetails, setSelectedFamilyDetails] = useState<FullFamilyData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false); // New loading state for modal
  const [photoCache, setPhotoCache] = useState<{[key: string]: {plant_photo: string | null, pledge_photo: string | null}}>({}); // Cache for photos with timestamp
  const [photoRefreshTrigger, setPhotoRefreshTrigger] = useState(0); // Force photo refresh
  
  // Photo gallery states
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'plant' | 'pledge'>('plant');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);

  // Function to clear photo cache and force refresh
  const refreshPhotos = useCallback(() => {
    setPhotoCache({});
    setPhotoRefreshTrigger(prev => prev + 1);
    console.log('🔄 Photo cache cleared and refresh triggered');
  }, []);

  // Photo view functions
  const viewPhoto = (photoUrl: string, photoType: 'plant' | 'pledge') => {
    setCurrentPhotoUrl(photoUrl);
    setCurrentPhotoType(photoType);
    setPhotoModalVisible(true);
  };

  const downloadPhoto = async (photoUrl: string, photoType: 'plant' | 'pledge') => {
    try {
      setDownloadingPhoto(true);
      console.log('📥 Starting download for:', photoUrl);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access permission is needed to save photos');
        return;
      }
      
      // Create filename with timestamp and proper naming
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
      const fileName = `HarGharMunga_${photoType}_${timestamp}.jpg`;
      
      // Download to app's cache directory first
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(photoUrl, fileUri);
      
      if (downloadResult.status === 200) {
        console.log('✅ Photo downloaded to cache:', fileUri);
        
        // Save to device's photo gallery
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        
        // Create a custom album or use default
        let album = await MediaLibrary.getAlbumAsync('HarGharMunga');
        if (album == null) {
          album = await MediaLibrary.createAlbumAsync('HarGharMunga', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        
        // Clean up cache file
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        
        Alert.alert(
          '✅ डाउनलोड सफल',
          `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो आपकी Gallery में save हो गई!\n\n📁 Album: HarGharMunga\n📱 Gallery app में देख सकते हैं।`,
          [{ text: 'OK', style: 'default' }]
        );
        console.log('✅ Photo saved to gallery successfully');
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        '❌ डाउनलोड Error', 
        `फोटो डाउनलोड करने में समस्या हुई:\n\n${errorMessage}\n\nकृपया फिर से try करें।`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setDownloadingPhoto(false);
    }
  };

  const sharePhoto = async (photoUrl: string, photoType: 'plant' | 'pledge') => {
    try {
      console.log('📤 Starting share for:', photoUrl);
      
      // Download the photo to a temporary location first
      const tempFileName = `share_${photoType}_${Date.now()}.jpg`;
      const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;
      
      console.log('📥 Downloading photo to temp location for sharing...');
      const downloadResult = await FileSystem.downloadAsync(photoUrl, tempFileUri);
      
      if (downloadResult.status === 200) {
        console.log('✅ Photo downloaded to temp location:', tempFileUri);
        
        // Try expo-sharing first (better file sharing)
        if (await Sharing.isAvailableAsync()) {
          console.log('🚀 Using expo-sharing for file sharing...');
          await Sharing.shareAsync(tempFileUri, {
            mimeType: 'image/jpeg',
            dialogTitle: `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो - हर घर मुंगा`,
          });
          console.log('✅ Photo shared successfully via expo-sharing');
        } else {
          // Fallback to React Native Share with file URI
          console.log('🔄 Expo-sharing not available, using React Native Share...');
          
          // For React Native Share, we need to use file:// protocol
          const fileUri = Platform.OS === 'android' ? `file://${tempFileUri}` : tempFileUri;
          
          await Share.share({
            url: fileUri,
            title: `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो - हर घर मुंगा`,
            message: `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो - हर घर मुंगा ऐप से साझा की गई`,
          }, {
            dialogTitle: `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो शेयर करें`,
            subject: `${photoType === 'plant' ? 'पौधे की' : 'प्रतिज्ञा की'} फोटो - हर घर मुंगा`,
          });
          console.log('✅ Photo shared successfully via React Native Share');
        }
        
        // Clean up temp file after a delay
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
            console.log('🗑️ Temp file cleaned up');
          } catch (cleanupError) {
            console.log('⚠️ Could not clean up temp file:', cleanupError);
          }
        }, 5000); // 5 second delay to ensure sharing is complete
        
      } else {
        throw new Error(`Failed to download photo for sharing. Status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('❌ Share error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        '❌ Share Error',
        `फोटो शेयर करने में समस्या हुई:\n\n${errorMessage}\n\nकृपया फिर से try करें।`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Listen for photo upload completion from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // When returning from upload screen, refresh photos
      refreshPhotos();
    });

    return unsubscribe;
  }, [navigation, refreshPhotos]);

  // Load initial data on mount
  useEffect(() => {
    console.log('🚀 SearchFamilies screen mounted, loading initial data...');
    const abortController = new AbortController();
    
    // Always try to fetch from backend API
    fetchFamilies('', abortController.signal); // Load all families initially
    
    return () => abortController.abort();
  }, []);

  // Add focus listener to refresh data when returning from photo upload
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('👁️ Screen focused - refreshing data to show latest photos...');
      const abortController = new AbortController();
      // Refresh data to show any new photos that were uploaded
      fetchFamilies(searchQuery, abortController.signal);
    });

    return unsubscribe;
  }, [navigation, searchQuery]);

  const fetchFamilies = useCallback(async (query: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      console.log('🔍 Searching families for query:', query);
      
      // Try real API only - no fallback data
      const data = await apiService.searchFamilies(query, signal);
      console.log('✅ Real search data received:', data);
      
      // Fetch photos for all students
      console.log('📸 Starting to fetch photos for', data.length, 'students...');
      const familiesWithPhotos = await Promise.all(
        data.map(async (family, index) => {
          try {
            // Check if mobile number and child name are valid before making API call
            if (!family.mobileNumber || family.mobileNumber === 'null' || !family.childName) {
              console.log(`⚠️ [${index + 1}/${data.length}] Skipping ${family.childName} - Missing mobile number or name`);
              console.log(`   Mobile: ${family.mobileNumber}, Name: ${family.childName}`);
              return family; // Return family without photo if data is incomplete
            }

            // Create cache key with refresh trigger to force reload
            const cacheKey = `${family.mobileNumber}_${family.childName}_${photoRefreshTrigger}`;
            
            // Check cache first
            if (photoCache[cacheKey]) {
              console.log(`🎯 [${index + 1}/${data.length}] Using cached photos for: ${family.childName}`);
              const cachedPhotos = photoCache[cacheKey];
              return {
                ...family,
                plant_photo: cachedPhotos.plant_photo || undefined,
                pledge_photo: cachedPhotos.pledge_photo || undefined
              };
            }

            console.log(`🔍 [${index + 1}/${data.length}] Fetching fresh photos for: ${family.childName} (${family.mobileNumber})`);
            const photoData = await apiService.getPhoto(family.mobileNumber, family.childName);
            
            if (photoData.plant_photo || photoData.pledge_photo) {
              console.log(`✅ [${index + 1}/${data.length}] Photos found for ${family.childName}:`, photoData);
              
              // Cache both photos
              setPhotoCache(prev => ({
                ...prev,
                [cacheKey]: photoData
              }));
              
              return {
                ...family,
                plant_photo: photoData.plant_photo || undefined,
                pledge_photo: photoData.pledge_photo || undefined
              };
            } else {
              console.log(`❌ [${index + 1}/${data.length}] No photos found for ${family.childName}`);
              return family;
            }
          } catch (error) {
            console.log(`⚠️ [${index + 1}/${data.length}] Could not fetch photo for ${family.childName}:`, error);
            return family; // Return family without photo if fetch fails
          }
        })
      );
      
      console.log('✅ Families with photos loaded:', familiesWithPhotos);
      
      // Log photo status summary for debugging
      const totalFamilies = familiesWithPhotos.length;
      const withPhotos = familiesWithPhotos.filter(f => f.plant_photo).length;
      const withoutPhotos = totalFamilies - withPhotos;
      const withoutMobile = familiesWithPhotos.filter(f => !f.mobileNumber || f.mobileNumber === 'null').length;
      const withMobileButNoPhoto = familiesWithPhotos.filter(f => f.mobileNumber && f.mobileNumber !== 'null' && !f.plant_photo).length;
      
      console.log('📊 PHOTO STATUS SUMMARY:');
      console.log(`   Total Families: ${totalFamilies}`);
      console.log(`   With Photos: ${withPhotos}`);
      console.log(`   Without Photos: ${withoutPhotos}`);
      console.log(`   No Mobile Number: ${withoutMobile}`);
      console.log(`   Has Mobile but No Photo: ${withMobileButNoPhoto}`);
      console.log('📷 Photo URLs found:');
      familiesWithPhotos.forEach((family, index) => {
        if (family.plant_photo) {
          console.log(`   ${index + 1}. ${family.childName}: ${family.plant_photo}`);
        }
      });
      console.log('📱 Students without mobile numbers:');
      familiesWithPhotos.forEach((family, index) => {
        if (!family.mobileNumber || family.mobileNumber === 'null') {
          console.log(`   ${index + 1}. ${family.childName} (${family.mobileNumber || 'null'})`);
        }
      });
      
      setFilteredFamilies(familiesWithPhotos);
      
    } catch (networkError) {
      console.log('❌ Network request failed, showing empty results:', networkError);
      setFilteredFamilies([]); // Show empty results instead of fallback data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    const DEBOUNCE_DELAY = 500;
    
    const handler = setTimeout(() => {
      // Always fetch data, even with empty query to show all families
      fetchFamilies(searchQuery, signal);
    }, DEBOUNCE_DELAY);
    
    return () => {
      clearTimeout(handler);
      abortController.abort();
    };
  }, [fetchFamilies, searchQuery]);

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
  };

  const triggerSearch = () => {
    Keyboard.dismiss();
  };

  // Modified handleViewDetails to fetch full data and open modal
  const handleViewDetails = async (familyId: string) => {
    console.log('👁️ Opening full details for family ID:', familyId);
    
    // Find the family in current list to get basic info and photo
    const currentFamily = filteredFamilies.find(f => f.id === familyId);
    if (!currentFamily) {
      console.log('❌ Family not found in current list');
      return;
    }

    setDetailsLoading(true);
    setModalVisible(true); // Open modal immediately with loading
    
    try {
      // Try to fetch full details from API
      const details = await apiService.getFamilyDetails(familyId);
      
      if (details) {
        // Use API details but ensure we have the latest photo from current list
        const fullDetails: FullFamilyData = {
          ...details,
          plant_photo: currentFamily.plant_photo || details.plant_photo, // Use latest photo
          age: details.age || 25 // Ensure non-zero age for full details view
        };
        console.log('✅ Full details loaded with photo:', fullDetails.plant_photo);
        setSelectedFamilyDetails(fullDetails);
      } else {
        // Fallback: create full details from current family data
        console.log('⚠️ API failed, using current family data with photo');
        const fallbackDetails: FullFamilyData = {
          id: currentFamily.id,
          username: currentFamily.mobileNumber,
          childName: currentFamily.childName,
          parentName: currentFamily.parentName,
          motherName: '',
          fatherName: '',
          mobileNumber: currentFamily.mobileNumber,
          village: currentFamily.village,
          age: 25, // Non-zero age for full details view
          dateOfBirth: 'उपलब्ध नहीं',
          weight: 0,
          height: 0,
          anganwadiCode: 0,
          plant_photo: currentFamily.plant_photo, // Use current photo
          totalImagesYet: currentFamily.plant_photo ? 1 : 0,
          health_status: 'उपलब्ध नहीं'
        };
        setSelectedFamilyDetails(fallbackDetails);
      }
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
      setModalVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Add this function to handle photo upload success callback
  const handlePhotoUpload = useCallback((username: string, childName: string) => {
    console.log('📸 Opening photo upload for:', { username, childName });
    
    // Close modal first
    setSelectedFamilyDetails(null);
    setModalVisible(false);
    
    // Navigate to upload screen with callback
    navigation.navigate('UploadPhoto', {
      username: username || selectedFamilyDetails?.mobileNumber,
      name: childName,
      onPhotoUpload: (result: any) => {
        console.log('✅ Photo upload completed:', result);
        
        // Update the specific family's photo in the current list
        if (result.success && result.photo_url) {
          console.log('🔄 Updating family photo in current list with new photo:', result.photo_url);
          
          setFilteredFamilies(prevFamilies => 
            prevFamilies.map(family => {
              if (family.mobileNumber === username && family.childName === childName) {
                console.log(`✅ Updated photo for ${childName} (${username}): ${result.photo_url}`);
                return {
                  ...family,
                  plant_photo: result.photo_url
                };
              }
              return family;
            })
          );
          
          // Also update selectedFamilyDetails if it's currently showing this family
          setSelectedFamilyDetails(prevDetails => {
            if (prevDetails && prevDetails.mobileNumber === username && prevDetails.childName === childName) {
              console.log(`✅ Updated modal photo for ${childName}: ${result.photo_url}`);
              return {
                ...prevDetails,
                plant_photo: result.photo_url
              };
            }
            return prevDetails;
          });
        }
        
        // Also refresh the family data to ensure consistency
        console.log('🔄 Refreshing family data after photo upload...');
        const abortController = new AbortController();
        fetchFamilies(searchQuery, abortController.signal);
      }
    });
  }, [navigation, selectedFamilyDetails, searchQuery, fetchFamilies]);

  const handleCallFamily = (mobileNumber: string) => {
    if (!mobileNumber) {
      Alert.alert('त्रुटि', 'मोबाइल नंबर उपलब्ध नहीं है।');
      return;
    }
    Alert.alert('कॉल करें', `${mobileNumber} पर कॉल करना चाहते हैं?`, [
      { text: 'नहीं', style: 'cancel' },
      {
        text: 'हाँ',
        onPress: () => {
          const url = `tel:${mobileNumber}`;
          Linking.canOpenURL(url).then(supported => {
            if (supported) {
              Linking.openURL(url);
            } else {
              Alert.alert('त्रुटि', 'कॉल फ़ंक्शन आपके डिवाइस पर समर्थित नहीं है।');
            }
          });
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />

      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="परिवार खोजें" titleStyle={styles.headerTitle} />
        <Appbar.Action 
          icon="refresh" 
          onPress={() => {
            console.log('🔄 Manual refresh triggered');
            const abortController = new AbortController();
            fetchFamilies(searchQuery, abortController.signal);
          }} 
          color="#FFFFFF" 
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Surface style={styles.searchContainer}>
          <TextInput
            label="परिवार खोजें"
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={triggerSearch}
            mode="outlined"
            style={styles.searchInput}
            placeholder="बच्चे का नाम या मोबाइल नंबर लिखें"
            left={<TextInput.Icon icon="magnify" color="#4CAF50" />}
            right={
              searchQuery ?
                <TextInput.Icon icon="close" onPress={() => { setSearchQuery(''); }} color="#666" />
                :
                <IconButton icon="magnify" size={24} onPress={triggerSearch} />
            }
            outlineColor="#E0E0E0"
            activeOutlineColor="#4CAF50"
            theme={{ colors: { primary: '#4CAF50' } }}
          />
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={triggerSearch}
              style={[styles.searchButton, { flex: 1, marginRight: 8 }]}
              buttonColor="#4CAF50"
              disabled={loading}
              icon="magnify"
            >
              <Text style={{ color: '#FFFFFF' }}>खोजें</Text>
            </Button>
            <Button
              mode="outlined"
              onPress={refreshPhotos}
              style={[styles.refreshButton, { flex: 0.3 }]}
              textColor="#4CAF50"
              disabled={loading}
              icon="refresh"
            >
              <Text style={{ color: '#4CAF50' }}>रिफ्रेश</Text>
            </Button>
          </View>
        </Surface>

        <Surface style={styles.summaryContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={styles.summaryText}>
              <Text>{filteredFamilies.length}</Text> परिवार मिले • <Text>{filteredFamilies.filter(f => f.plant_photo).length}</Text> फोटो के साथ • <Text>{filteredFamilies.filter(f => !f.mobileNumber || f.mobileNumber === 'null').length}</Text> बिना मोबाइल
            </Text>
          )}
        </Surface>

        <Surface style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>परिवार और फोटो लोड हो रहे हैं...</Text>
            </View>
          ) : filteredFamilies.length > 0 ? (
            filteredFamilies.map((family) => (
              <Card key={family.id} style={styles.familyCard}>
                <Card.Content style={styles.familyCardContent}>
                  <View style={styles.familyHeader}>
                    <View style={styles.familyInfo}>
                      {family.plant_photo ? (
                        <View style={styles.photoSection}>
                          <Image
                            source={{ 
                              uri: family.plant_photo,
                              cache: 'reload' // Force fresh load
                            }}
                            style={styles.familyPhoto}
                            onError={(e) => console.log('Family photo loading error:', e.nativeEvent.error)}
                          />
                          <Text style={styles.photoLabel}>
                            {family.plant_photo.includes('plant_') ? 'पौधे की फोटो' : 'प्रतिज्ञा फोटो'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.noPhotoSection}>
                          <Avatar.Text
                            size={50}
                            label={family.childName.charAt(0)}
                            style={{ backgroundColor: '#4CAF50' }}
                          />
                          <Text style={styles.noPhotoLabel}>
                            {!family.mobileNumber || family.mobileNumber === 'null' ? 'मोबाइल नंबर नहीं' : 'फोटो नहीं'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.familyDetails}>
                        <Text style={styles.childName}>{family.childName}</Text>
                        <Text style={styles.parentName}>माता/पिता: <Text>{family.parentName}</Text></Text>
                        <Text style={styles.village}>गाँव: <Text>{family.village}</Text></Text>
                        <Text style={styles.mobileNumberDisplay}>
                          मोबाइल: <Text>{family.mobileNumber && family.mobileNumber !== 'null' ? family.mobileNumber : 'उपलब्ध नहीं'}</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.familyActions}>
                      <IconButton
                        icon="phone"
                        size={20}
                        onPress={() => {
                          if (family.mobileNumber && family.mobileNumber !== 'null') {
                            handleCallFamily(family.mobileNumber);
                          } else {
                            Alert.alert('जानकारी', 'इस परिवार का मोबाइल नंबर उपलब्ध नहीं है।');
                          }
                        }}
                        style={[styles.actionIcon, (!family.mobileNumber || family.mobileNumber === 'null') && { opacity: 0.5 }]}
                        iconColor={(!family.mobileNumber || family.mobileNumber === 'null') ? "#999" : "#4CAF50"}
                      />
                      <IconButton
                        icon="camera"
                        size={20}
                        onPress={() => {
                          if (!family.mobileNumber || family.mobileNumber === 'null') {
                            Alert.alert('जानकारी', 'इस छात्र का मोबाइल नंबर उपलब्ध नहीं है। फोटो upload करने के लिए मोबाइल नंबर आवश्यक है।');
                            return;
                          }
                          // Direct navigation to upload screen
                          handlePhotoUpload(family.mobileNumber, family.childName);
                        }}
                        style={[styles.actionIcon, (!family.mobileNumber || family.mobileNumber === 'null') && { opacity: 0.5 }]}
                        iconColor={(!family.mobileNumber || family.mobileNumber === 'null') ? "#999" : "#FF9800"}
                      />
                      <IconButton
                        icon="eye"
                        size={20}
                        onPress={() => handleViewDetails(family.id)} // This will now trigger the modal
                        style={styles.actionIcon}
                        iconColor="#2196F3"
                      />
                    </View>
                  </View>

                  <View style={styles.familyFooter}>
                    <View style={styles.statusInfo}>
                      {/* Plant distribution status removed as requested */}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>कोई परिवार नहीं मिला</Text>
              <Text style={styles.emptyStateMessage}>
                कृपया अलग शब्दों से खोजें
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery('');
                }}
                style={styles.resetButton}
                textColor="#4CAF50"
              >
                <Text>रीसेट करें</Text>
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>

      {/* Full Details Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          {detailsLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>फोटो लोड हो रही है...</Text>
            </View>
          ) : selectedFamilyDetails ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Title style={styles.modalTitle}>
                {selectedFamilyDetails.childName} - पौधे की फोटो
              </Title>
              
              {/* Only show basic info when accessed via camera button */}
              {selectedFamilyDetails.age === 0 ? (
                // Camera button access - show only photo section
                <View>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>बच्चे का नाम:</Text> <Text>{selectedFamilyDetails.childName}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>मोबाइल नंबर:</Text> <Text>{selectedFamilyDetails.mobileNumber}</Text>
                  </Text>
                  
                  {/* Plant Photo Section with Upload/View Options */}
                  <View style={styles.plantPhotoSection}>
                    <Text style={styles.sectionHeader}>पौधे की फोटो</Text>
                    {selectedFamilyDetails.plant_photo ? (
                      <View style={styles.photoContainer}>
                        <Card.Cover
                          source={{ 
                            uri: selectedFamilyDetails.plant_photo,
                            cache: 'reload' // Force fresh load
                          }}
                          style={styles.modalImage}
                          onError={(e) => console.log("Card.Cover image loading error:", e.nativeEvent.error)}
                        />
                        <View style={styles.photoActions}>
                          <Button 
                            mode="outlined" 
                            icon="camera" 
                            style={styles.photoButton}
                            textColor="#4CAF50"
                            onPress={() => handlePhotoUpload(selectedFamilyDetails?.mobileNumber || '', selectedFamilyDetails?.childName || '')}
                          >
                            नई फोटो अपलोड करें
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noPhotoContainer}>
                        <Text style={styles.noPhotoText}>पौधे की फोटो उपलब्ध नहीं</Text>
                        <Button 
                          mode="contained" 
                          icon="camera-plus" 
                          style={styles.uploadButton}
                          buttonColor="#4CAF50"
                          onPress={() => handlePhotoUpload(selectedFamilyDetails?.mobileNumber || '', selectedFamilyDetails?.childName || '')}
                        >
                          पहली फोटो अपलोड करें
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                // Eye button access - show full details WITH photo
                <View>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>बच्चे का नाम:</Text> <Text>{selectedFamilyDetails.childName}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>अभिभावक का नाम:</Text> <Text>{selectedFamilyDetails.parentName}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>पिता का नाम:</Text> <Text>{selectedFamilyDetails.fatherName}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>माता का नाम:</Text> <Text>{selectedFamilyDetails.motherName}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>मोबाइल नंबर:</Text> <Text>{selectedFamilyDetails.mobileNumber}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>गांव:</Text> <Text>{selectedFamilyDetails.village}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>आयु:</Text> <Text>{selectedFamilyDetails.age} वर्ष</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>जन्म तिथि:</Text> <Text>{selectedFamilyDetails.dateOfBirth}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>वजन:</Text> <Text>{selectedFamilyDetails.weight} किग्रा</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>ऊंचाई:</Text> <Text>{selectedFamilyDetails.height} सेमी</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>स्वास्थ्य स्थिति:</Text> <Text>{selectedFamilyDetails.health_status}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>आंगनवाड़ी कोड:</Text> <Text>{selectedFamilyDetails.anganwadiCode}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>कुल इमेज अपलोड:</Text> <Text>{selectedFamilyDetails.totalImagesYet}</Text>
                  </Text>

                  {/* Photo View Buttons */}
                  <View style={styles.photoViewSection}>
                    <Text style={styles.sectionHeader}>फोटो देखें</Text>
                    <View style={styles.photoButtonsRow}>
                      <Button
                        mode="outlined"
                        icon="nature"
                        style={styles.photoViewButton}
                        textColor="#4CAF50"
                        onPress={() => {
                          if (selectedFamilyDetails.plant_photo) {
                            viewPhoto(selectedFamilyDetails.plant_photo, 'plant');
                          } else {
                            Alert.alert('जानकारी', 'पौधे की फोटो उपलब्ध नहीं है');
                          }
                        }}
                      >
                        पौधे की फोटो देखें
                      </Button>
                      <Button
                        mode="outlined"
                        icon="hand-heart"
                        style={styles.photoViewButton}
                        textColor="#FF5722"
                        onPress={() => {
                          if (selectedFamilyDetails.pledge_photo) {
                            viewPhoto(selectedFamilyDetails.pledge_photo, 'pledge');
                          } else {
                            Alert.alert('जानकारी', 'प्रतिज्ञा की फोटो उपलब्ध नहीं है');
                          }
                        }}
                      >
                        प्रतिज्ञा की फोटो देखें
                      </Button>
                    </View>
                  </View>

                  {/* Plant Photo Section with Upload/View Options - ALWAYS SHOW */}
                  <View style={styles.plantPhotoSection}>
                    <Text style={styles.sectionHeader}>पौधे की फोटो</Text>
                    {selectedFamilyDetails.plant_photo ? (
                      <View style={styles.photoContainer}>
                        <Card.Cover
                          source={{ 
                            uri: selectedFamilyDetails.plant_photo,
                            cache: 'reload' // Force fresh load
                          }}
                          style={styles.modalImage}
                          onError={(e) => console.log("Card.Cover image loading error:", e.nativeEvent.error)}
                        />
                        <View style={styles.photoActions}>
                          <Button 
                            mode="outlined" 
                            icon="camera" 
                            style={styles.photoButton}
                            textColor="#4CAF50"
                            onPress={() => handlePhotoUpload(selectedFamilyDetails?.mobileNumber || '', selectedFamilyDetails?.childName || '')}
                          >
                            नई फोटो अपलोड करें
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noPhotoContainer}>
                        <Text style={styles.noPhotoText}>पौधे की फोटो उपलब्ध नहीं</Text>
                        <Button 
                          mode="contained" 
                          icon="camera-plus" 
                          style={styles.uploadButton}
                          buttonColor="#4CAF50"
                          onPress={() => handlePhotoUpload(selectedFamilyDetails?.mobileNumber || '', selectedFamilyDetails?.childName || '')}
                        >
                          पहली फोटो अपलोड करें
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={{ color: '#FFFFFF' }}>बंद करें</Text>
              </Button>
            </ScrollView>
          ) : (
            <View style={styles.modalEmpty}>
              <Text style={styles.detailText}>विवरण उपलब्ध नहीं है।</Text>
              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={{ color: '#FFFFFF' }}>बंद करें</Text>
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Photo View Modal */}
      <Portal>
        <Modal
          visible={photoModalVisible}
          onDismiss={() => setPhotoModalVisible(false)}
          contentContainerStyle={styles.photoModalContent}
        >
          <View style={styles.photoModalHeader}>
            <Text style={styles.photoModalTitle}>
              {currentPhotoType === 'plant' ? 'पौधे की फोटो' : 'प्रतिज्ञा की फोटो'}
            </Text>
            <IconButton
              icon="close"
              onPress={() => setPhotoModalVisible(false)}
              iconColor="#333"
            />
          </View>
          
          {currentPhotoUrl && (
            <View style={styles.photoModalBody}>
              <Image
                source={{ uri: currentPhotoUrl, cache: 'reload' }}
                style={styles.fullPhotoImage}
                resizeMode="contain"
              />
              
              <View style={styles.photoModalActions}>
                <Button
                  mode="outlined"
                  icon="download"
                  style={styles.photoModalButton}
                  textColor="#4CAF50"
                  loading={downloadingPhoto}
                  onPress={() => downloadPhoto(currentPhotoUrl, currentPhotoType)}
                >
                  डाउनलोड करें
                </Button>
                <Button
                  mode="outlined"
                  icon="share"
                  style={styles.photoModalButton}
                  textColor="#2196F3"
                  onPress={() => sharePhoto(currentPhotoUrl, currentPhotoType)}
                >
                  शेयर करें
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
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
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  searchButton: {
    borderRadius: 12,
  },
  refreshButton: {
    borderRadius: 12,
    borderColor: '#4CAF50',
  },
  summaryContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  familyCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  familyCardContent: {
    padding: 16,
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  familyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  familyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  parentName: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  village: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  mobileNumberDisplay: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 4,
  },
  familyActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    margin: 0,
  },
  familyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  plantChip: {
    height: 28,
    backgroundColor: '#E8F5E8',
  },
  plantText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  mobileNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resetButton: {
    borderRadius: 12,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  // Modal Specific Styles
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%', // Limit modal height
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2E7D32',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#1a1a1a', // Darker color for labels
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  imageContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  closeButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  // Plant Photo Section Styles
  plantPhotoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoActions: {
    marginTop: 15,
    width: '100%',
  },
  photoButton: {
    borderRadius: 8,
    borderColor: '#4CAF50',
  },
  noPhotoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  noPhotoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  uploadButton: {
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  // New styles for family card photos
  photoSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  familyPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  photoLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  noPhotoSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  noPhotoLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  // Photo View Section Styles
  photoViewSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  photoViewButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
  },
  // Photo Modal Styles
  photoModalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  photoModalBody: {
    padding: 16,
    alignItems: 'center',
  },
  fullPhotoImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginBottom: 20,
  },
  photoModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  photoModalButton: {
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
  },
});
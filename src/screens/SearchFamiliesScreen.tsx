import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator, Linking, Image } from 'react-native'; // <--- Ensure Image is imported
import { Card, Title, Button, Surface, Text, TextInput, Appbar, Chip, Avatar, IconButton, Modal, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Keyboard } from 'react-native';
import { API_BASE_URL } from '../utils/api';

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

// Initial FamilyData interface (from search results) - updated to include photo
interface FamilyData {
  id: string;
  childName: string;
  parentName: string;
  mobileNumber: string;
  village: string;
  plantDistributed: boolean;
  plant_photo?: string; // Add photo URL to display in list
}


const apiService = {
  searchFamilies: async (query: string, signal?: AbortSignal): Promise<FamilyData[]> => {
    // Use the correct endpoint from Flask backend - /search not /families/search
    let url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`;

    console.log("FETCHING URL:", url);

    try {
      // Get stored token for authorization
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('auth_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { 
        method: 'GET',
        headers,
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
        // Network errors will show empty results instead of fallback data
        console.log('⚠️ API error, showing empty results:', error.message);
      }
      return [];
    }
  },
  
  // New function to fetch photo using POST with mobile and name
  getPhoto: async (mobile: string, name: string): Promise<string | null> => {
    let url = `${API_BASE_URL}/get_photo`;

    console.log("FETCHING PHOTO URL:", url);
    console.log("POST data:", { mobile, name });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          mobile: mobile,
          name: name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("RECEIVED PHOTO DATA:", data);
      
      if (data.success && data.photo_url) {
        return data.photo_url;
      } else {
        console.log('No photo found for this student');
        return null;
      }
    } catch (error: any) {
      console.error('ERROR FETCHING PHOTO:', error);
      console.log('⚠️ Photo fetch failed:', error.message);
      return null;
    }
  },

  // New API call to fetch full details for a single family
  getFamilyDetails: async (userId: string): Promise<FullFamilyData | null> => {
    let url = `${API_BASE_URL}/families/user1/${userId}`; // Matches your backend endpoint

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
      // Don't show alert for network errors, just log and return null
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

            console.log(`🔍 [${index + 1}/${data.length}] Fetching photo for: ${family.childName} (${family.mobileNumber})`);
            const photoUrl = await apiService.getPhoto(family.mobileNumber, family.childName);
            
            if (photoUrl) {
              console.log(`✅ [${index + 1}/${data.length}] Photo found for ${family.childName}: ${photoUrl}`);
              return {
                ...family,
                plant_photo: photoUrl || undefined // Convert null to undefined for TypeScript compatibility
              };
            } else {
              console.log(`❌ [${index + 1}/${data.length}] No photo found for ${family.childName}`);
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

  // New function to handle photo fetch for camera button
  const handleFetchPhoto = async (family: FamilyData) => {
    console.log('📷 Fetching photo for:', family.childName, family.mobileNumber);
    setDetailsLoading(true);
    setModalVisible(true); // Open modal immediately
    
    try {
      // Fetch photo using POST API with mobile and name
      const photoUrl = await apiService.getPhoto(family.mobileNumber, family.childName);
      
      if (photoUrl) {
        // Create a minimal family details object with photo
        const familyWithPhoto: FullFamilyData = {
          id: family.id,
          username: family.mobileNumber,
          childName: family.childName,
          parentName: family.parentName,
          motherName: '',
          fatherName: '',
          mobileNumber: family.mobileNumber,
          village: family.village,
          age: 0,
          dateOfBirth: '',
          weight: 0,
          height: 0,
          anganwadiCode: 0,
          plant_photo: photoUrl,
          totalImagesYet: 1,
          health_status: ''
        };
        setSelectedFamilyDetails(familyWithPhoto);
      } else {
        // Create family details without photo
        const familyWithoutPhoto: FullFamilyData = {
          id: family.id,
          username: family.mobileNumber,
          childName: family.childName,
          parentName: family.parentName,
          motherName: '',
          fatherName: '',
          mobileNumber: family.mobileNumber,
          village: family.village,
          age: 0,
          dateOfBirth: '',
          weight: 0,
          height: 0,
          anganwadiCode: 0,
          plant_photo: undefined,
          totalImagesYet: 0,
          health_status: ''
        };
        setSelectedFamilyDetails(familyWithoutPhoto);
      }
    } catch (error) {
      console.error('Error fetching photo:', error);
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
          <Button
            mode="contained"
            onPress={triggerSearch}
            style={styles.searchButton}
            buttonColor="#4CAF50"
            disabled={loading}
            icon="magnify"
          >
            <Text style={{ color: '#FFFFFF' }}>खोजें</Text>
          </Button>
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
                            source={{ uri: family.plant_photo }}
                            style={styles.familyPhoto}
                            onError={(e) => console.log('Family photo loading error:', e.nativeEvent.error)}
                          />
                          <Text style={styles.photoLabel}>पौधे की फोटो</Text>
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
                            Alert.alert('जानकारी', 'इस छात्र का मोबाइल नंबर उपलब्ध नहीं है। फोटो fetch करने के लिए मोबाइल नंबर आवश्यक है।');
                            return;
                          }

                          // If photo already exists, show it directly, otherwise fetch
                          if (family.plant_photo) {
                            // Create photo-focused family details for immediate display
                            const familyWithPhoto: FullFamilyData = {
                              id: family.id,
                              username: family.mobileNumber,
                              childName: family.childName,
                              parentName: family.parentName,
                              motherName: '',
                              fatherName: '',
                              mobileNumber: family.mobileNumber,
                              village: family.village,
                              age: 0, // Indicates camera access
                              dateOfBirth: '',
                              weight: 0,
                              height: 0,
                              anganwadiCode: 0,
                              plant_photo: family.plant_photo,
                              totalImagesYet: 1,
                              health_status: ''
                            };
                            setSelectedFamilyDetails(familyWithPhoto);
                            setModalVisible(true);
                          } else {
                            // Fetch photo if not already loaded
                            handleFetchPhoto(family);
                          }
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
                          source={{ uri: selectedFamilyDetails.plant_photo }}
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

                  {/* Plant Photo Section with Upload/View Options - ALWAYS SHOW */}
                  <View style={styles.plantPhotoSection}>
                    <Text style={styles.sectionHeader}>पौधे की फोटो</Text>
                    {selectedFamilyDetails.plant_photo ? (
                      <View style={styles.photoContainer}>
                        <Card.Cover
                          source={{ uri: selectedFamilyDetails.plant_photo }}
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
  searchButton: {
    marginTop: 10,
    borderRadius: 12,
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
});
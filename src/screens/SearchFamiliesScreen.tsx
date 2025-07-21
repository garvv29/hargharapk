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

// Initial FamilyData interface (from search results) - remains the same for search
interface FamilyData {
  id: string;
  childName: string;
  parentName: string;
  mobileNumber: string;
  village: string;
  plantDistributed: boolean;
}


const apiService = {
  searchFamilies: async (query: string, signal?: AbortSignal): Promise<FamilyData[]> => {
    let url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`;

    console.log("FETCHING URL:", url);

    try {
      const response = await fetch(url, { signal });
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
        Alert.alert('त्रुटि', `खोज परिणाम लोड नहीं हो पाए। (${error.message || 'कृपया पुनः प्रयास करें।'})`);
      }
      return [];
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
      Alert.alert('त्रुटि', `परिवार का विवरण लोड नहीं हो पाया। (${error.message || 'कृपया पुनः प्रयास करें।'})`);
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

  const fetchFamilies = useCallback(async (query: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const data = await apiService.searchFamilies(query, signal);
      setFilteredFamilies(data);
    } catch (error) {
      console.error("Error in fetchFamilies callback:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    const DEBOUNCE_DELAY = 500;
    const handler = setTimeout(() => {
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
    setDetailsLoading(true); // Start loading for modal
    const details = await apiService.getFamilyDetails(familyId);
    setDetailsLoading(false); // Stop loading
    if (details) {
      setSelectedFamilyDetails(details);
      setModalVisible(true);
    } else {
      // Error message is already handled in apiService.getFamilyDetails
    }
  };

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
              <Text>{filteredFamilies.length}</Text> परिवार मिले
            </Text>
          )}
        </Surface>

        <Surface style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>परिवार खोज रहे हैं...</Text>
            </View>
          ) : filteredFamilies.length > 0 ? (
            filteredFamilies.map((family) => (
              <Card key={family.id} style={styles.familyCard}>
                <Card.Content style={styles.familyCardContent}>
                  <View style={styles.familyHeader}>
                    <View style={styles.familyInfo}>
                      <Avatar.Text
                        size={50}
                        label={family.childName.charAt(0)}
                        style={{ backgroundColor: '#4CAF50' }}
                      />
                      <View style={styles.familyDetails}>
                        <Text style={styles.childName}>{family.childName}</Text>
                        <Text style={styles.parentName}>माता/पिता: <Text>{family.parentName}</Text></Text>
                        <Text style={styles.village}>गाँव: <Text>{family.village}</Text></Text>
                        <Text style={styles.mobileNumberDisplay}>मोबाइल: <Text>{family.mobileNumber}</Text></Text>
                      </View>
                    </View>
                    <View style={styles.familyActions}>
                      <IconButton
                        icon="phone"
                        size={20}
                        onPress={() => handleCallFamily(family.mobileNumber)}
                        style={styles.actionIcon}
                        iconColor="#4CAF50"
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
                      {family.plantDistributed && (
                        <Chip
                          style={styles.plantChip}
                          textStyle={styles.plantText}
                          icon="check-circle"
                        >
                          पौधा मिला
                        </Chip>
                      )}
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
              <Text style={styles.loadingText}>विवरण लोड हो रहा है...</Text>
            </View>
          ) : selectedFamilyDetails ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Title style={styles.modalTitle}>परिवार का विवरण</Title>
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

              {/* Only Plant Photo View Section - Keep this as is, it's correct */}
              {selectedFamilyDetails.plant_photo ? ( // Add a check here for plant_photo existence
                <View style={styles.imageContainer}>
                  <Text style={styles.detailLabel}>पौधे की फोटो:</Text>
                  <Card.Cover
                    source={{ uri: selectedFamilyDetails.plant_photo }}
                    style={styles.modalImage}
                    // Adding onError for debugging if it still fails to load
                    onError={(e) => console.log("Card.Cover image loading error:", e.nativeEvent.error)}
                  />
                </View>
              ) : (
                <View style={styles.imageContainer}>
                    <Text style={styles.detailLabel}>पौधे की फोटो:</Text>
                    <Text style={styles.detailText}>उपलब्ध नहीं</Text>
                </View>
              )}
              {/* End Only Plant Photo View Section */}

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
  }
});
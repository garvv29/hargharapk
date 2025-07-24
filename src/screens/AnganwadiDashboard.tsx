import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Text, FAB, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, API_BASE_URL, checkServerConnectivity, getFallbackData } from '../utils/api';

const { width } = Dimensions.get('window');

interface AnganwadiDashboardProps {
  navigation: any;
  route?: {
    params?: {
      userData?: any;
      userId?: string;
      name?: string;
      centerCode?: string;
      centerName?: string;
      district?: string;
      block?: string;
      anganwadiId?: string;
      workerName?: string;
    };
  };
}

export default function AnganwadiDashboard({ navigation, route }: AnganwadiDashboardProps) {
  const [stats, setStats] = useState({
    totalPlants: 0,
    distributedPlants: 0,
    activeFamilies: 0,
  });
  const [centerInfo, setCenterInfo] = useState({
    centerName: route?.params?.userData?.name || route?.params?.name || 'लोड हो रहा है...',
    centerCode: route?.params?.userData?.aanganwaadi_id || route?.params?.centerCode || 'लोड हो रहा है...',
    workerName: route?.params?.userData?.name || route?.params?.workerName || 'लोड हो रहा है...',
    gram: route?.params?.userData?.gram || route?.params?.district || 'लोड हो रहा है...',
    anganwadiCode: route?.params?.userData?.aanganwaadi_id || route?.params?.anganwadiId || 'लोड हो रहा है...',
    supervisorName: route?.params?.userData?.supervisor_name || 'लोड हो रहा है...',
    status: 'सक्रिय'
  });

  // Debug: Log centerInfo changes
  useEffect(() => {
    console.log('🔄 CenterInfo state changed:', centerInfo);
  }, [centerInfo]);
  const [latestStudentName, setLatestStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    timestamp: number;
    type: 'new_student' | 'photo_upload';
  }>>([]);

  // Helper function to save notifications to local storage
  const saveNotifications = async (notifs: typeof notifications) => {
    try {
      await AsyncStorage.setItem('anganwadi_notifications', JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Helper function to load notifications from local storage
  const loadNotifications = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('anganwadi_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out notifications older than 24 hours
        const now = Date.now();
        const validNotifications = parsed.filter((notif: any) => {
          const ageInHours = (now - notif.timestamp) / (1000 * 60 * 60);
          console.log(`Notification age: ${ageInHours.toFixed(2)} hours`);
          return ageInHours < 24;
        });
        
        console.log(`Loaded ${validNotifications.length} valid notifications out of ${parsed.length} total`);
        setNotifications(validNotifications);
        
        // Save back the filtered notifications
        if (validNotifications.length !== parsed.length) {
          await saveNotifications(validNotifications);
          console.log('Removed expired notifications');
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Helper function to add new notification
  const addNotification = useCallback(async (message: string, type: 'new_student' | 'photo_upload') => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
      type
    };
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  }, [notifications]);

  // Fetch center information from external table data or backend
  const fetchCenterInfo = async () => {
    try {
      console.log('🔍 fetchCenterInfo called');
      console.log('📊 Route params:', route?.params);
      
      // First check if we have user data from external table
      if (route?.params?.userData) {
        const userData = route.params.userData;
        console.log('✅ Using external table user data:', userData);
        
        const centerInfoData = {
          centerName: userData.centerName || userData.gram || userData.aanganwadi_code || userData.aanganwaadi_id || 'आंगनबाड़ी केंद्र',
          centerCode: userData.centerCode || userData.aanganwadi_code || userData.aanganwaadi_id || userData.kendra_code || 'AWC-001',
          workerName: userData.workerName || userData.name || 'कार्यकर्ता',
          gram: userData.gram || userData.address || userData.district || 'ग्राम',
          anganwadiCode: userData.aanganwaadi_id || userData.aanganwadi_code || userData.anganwadiId || 'कोड',
          supervisorName: userData.supervisor_name || userData.supervisorName || 'सुपरवाइजर',
          status: 'सक्रिय'
        };
        
        console.log('✅ Setting center info:', centerInfoData);
        setCenterInfo(centerInfoData);
        
        // Save user info to AsyncStorage for future use
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
        return;
      }
      
      // Fallback to saved user info
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('✅ Using saved user data:', user);
        
        setCenterInfo({
          centerName: user.gram || user.aanganwadi_code || 'आंगनबाड़ी केंद्र',
          centerCode: user.aanganwaadi_id ? `AWC-${user.aanganwaadi_id}` : 'AWC-001',
          workerName: user.name || 'कार्यकर्ता',
          gram: user.gram || user.address || 'ग्राम',
          anganwadiCode: user.aanganwaadi_id || 'कोड',
          supervisorName: user.supervisor_name || 'सुपरवाइजर',
          status: 'सक्रिय'
        });
        return;
      }
      
      throw new Error('No user info available');
      
    } catch (error) {
      console.error('Error fetching center info:', error);
      // Fallback to default values on error
      setCenterInfo({
        centerName: 'आंगनबाड़ी केंद्र',
        centerCode: 'AWC-001',
        workerName: 'कार्यकर्ता',
        gram: 'ग्राम',
        anganwadiCode: 'कोड',
        supervisorName: 'सुपरवाइजर',
        status: 'सक्रिय'
      });
    }
  };

  // Fetch latest student data from backend using correct endpoints
  const fetchLatestStudentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check server connectivity
      const isConnected = await checkServerConnectivity();
      if (!isConnected) {
        console.warn('🔴 Server not reachable, using fallback data');
        const fallbackData = getFallbackData();
        setFamilies(fallbackData.families);
        setStats(fallbackData.stats);
        return;
      }
      
      // Use the search endpoint to get all families (this is the working endpoint)
      console.log('Fetching families from /search endpoint...');
      
      const families = await apiService.searchFamilies();
      console.log('✅ Fetched families successfully:', families.length, 'families');
      setFamilies(families);
      
      if (families && families.length > 0) {
        // Calculate stats based on actual data structure
        const totalFamilies = families.length;
        const distributedPlants = families.filter((family: any) => family.plantDistributed === true || family.plant_photo).length;
        const activeFamilies = totalFamilies; // Assume all families are active if no status field
        
        setStats({
          totalPlants: totalFamilies,
          distributedPlants: distributedPlants,
          activeFamilies: activeFamilies,
        });

        // Check for new families by comparing with saved family IDs
        const savedFamilyIds = await AsyncStorage.getItem('saved_family_ids');
        const currentFamilyIds = families.map((f: any) => f.id || f.username).filter(Boolean);
        
        if (savedFamilyIds === null) {
          // First time loading, save the IDs
          await AsyncStorage.setItem('saved_family_ids', JSON.stringify(currentFamilyIds));
        } else {
          try {
            const previousIds = JSON.parse(savedFamilyIds);
            const newFamilyIds = currentFamilyIds.filter((id: string) => !previousIds.includes(id));
            
            if (newFamilyIds.length > 0) {
              // New families have been added
              console.log('New family IDs detected:', newFamilyIds);
              const newFamilies = families.filter((f: any) => newFamilyIds.includes(f.id || f.username));
              console.log('New families found:', newFamilies);
              
              for (const newFamily of newFamilies) {
                const studentName = newFamily.childName || (newFamily as any).name || 'नया छात्र';
                const parentName = newFamily.motherName || newFamily.fatherName || newFamily.parentName || '';
                
                let notificationText = '';
                if (parentName) {
                  notificationText = `नया छात्र पंजीकृत: ${studentName} (${parentName})`;
                } else {
                  notificationText = `नया छात्र पंजीकृत: ${studentName}`;
                }
                
                console.log('Adding notification for:', notificationText);
                await addNotification(notificationText, 'new_student');
              }
            }
            
            // Update the saved IDs
            await AsyncStorage.setItem('saved_family_ids', JSON.stringify(currentFamilyIds));
          } catch (error) {
            console.error('Error processing family IDs:', error);
            // Fallback: save current IDs
            await AsyncStorage.setItem('saved_family_ids', JSON.stringify(currentFamilyIds));
          }
        }
        
        // Set the latest student name for display
        if (families.length > 0 && families[0].childName) {
          setLatestStudentName(families[0].childName);
        }
      } else {
        setStats({
          totalPlants: 0,
          distributedPlants: 0,
          activeFamilies: 0,
        });
      }
    } catch (error: any) {
      console.error('🔴 Error fetching latest family data:', error);
      
      // Use fallback data instead of showing error
      const fallbackData = getFallbackData();
      setFamilies(fallbackData.families);
      setStats(fallbackData.stats);
      
      // Only show user-friendly message, don't crash the app
      console.warn('⚠️  Using offline mode - server data unavailable');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Helper function to format time ago
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'अभी';
    if (minutes < 60) return `${minutes} मिनट पहले`;
    if (hours < 24) return `${hours} घंटे पहले`;
    if (days < 7) return `${days} दिन पहले`;
    return new Date(timestamp).toLocaleDateString('hi-IN');
  };

  // Fetch dashboard statistics from backend
  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats from /search2 endpoint...');
      const stats = await apiService.getDashboardStats();
      setStats({
        totalPlants: stats.totalFamilies,
        distributedPlants: stats.distributedPlants,
        activeFamilies: stats.activeFamilies,
      });
      
      if (stats.latestStudentName) {
        setLatestStudentName(stats.latestStudentName);
      }
      
      console.log('✅ Dashboard stats updated:', stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Continue with family data fetching as fallback
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 Component mounted, route params:', route?.params);
    loadNotifications();
    fetchCenterInfo();
    
    // Skip server calls if we're in offline mode (demo user)
    const isOfflineMode = route?.params?.userData?.password === 'admin' || route?.params?.userData?.contact_number === 'admin';
    if (isOfflineMode) {
      console.log('🔄 Offline mode detected, using fallback data immediately');
      const fallbackData = getFallbackData();
      setFamilies(fallbackData.families);
      setStats(fallbackData.stats);
      setLoading(false);
    } else {
      fetchDashboardStats(); // Try dashboard stats first
      fetchLatestStudentData(); // Fallback to family data
    }
  }, [route?.params]); // Add route.params as dependency

  // Add focus listener to refresh data when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh data when user returns to this screen
      console.log('🔄 Screen focused, refreshing data...');
      loadNotifications(); // Reload notifications to remove expired ones
      
      // Skip server calls if we're in offline mode (demo user)
      const isOfflineMode = route?.params?.userData?.password === 'admin' || route?.params?.userData?.contact_number === 'admin';
      if (!isOfflineMode) {
        fetchLatestStudentData();
      }
    });

    return unsubscribe;
  }, [navigation, loadNotifications, fetchLatestStudentData]);

  const handleAddFamily = () => {
    navigation.navigate('AddFamily');
  };

  const handleSearchFamilies = () => {
    navigation.navigate('SearchFamilies');
  };

  const handleViewProgress = () => {
    navigation.navigate('ProgressReport');
  };



  const handlePlantOptions = () => {
    navigation.navigate('PlantOptions');
  };

  // Manual refresh function for debugging
  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered');
    // Clear saved IDs to force detection of all families as new
    await AsyncStorage.removeItem('saved_family_ids');
    await fetchLatestStudentData();
  };

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
                <Text style={styles.logoText}>आं</Text>
              </View>
            </View>
            <View style={styles.headerText}>
              <Title style={styles.headerTitle}>आंगनबाड़ी डैशबोर्ड</Title>
              <View style={styles.centerInfo}>
                <Text style={styles.centerName}>ग्राम: {centerInfo.gram}</Text>
                <Text style={styles.centerCode}>आंगनबाड़ी कोड: {centerInfo.anganwadiCode}</Text>
                <Text style={styles.workerName}>नाम: {centerInfo.workerName}</Text>
                <Text style={styles.supervisorName}>सुपरवाइजर: {centerInfo.supervisorName}</Text>
              </View>
              <View style={styles.statusInfo}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>सक्रिय</Text>
                </View>
                <Text style={styles.lastUpdate}>अंतिम अपडेट: आज, 3:45 PM</Text>
                <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
                  <Text style={styles.refreshButtonText}>🔄 रिफ्रेश</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Surface>



        {/* Quick Actions */}
        <Surface style={styles.quickActionsContainer}>
          <Title style={styles.sectionTitle}>त्वरित कार्य</Title>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.quickActionCardFull} onPress={() => navigation.navigate('AddFamily')}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>👨‍👩‍👧‍👦</Text>
              </View>
              <Text style={styles.quickActionText}>नया परिवार जोड़ें</Text>
              <Text style={styles.quickActionDesc}>नए परिवार का पंजीकरण करें</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCardFull} onPress={() => navigation.navigate('SearchFamilies')}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>🔍</Text>
              </View>
              <Text style={styles.quickActionText}>परिवार खोजें</Text>
              <Text style={styles.quickActionDesc}>पंजीकृत परिवारों को खोजें</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCardFull} onPress={() => navigation.navigate('PlantOptions')}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionIconText}>🌱</Text>
              </View>
              <Text style={styles.quickActionText}>हमारे पौधे</Text>
              <Text style={styles.quickActionDesc}>मूंगा पौधों की जानकारी</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Center Information */}
        <Surface style={styles.centerInfoContainer}>
          <Title style={styles.sectionTitle}>केंद्र की जानकारी</Title>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ग्राम</Text>
              <Text style={styles.infoValue}>{centerInfo.gram}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>आंगनबाड़ी कोड</Text>
              <Text style={styles.infoValue}>{centerInfo.anganwadiCode}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>नाम</Text>
              <Text style={styles.infoValue}>{centerInfo.workerName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>सुपरवाइजर</Text>
              <Text style={styles.infoValue}>{centerInfo.supervisorName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>स्थिति</Text>
              <Text style={styles.infoValue}>{centerInfo.status}</Text>
            </View>
          </View>
        </Surface>

        {/* Tips Section */}
        <Surface style={styles.tipsContainer}>
          <Title style={styles.sectionTitle}>टिप</Title>
          <View style={styles.tipContent}>
            <Text style={styles.tipEmoji}>🌱</Text>
            <Text style={styles.tipText}>
              मूंगा पौधों को नियमित पानी दें और धूप में रखें। पत्तियों को पीला होने से बचाने के लिए 
              जैविक खाद का उपयोग करें। परिवारों को पौधों की देखभाल के लिए प्रेरित करें।
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddFamily}
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
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  centerInfo: {
    marginBottom: 12,
  },
  centerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  centerCode: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  workerName: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#999999',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  quickActionsContainer: {
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    elevation: 4,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  quickActionCardFull: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    elevation: 4,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  quickActionIcon: {
    backgroundColor: '#E8F5E8',
    borderRadius: 24,
    padding: 8,
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
    color: '#4CAF50',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 14,
  },
  centerInfoContainer: {
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
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tipsContainer: {
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
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    flex: 1,
  },
  activitiesContainer: {
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
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },

  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  supervisorName: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  photosContainer: {
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
  photosScroll: {
    flexGrow: 0,
  },
  photoCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  familyPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
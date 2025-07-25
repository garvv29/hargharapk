import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Provider as PaperProvider, Card, Button, Surface, TextInput, Text, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from './src/utils/api';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AnganwadiDashboard from './src/screens/AnganwadiDashboard';
import FamilyDashboard from './src/screens/FamilyDashboard';
import UploadPhotoScreen from './src/screens/UploadPhotoScreen';
import AddFamilyScreen from './src/screens/AddFamilyScreen';
import SearchFamiliesScreen from './src/screens/SearchFamiliesScreen';
import PlantOptionsScreen from './src/screens/PlantOptionsScreen';
import ProgressReportScreen from './src/screens/ProgressReportScreen';
import FamilyProgressScreen from './src/screens/FamilyProgressScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Custom theme to fix APK text color issues
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    secondary: '#4CAF50',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    onSurface: '#1a1a1a',
    onBackground: '#1a1a1a',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    // Force text input colors
    outline: '#2E7D32',
    outlineVariant: '#2E7D32',
    onSurfaceVariant: '#1a1a1a',
    surfaceVariant: '#FFFFFF',
    // Explicit overrides to prevent purple text
    tertiary: '#2E7D32',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E8F5E8',
    onTertiaryContainer: '#1a1a1a',
    primaryContainer: '#E8F5E8',
    onPrimaryContainer: '#1a1a1a',
    secondaryContainer: '#E8F5E8',
    onSecondaryContainer: '#1a1a1a',
    inverseSurface: '#1a1a1a',
    inverseOnSurface: '#FFFFFF',
    surfaceTint: '#2E7D32',
    error: '#B00020',
    onError: '#FFFFFF',
    errorContainer: '#FDEAEA',
    onErrorContainer: '#410E0B',
  },
};

const Stack = createStackNavigator();

// Demo users for offline mode (admin user removed)
const getDemoUsers = () => [
  {
    username: 'student001',
    contact_number: 'student001', 
    password: 'student001',
    name: 'राहुल शर्मा',
    role: 'family',
    guardian_name: 'सुनीता शर्मा',
    father_name: 'रमेश शर्मा',
    mother_name: 'सुनीता शर्मा',
    age: '5',
    aanganwadi_code: '101'
  },
  {
    username: 'student002',
    contact_number: 'student002',
    password: 'student002', 
    name: 'प्रिया वर्मा',
    role: 'family',
    guardian_name: 'मीरा वर्मा',
    father_name: 'सुरेश वर्मा',
    mother_name: 'मीरा वर्मा',
    age: '4',
    aanganwadi_code: '101'
  }
];

function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('चेतावनी', 'कृपया उपयोगकर्ता नाम और पासवर्ड दर्ज करें।');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Starting fast login process...');
      
      // Skip connection test for faster login
      console.log('⚡ Skipping connection test for speed optimization');
      
      // First try to fetch user from external table using contact number
      console.log('🔍 Fetching user from external table...');
      console.log('📱 Contact number entered:', email.trim());
      
      let externalUserResponse;
      try {
        // Add timeout for faster failure
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000) // 3 second timeout
        );
        
        const fetchPromise = apiService.fetchUserFromExternalTable(email.trim());
        externalUserResponse = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('📊 External user response:', externalUserResponse);
      } catch (externalError) {
        console.log('🔴 External table fetch failed:', externalError);
        externalUserResponse = { success: false, message: 'External table unavailable' };
      }

      if (externalUserResponse.success && externalUserResponse.user) {
        // User found in external table
        const user = externalUserResponse.user;
        console.log('User found in external table:', user);
        
        // Navigate based on user role
        const userRole = user.role || 'family';
        console.log('User role:', userRole);
        
        switch (userRole) {
          case 'admin':
            console.log('🚀 Navigating to AnganwadiDashboard with admin user data:', user);
            navigation.navigate('AnganwadiDashboard', {
              userData: user,
              userId: user.username,
              name: user.name,
              centerCode: user.centerCode,
              centerName: user.centerName,
              district: user.district,
              block: user.block,
              anganwadiId: user.anganwadiId,
              workerName: user.workerName,
            });
            break;
          case 'aanganwadi':
            console.log('🚀 Navigating to AnganwadiDashboard with user data:', user);
            navigation.navigate('AnganwadiDashboard', {
              userData: user,
              userId: user.username,
              name: user.name,
              centerCode: user.centerCode,
              centerName: user.centerName,
              district: user.district,
              block: user.block,
              anganwadiId: user.anganwadiId,
              workerName: user.workerName,
            });
            break;
          case 'family':
            const userName = user.name || '';
            const userUsername = user.username || '';
            const guardianName = user.guardian_name || '';
            const fatherName = user.father_name || '';
            const motherName = user.mother_name || '';
            const age = user.age || '';
            const aanganwadi_code = user.centerCode || user.anganwadi_code || '';
            console.log("Aanganwadi code:", aanganwadi_code);
            console.log("Full user object:", user);
            console.log("Student details received:", user);

            navigation.navigate('FamilyDashboard', {
              userId: userUsername,
              name: userName,
              age,
              guardianName,
              fatherName,
              motherName,
              aanganwadi_code,
              userData: user, // Pass full user data
            });
            break;
          default:
            Alert.alert('त्रुटि', 'अज्ञात उपयोगकर्ता भूमिका।');
            break;
        }
      } else {
        // If not found in external table, try regular login with optimized retry logic
        console.log('User not found in external table, trying regular login...');
        
        let response: any;
        try {
          // Add timeout for faster failure
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 5000) // 5 second timeout
          );
          const loginPromise = apiService.login(email.trim(), password);
          response = await Promise.race([loginPromise, timeoutPromise]);
          console.log('Regular login response:', response);
        } catch (loginError: any) {
          console.log('❌ Login attempt failed:', loginError);
        }
        
        // Check demo users immediately if login fails
        let usedDemoUser = false;
        if (!response || !response.success) {
          console.log('🔄 Login failed, checking demo users immediately...');
          const demoUsers = getDemoUsers();
          const demoUser = demoUsers.find(user => 
            (user.username === email.trim() || user.contact_number === email.trim()) && 
            user.password === password
          );
          if (demoUser) {
            console.log('✅ Demo user found, proceeding with offline login:', demoUser);
            response = {
              success: true,
              user: demoUser,
              role: demoUser.role,
              message: 'Demo login successful'
            };
            usedDemoUser = true;
          }
        }

        if (response && response.success && response.user) {
          const user = response.user;

            // Store the token if available
            if (response.token) {
              apiService.setToken(response.token);
            }
            
            // Navigate based on user role
            const userRole = response.user?.role || response.role;
            console.log('User role:', userRole);
            
            switch (userRole) {
              case 'admin':
                Alert.alert('Admin dashboard is disabled.');
                break;
              case 'aanganwadi':
                console.log('🚀 Navigating to AnganwadiDashboard with backend user data:', user);
                navigation.navigate('AnganwadiDashboard', {
                  userData: user,
                  userId: user.username,
                  name: user.name,
                  centerCode: (user as any).aanganwaadi_id,
                  centerName: (user as any).aanganwaadi_id,
                  district: (user as any).address,
                  block: (user as any).address,
                  anganwadiId: (user as any).aanganwaadi_id,
                  workerName: user.name,
                  supervisorName: (user as any).supervisor_name,
                });
                break;
            case 'family':
              const userName = user.name || '';
              const userUsername = user.username || '';
              const guardianName = (user as any).guardian_name || '';
              const fatherName = (user as any).father_name || '';
              const motherName = (user as any).mother_name || '';
              const age = (user as any).age || '';
              const aanganwadi_code = (user as any).aanganwadi_code || (user as any).center_code || (user as any).anganwadi_center_code || '';
              console.log("Aanganwadi code:", aanganwadi_code);
              console.log("Full user object:", user);
              console.log("Student details received:", user);

              navigation.navigate('FamilyDashboard', {
                userId: userUsername,
                name: userName,
                age,
                guardianName,
                fatherName,
                motherName,
                aanganwadi_code,
              });
              break;
            default:
              // If no specific role, try to determine from username or other fields
              if (response.user?.username?.toUpperCase().includes('ADMIN') || 
                  response.user?.username?.toUpperCase().includes('CGCO')) {
                Alert.alert('Admin dashboard is disabled.');
              } else if (response.user?.username?.toUpperCase().includes('ANGANWADI') || 
                         response.user?.username?.toUpperCase().includes('CGAB')) {
                navigation.navigate('AnganwadiDashboard');
              } else if (response.user?.username?.toUpperCase().includes('FAMILY') || 
                         response.user?.username?.toUpperCase().includes('CGPV')) {
                // Family user - extract and pass family details
                const userName = user.name || '';
                const userUsername = user.username || '';
                const guardianName = (user as any).guardian_name || '';
                const fatherName = (user as any).father_name || '';
                const motherName = (user as any).mother_name || '';
                const age = (user as any).age || '';
                const aanganwadi_code = (user as any).aanganwadi_code || (user as any).center_code || (user as any).anganwadi_center_code || '';
                
                navigation.navigate('FamilyDashboard', {
                  userId: userUsername,
                  name: userName,
                  age,
                  guardianName,
                  fatherName,
                  motherName,
                  aanganwadi_code,
                });
              } else {
                Alert.alert('त्रुटि', 'अज्ञात उपयोगकर्ता भूमिका।');
              }
              break;
          }
        } else if (!usedDemoUser) {
          Alert.alert('लॉगिन विफल', (response && response.message) || 'लॉगिन में त्रुटि हुई।');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('नेटवर्क त्रुटि', `सर्वर से कनेक्ट नहीं हो पा रहा है: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Ensure app content is visible during screen recording
  useEffect(() => {
    // Disable any privacy restrictions that might hide content
    if (Platform.OS === 'android') {
      // For Android, ensure screen recording is allowed
      console.log('Screen recording enabled for Android');
    } else if (Platform.OS === 'ios') {
      // For iOS, ensure screen recording is allowed
      console.log('Screen recording enabled for iOS');
    }

    // Add global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      // Log errors but don't crash the app
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('./src/assets/logo.jpg')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>हर घर मुंगा</Text>
          </View>
        </Surface>

        {/* Login Card */}
        <Card style={styles.loginCard}>
          <Card.Content>
            <Text style={styles.loginTitle}>लॉगिन करें</Text>
            <Text style={styles.loginSubtitle}>
              हर घर मुंगा अभियान में आपका स्वागत है
            </Text>

            <TextInput
              label="उपयोगकर्ता नाम"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              theme={customTheme}
              textColor="#1a1a1a"
              contentStyle={{ color: '#1a1a1a' }}
              outlineColor="#2E7D32"
              activeOutlineColor="#2E7D32"
            />

            <TextInput
              label="पासवर्ड"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              theme={customTheme}
              textColor="#1a1a1a"
              contentStyle={{ color: '#1a1a1a' }}
              outlineColor="#2E7D32"
              activeOutlineColor="#2E7D32"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              buttonColor="#2E7D32"
              textColor="#FFFFFF"
              contentStyle={styles.loginButtonContent}
              labelStyle={{ color: '#FFFFFF', fontWeight: '600' }}
              theme={customTheme}
            >
              {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
            </Button>
          </Card.Content>
        </Card>

        {/* Powered by SSIPMT */}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Text style={styles.ssimptText}>SSIPMT RAIPUR</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <PaperProvider theme={customTheme}>
      <SafeAreaProvider>
        <NavigationContainer
          onStateChange={(state) => {
            console.log('Navigation state changed:', state);
          }}
        >
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AnganwadiDashboard" component={AnganwadiDashboard} />
            <Stack.Screen name="FamilyDashboard" component={FamilyDashboard} />
            <Stack.Screen name="UploadPhoto" component={UploadPhotoScreen as any} />
            <Stack.Screen name="AddFamily" component={AddFamilyScreen} />
            <Stack.Screen name="SearchFamilies" component={SearchFamiliesScreen} />
            <Stack.Screen name="PlantOptions" component={PlantOptionsScreen} />
            <Stack.Screen name="ProgressReport" component={ProgressReportScreen} />
            <Stack.Screen name="FamilyProgress" component={FamilyProgressScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    elevation: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: 5,
    width: '100%',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 32,
    includeFontPadding: false,
    flexWrap: 'wrap',
    width: '100%',
  },
  loginCard: {
    borderRadius: 20,
    elevation: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  loginSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    color: '#1a1a1a',
  },
  loginButton: {
    borderRadius: 12,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 12,
  },
  poweredByContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  poweredByText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ssimptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

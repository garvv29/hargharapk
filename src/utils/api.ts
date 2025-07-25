import AsyncStorage from '@react-native-async-storage/async-storage'; 

//export const API_BASE_URL = 'https://grx6djfl-5001.inc1.devtunnels.ms'; 
export const API_BASE_URL = 'http://165.22.208.62:5000/';
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id?: string;
    username?: string;
    role?: 'admin' | 'anganwadi' | 'family' | string;
    name?: string;
    centerCode?: string;
    centerName?: string;
    district?: string;
    block?: string;
  };
  token?: string;
  [key: string]: any;
}

export interface FamilyRegistrationData {
  childName: string;
  gender: 'लड़का' | 'लड़की';
  dateOfBirth: string;
  age: string;
  weight: string;
  height: string;
  motherName: string;
  fatherName: string;
  mobileNumber: string;
  village: string;
  ward: string;
  panchayat: string;
  district: string;
  distributionDate: string;
  anganwadiCenterName: string;
  anganwadiCode: string;
  workerName: string;
  workerCode: string;
  block: string;
  registrationDate: string;
  plantPhoto: string | null;
  pledgePhoto: string | null;
}

export interface FamilyData {
  id: string;
  childName: string;
  parentName: string;
  mobileNumber: string;
  village: string;
  registrationDate: string;
  plantDistributed: boolean;
  centerCode: string;
  centerName: string;
  workerName: string;
  status: 'active' | 'inactive';
  totalImagesYet?: number;
  plant_photo?: string | null;
  pledge_photo?: string | null;
  motherName?: string;
  fatherName?: string;
  anganwadiCode?: string;
  age?: string;
  gender?: string;
  weight?: string;
  height?: string;
  panchayat?: string;
  district?: string;
  block?: string;
  dateOfBirth?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem('userToken', token);
  }

  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('userToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(),
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 API Request (Attempt ${attempt}/${retries}): ${config.method || 'GET'} ${url}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced from 10000 to 3000 (3 seconds)
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📡 API Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error: ${response.status} - ${errorText}`);
          
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `HTTP error: ${response.status}`);
          } catch {
            throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
          }
        }
        
        const result = await response.json();
        console.log(`✅ API Success:`, result);
        return result;
      } catch (error: any) {
        console.error(`❌ API request failed (Attempt ${attempt}/${retries}):`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          // Provide user-friendly error messages
          if (error instanceof TypeError && error.message.includes('network')) {
            throw new Error('नेटवर्क कनेक्शन की समस्या है। कृपया अपना इंटरनेट कनेक्शन जांचें।');
          }
          
          if (error.name === 'AbortError') {
            throw new Error('अनुरोध का समय समाप्त हो गया। कृपया पुनः प्रयास करें।');
          }
          
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(Math.pow(2, attempt - 1) * 500, 2000); // 0.5s, 1s, 2s max
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('All retry attempts failed');
  }

  async fetchUserFromExternalTable(contactNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/data1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return { success: false, message: 'Invalid data format from server' };
      }

      const user = data.find((item: any) => {
        return (
          item.contact_number === contactNumber ||
          item.mobile_number === contactNumber ||
          item.phone === contactNumber
        );
      });

      if (user) {
        const mappedUser = {
          id: user.id || user.user_id,
          username: user.contact_number || user.mobile_number || user.phone,
          role: this.determineUserRole(user),
          name: user.name || user.full_name || user.child_name || user.worker_name,
          centerCode: user.center_code || user.anganwadi_code || user.kendra_code,
          centerName: user.center_name || user.anganwadi_center_name || user.kendra_name,
          district: user.district,
          block: user.block,
          anganwadiId: user.anganwadi_id || user.worker_id,
          workerName: user.worker_name || user.anganwadi_worker_name,
          contactNumber: user.contact_number || user.mobile_number || user.phone,
          ...user,
        };

        return {
          success: true,
          message: 'User found in external table',
          user: mappedUser,
        };
      } else {
        return {
          success: false,
          message: 'User not found in external table',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error fetching data: ${error}`,
      };
    }
  }

  private determineUserRole(userData: any): string {
    if (userData.role) return userData.role;
    if (userData.worker_name || userData.worker_id || userData.anganwadi_worker_name)
      return 'aanganwadi';
    if (userData.child_name || userData.mother_name || userData.father_name) return 'family';
    return 'family';
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Only one attempt for login, no retries
    const response = await this.makeRequest<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, 1);
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await this.makeRequest<{ success: boolean; message: string }>('/logout', { method: 'POST' });
    if (response.success) this.clearToken();
    return response;
  }

  async getFamilies(centerCode?: string): Promise<FamilyData[]> {
    const endpoint = centerCode ? `/families?centerCode=${centerCode}` : '/families';
    return this.makeRequest<FamilyData[]>(endpoint);
  }

  async registerFamily(familyData: FamilyRegistrationData): Promise<{
    success: boolean;
    message: string;
    familyId: string;
  }> {
    return this.makeRequest('/families/register', {
      method: 'POST',
      body: JSON.stringify(familyData),
    });
  }

  async getFamilyDetails(familyId: string): Promise<FamilyData> {
    return this.makeRequest<FamilyData>(`/families/${familyId}`);
  }

  async getFamilyByUserId(userId: string): Promise<FamilyData> {
    return this.makeRequest<FamilyData>(`/families/user/${userId}`);
  }

  async updateFamily(
    familyId: string,
    updateData: Partial<FamilyData>
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/families/${familyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async uploadPlantPhoto(
    imageUri: string,
    username: string,
    name: string,
    plantStage: string,
    description: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    photo_url?: string;
    total_images_uploaded?: number;
    is_moringa?: boolean;
    confidence?: number;
  }> {
    console.log('📤 Starting photo upload...');
    console.log('📤 Upload params:', { username, name, plantStage, description });
    console.log('📤 Image URI:', imageUri);
    
    const formData = new FormData();
    const ext = imageUri.split('.').pop();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const filename = `plant_${username}_${Date.now()}.${ext}`;

    formData.append('username', username);
    formData.append('name', name);
    formData.append('plant_stage', plantStage);
    formData.append('description', description);
    formData.append('photo', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    try {
      console.log('📤 Sending upload request to:', `${this.baseURL}/upload_plant_photo`);
      
      const res = await fetch(`${this.baseURL}/upload_plant_photo`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - let browser set it automatically
        },
        body: formData,
      });

      console.log('📡 Upload response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(errorText);
      }
      
      const result = await res.json();
      console.log('✅ Upload successful:', result);
      
      // Match backend response format exactly
      return {
        success: result.success || true,
        message: result.message || 'Photo uploaded successfully',
        photo_url: result.photo_url,
        total_images_uploaded: result.total_images_uploaded,
        is_moringa: result.is_moringa,
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error('❌ Photo upload error:', error);
      throw new Error(`Photo upload failed: ${error.message}`);
    }
  }

  // New method to get photo from backend
  async getPhoto(mobile: string, name: string): Promise<{ success: boolean; photo_url?: string; data?: any }> {
    console.log('📸 Fetching photo for:', { mobile, name });
    
    const formData = new FormData();
    formData.append('mobile', mobile);
    formData.append('name', name);

    try {
      const response = await fetch(`${this.baseURL}/get_photo`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Get photo response status:', response.status);

      if (!response.ok) {
        console.log('❌ Photo not found or error');
        return { success: false };
      }

      const result = await response.json();
      console.log('✅ Photo fetch result:', result);
      
      // Backend returns array with photo data
      if (Array.isArray(result) && result.length > 0 && result[0].plant_photo) {
        const photoData = result[0];
        // Construct full URL for photo with cache-busting timestamp
        const timestamp = Date.now();
        const photoUrl = `${this.baseURL}/static/${photoData.plant_photo}?t=${timestamp}`;
        console.log('📷 Photo URL constructed with cache buster:', photoUrl);
        
        return {
          success: true,
          photo_url: photoUrl,
          data: photoData
        };
      } else {
        console.log('📷 No photo found in response');
        return { success: false };
      }
    } catch (error: any) {
      console.error('❌ Error fetching photo:', error);
      return { success: false };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server responded with status: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error}`,
      };
    }
  }

  // Add missing methods for AnganwadiDashboard
  async searchFamilies(query: string = ''): Promise<FamilyData[]> {
    try {
      const endpoint = query ? `/search?query=${encodeURIComponent(query)}` : '/search';
      console.log('🔍 Fetching families from:', endpoint);
      return this.makeRequest<FamilyData[]>(endpoint);
    } catch (error) {
      console.error('Error in searchFamilies:', error);
      return [];
    }
  }

  async getDashboardStats(): Promise<{
    totalFamilies: number;
    distributedPlants: number;
    activeFamilies: number;
    latestStudentName?: string;
  }> {
    try {
      console.log('📊 Fetching dashboard stats from /search2...');
      const response = await this.makeRequest<any>('/search2');
      
      // Handle different response formats
      if (response.totalFamilies !== undefined) {
        return {
          totalFamilies: response.totalFamilies || 0,
          distributedPlants: response.distributedPlants || 0,
          activeFamilies: response.activeFamilies || 0,
          latestStudentName: response.latestStudentName,
        };
      } else {
        // If /search2 doesn't exist, fallback to /search and calculate stats
        console.log('⚠️ /search2 not available, using /search as fallback');
        const families = await this.searchFamilies();
        return {
          totalFamilies: families.length,
          distributedPlants: families.filter((f: any) => f.plantDistributed || f.plant_photo).length,
          activeFamilies: families.length,
          latestStudentName: families.length > 0 ? families[0].childName : undefined,
        };
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        totalFamilies: 0,
        distributedPlants: 0,
        activeFamilies: 0,
      };
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);

// Export additional utility functions
export const fetchTotalFamiliesAndPhotos = async (): Promise<{ totalFamilies: number; totalPhotos: number }> => {
  try {
    console.log('🔄 Fetching real stats from server...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for stats
    
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`⚠️ Server response not OK: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Real stats data received:', data);
    
    // Validate data structure
    if (typeof data.totalFamilies === 'number' && typeof data.totalPhotos === 'number') {
      return {
        totalFamilies: data.totalFamilies,
        totalPhotos: data.totalPhotos,
      };
    } else {
      console.log('⚠️ Invalid data structure received, using fallback');
      throw new Error('Invalid data structure from server');
    }
  } catch (error) {
    console.error('❌ Error fetching real stats, will use fallback:', error);
    throw error; // Re-throw to let calling code handle fallback
  }
};

// Add a function to check server connectivity
export const checkServerConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced from 5000 to 2000 (2 seconds)
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Server connectivity check failed:', error);
    return false;
  }
};

// Fallback data when server is not available
export const getFallbackData = () => ({
  families: [],
  stats: { totalPlants: 0, distributedPlants: 0, activeFamilies: 0 },
  notifications: [],
});

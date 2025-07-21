import AsyncStorage from '@react-native-async-storage/async-storage'; 

export const API_BASE_URL = 'http://165.22.208.62:5000'; // Your backend URL

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

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `HTTP error: ${response.status}`);
        } catch {
          throw new Error(`HTTP error: ${response.status}`);
        }
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
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
    const response = await this.makeRequest<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await this.makeRequest('/logout', { method: 'POST' });
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
  ): Promise<{ success: boolean; message: string; fileUrl?: string }> {
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

    const res = await fetch(`${this.baseURL}/upload_plant_photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }
}

export const apiService = new ApiService(API_BASE_URL);

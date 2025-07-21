import { apiService } from './src/utils/api';

(async () => {
  try {
    const result = await apiService.testConnection();
    console.log('API Connection Test Result:', result);
  } catch (error) {
    console.error('API Connection Test Error:', error);
  }
})(); 
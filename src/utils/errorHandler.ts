// Centralized error handling utility
import { Alert } from 'react-native';

export const isNetworkError = (error: any): boolean => {
  return (
    error.message === 'Network request failed' ||
    error.name === 'TypeError' ||
    error.message?.includes('fetch') ||
    error.message?.includes('timeout') ||
    error.code === 'NETWORK_ERROR'
  );
};

export const handleNetworkError = (error: any, context: string = 'डेटा लोड') => {
  if (isNetworkError(error)) {
    console.log(`⚠️ Network error in ${context}:`, error.message);
    // Don't show alert for network errors - just log them
    return false; // Indicates we should use fallback data
  }
  
  // For other errors, we might want to show an alert
  console.error(`❌ Error in ${context}:`, error);
  return true; // Indicates this is a real error that should be handled
};

export const showGentleErrorMessage = (title: string, message: string, onDismiss?: () => void) => {
  Alert.alert(title, message, [
    {
      text: 'ठीक है',
      onPress: onDismiss,
    },
  ]);
};

export const logError = (context: string, error: any, shouldUseFlallback: boolean = true) => {
  console.log(`🔄 ${context} - Error occurred:`, error.message);
  if (shouldUseFlallback) {
    console.log(`📊 Using fallback data for ${context}`);
  }
};

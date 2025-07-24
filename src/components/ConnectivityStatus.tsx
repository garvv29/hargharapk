import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { checkServerConnectivity } from '../utils/api';

interface ConnectivityStatusProps {
  onConnectivityChange?: (isConnected: boolean) => void;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({ onConnectivityChange }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = async () => {
    setIsChecking(true);
    try {
      const connected = await checkServerConnectivity();
      setIsConnected(connected);
      onConnectivityChange?.(connected);
    } catch (error) {
      setIsConnected(false);
      onConnectivityChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
    
    // Check connectivity every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return null; // Don't show anything while initial check
  }

  return (
    <View style={[styles.container, isConnected ? styles.connected : styles.disconnected]}>
      <Text style={styles.text}>
        {isChecking ? 'जांच रहे हैं...' : 
         isConnected ? '🟢 ऑनलाइन' : '🔴 ऑफलाइन मोड'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  connected: {
    backgroundColor: '#e8f5e8',
  },
  disconnected: {
    backgroundColor: '#ffeaa7',
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

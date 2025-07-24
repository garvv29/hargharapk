import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Button, Surface, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface AdminDashboardProps {
  navigation: any;
  route: any;
}

export default function AdminDashboard({ navigation, route }: AdminDashboardProps) {
  const { userData, userId, name } = route.params || {};

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const handleProgressReport = () => {
    navigation.navigate('ProgressReport');
  };

  const handleSearchFamilies = () => {
    navigation.navigate('SearchFamilies');
  };

  const handleAddFamily = () => {
    navigation.navigate('AddFamily');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5FBF']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>प्रशासक डैशबोर्ड</Text>
          <Text style={styles.headerSubtitle}>स्वागत, {name || 'Admin'}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>लॉग आउट</Text>
          </TouchableOpacity>
        </View>
      </Surface>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <Surface style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>त्वरित आंकड़े</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>कुल परिवार</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>आंगनवाड़ी केंद्र</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>फोटो अपलोड</Text>
            </View>
          </View>
        </Surface>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>प्रशासन कार्य</Text>
          
          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>📊 प्रगति रिपोर्ट</Title>
              <Text style={styles.cardDescription}>संपूर्ण प्रगति और आंकड़े देखें</Text>
              <Button 
                mode="contained" 
                onPress={handleProgressReport}
                style={styles.actionButton}
                buttonColor="#4CAF50"
              >
                रिपोर्ट देखें
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>🔍 परिवार खोजें</Title>
              <Text style={styles.cardDescription}>पंजीकृत परिवारों की जानकारी खोजें</Text>
              <Button 
                mode="contained" 
                onPress={handleSearchFamilies}
                style={styles.actionButton}
                buttonColor="#2196F3"
              >
                खोजें
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>👨‍👩‍👧‍👦 नया परिवार</Title>
              <Text style={styles.cardDescription}>नए परिवार का पंजीकरण करें</Text>
              <Button 
                mode="contained" 
                onPress={handleAddFamily}
                style={styles.actionButton}
                buttonColor="#FF9800"
              >
                पंजीकरण करें
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E5FBF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF5722',
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionCard: {
    marginBottom: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
});
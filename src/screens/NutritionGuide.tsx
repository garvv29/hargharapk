import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Title, Paragraph, Button, Surface, Text, Card, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface NutritionGuideProps {
  navigation: any;
}

export default function NutritionGuide({ navigation }: NutritionGuideProps) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>पोषण गाइड</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Care Tips Section */}
        <Surface style={styles.section}>
          <Title style={styles.sectionTitle}>🌱 देखभाल टिप्स</Title>
          
          <Card style={styles.tipCard}>
            <Card.Content>
              <View style={styles.tipHeader}>
                <Text style={styles.tipEmoji}>💧</Text>
                <Text style={styles.tipTitle}>पानी देना</Text>
              </View>
              <Text style={styles.tipDescription}>
                मूंगा पौधे को रोज सुबह पानी दें। मिट्टी को नम रखें लेकिन ज्यादा पानी न दें। 
                गर्मियों में दिन में दो बार पानी दें।
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.tipCard}>
            <Card.Content>
              <View style={styles.tipHeader}>
                <Text style={styles.tipEmoji}>☀️</Text>
                <Text style={styles.tipTitle}>धूप और स्थान</Text>
              </View>
              <Text style={styles.tipDescription}>
                पौधे को धूप वाली जगह पर रखें। कम से कम 6-8 घंटे की धूप जरूरी है। 
                छाया में रखने से पौधा कमजोर हो सकता है।
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.tipCard}>
            <Card.Content>
              <View style={styles.tipHeader}>
                <Text style={styles.tipEmoji}>🌱</Text>
                <Text style={styles.tipTitle}>मिट्टी की देखभाल</Text>
              </View>
              <Text style={styles.tipDescription}>
                मिट्टी को नम रखें लेकिन गीली नहीं। जैविक खाद का उपयोग करें। 
                हर 2-3 महीने में मिट्टी को ढीला करें।
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.tipCard}>
            <Card.Content>
              <View style={styles.tipHeader}>
                <Text style={styles.tipEmoji}>🧹</Text>
                <Text style={styles.tipTitle}>सफाई और रखरखाव</Text>
              </View>
              <Text style={styles.tipDescription}>
                पत्तियों को नियमित रूप से साफ करें। कीटों से बचाव के लिए नीम का तेल छिड़कें। 
                सूखी पत्तियों को हटाते रहें।
              </Text>
            </Card.Content>
          </Card>
        </Surface>

        {/* Nutrition Benefits Section */}
        <Surface style={styles.section}>
          <Title style={styles.sectionTitle}>🥗 पोषण लाभ</Title>
          
          <Card style={styles.benefitCard}>
            <Card.Content>
              <View style={styles.benefitHeader}>
                <Text style={styles.benefitEmoji}>💪</Text>
                <Text style={styles.benefitTitle}>आयरन की कमी दूर होती है</Text>
              </View>
              <Text style={styles.benefitDescription}>
                मूंगा में आयरन की मात्रा पालक से 3 गुना ज्यादा होती है। 
                एनीमिया से पीड़ित लोगों के लिए बहुत फायदेमंद है।
              </Text>
              <Chip style={styles.benefitChip} textStyle={styles.benefitChipText}>
                आयरन: 28mg/100g
              </Chip>
            </Card.Content>
          </Card>

          <Card style={styles.benefitCard}>
            <Card.Content>
              <View style={styles.benefitHeader}>
                <Text style={styles.benefitEmoji}>🛡️</Text>
                <Text style={styles.benefitTitle}>रोग प्रतिरोधक क्षमता बढ़ती है</Text>
              </View>
              <Text style={styles.benefitDescription}>
                विटामिन C की उच्च मात्रा शरीर की रोग प्रतिरोधक क्षमता को मजबूत करती है। 
                संक्रमण से बचाव में मदद करती है।
              </Text>
              <Chip style={styles.benefitChip} textStyle={styles.benefitChipText}>
                विटामिन C: 51.7mg/100g
              </Chip>
            </Card.Content>
          </Card>

          <Card style={styles.benefitCard}>
            <Card.Content>
              <View style={styles.benefitHeader}>
                <Text style={styles.benefitEmoji}>🔬</Text>
                <Text style={styles.benefitTitle}>विटामिन A, C और K मिलते हैं</Text>
              </View>
              <Text style={styles.benefitDescription}>
                मूंगा में विटामिन A आंखों के लिए, विटामिन C इम्युनिटी के लिए और 
                विटामिन K खून के थक्के के लिए जरूरी है।
              </Text>
              <Chip style={styles.benefitChip} textStyle={styles.benefitChipText}>
                विटामिन A: 378μg/100g
              </Chip>
            </Card.Content>
          </Card>

          <Card style={styles.benefitCard}>
            <Card.Content>
              <View style={styles.benefitHeader}>
                <Text style={styles.benefitEmoji}>❤️</Text>
                <Text style={styles.benefitTitle}>एनीमिया से बचाव होता है</Text>
              </View>
              <Text style={styles.benefitDescription}>
                आयरन और फोलिक एसिड की उच्च मात्रा एनीमिया को रोकने में मदद करती है। 
                गर्भवती महिलाओं के लिए विशेष रूप से फायदेमंद।
              </Text>
              <Chip style={styles.benefitChip} textStyle={styles.benefitChipText}>
                फोलिक एसिड: 40μg/100g
              </Chip>
            </Card.Content>
          </Card>
        </Surface>

        {/* Expert Advice Section */}
        <Surface style={styles.section}>
          <Title style={styles.sectionTitle}>💡 विशेषज्ञ सलाह</Title>
          
          <Card style={styles.expertCard}>
            <Card.Content>
              <Text style={styles.expertTitle}>कब और कैसे खाएं?</Text>
              <Text style={styles.expertText}>
                • सुबह खाली पेट 5-6 पत्तियां चबाकर खाएं{'\n'}
                • पत्तियों को सूप में डालकर पी सकते हैं{'\n'}
                • पाउडर को दूध या पानी में मिलाकर लें{'\n'}
                • हफ्ते में 3-4 बार सेवन करें
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.expertCard}>
            <Card.Content>
              <Text style={styles.expertTitle}>सावधानियां</Text>
              <Text style={styles.expertText}>
                • ज्यादा मात्रा में न खाएं{'\n'}
                • गर्भवती महिलाएं डॉक्टर से सलाह लें{'\n'}
                • ब्लड प्रेशर की दवा ले रहे हैं तो सावधान रहें{'\n'}
                • एलर्जी हो तो तुरंत बंद कर दें
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.expertCard}>
            <Card.Content>
              <Text style={styles.expertTitle}>स्टोरेज टिप्स</Text>
              <Text style={styles.expertText}>
                • ताजी पत्तियों को फ्रिज में रखें{'\n'}
                • सूखी पत्तियों को एयरटाइट कंटेनर में रखें{'\n'}
                • पाउडर को ठंडी और सूखी जगह पर रखें{'\n'}
                • 6 महीने तक इस्तेमाल कर सकते हैं
              </Text>
            </Card.Content>
          </Card>
        </Surface>

        {/* Nutritional Facts */}
        <Surface style={styles.section}>
          <Title style={styles.sectionTitle}>📊 पोषण तथ्य (100g में)</Title>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>64</Text>
              <Text style={styles.nutritionLabel}>कैलोरी</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>8.5g</Text>
              <Text style={styles.nutritionLabel}>कार्बोहाइड्रेट</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>9.4g</Text>
              <Text style={styles.nutritionLabel}>प्रोटीन</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>1.4g</Text>
              <Text style={styles.nutritionLabel}>फाइबर</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>28mg</Text>
              <Text style={styles.nutritionLabel}>आयरन</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>185mg</Text>
              <Text style={styles.nutritionLabel}>कैल्शियम</Text>
            </View>
          </View>
        </Surface>
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
    backgroundColor: 'transparent',
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  section: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  tipCard: {
    marginBottom: 12,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tipDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  benefitCard: {
    marginBottom: 12,
    elevation: 2,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  benefitChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
  },
  benefitChipText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  expertCard: {
    marginBottom: 12,
    elevation: 2,
  },
  expertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  expertText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
}); 
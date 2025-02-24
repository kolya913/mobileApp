import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import ProgressBar from './ProgressBar'; 
import { useFocusEffect } from '@react-navigation/native'; 

interface RuleCardProps {
  ruleId: number;
  number: number;
  name: string;
  countElement: number;
  navigation: any;
}

const RuleCard = ({ ruleId, number, name, countElement, navigation }: RuleCardProps) => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const [viewedCount, setViewedCount] = useState<number>(0);

  const getViewedItems = async () => {
    try {
      const viewedItems = await AsyncStorage.getItem(`viewedItemsForChapter_${ruleId}`);
      const viewedItemsArray = viewedItems ? JSON.parse(viewedItems) : [];
      setViewedCount(viewedItemsArray.length);
    } catch (error) {
      console.error('Error loading viewed items:', error);
    }
  };

  useEffect(() => {
    getViewedItems();
  }, [ruleId]);

  useFocusEffect(
    React.useCallback(() => {
      getViewedItems(); 
    }, [])
  );

  const progress = countElement > 0 ? viewedCount / countElement : 0;

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => navigation.navigate('RuleDetails', { id: ruleId })}>
        <Text style={[styles.ruleNumber, { color: colors.text }]}>{number}. </Text>
        <Text style={[styles.ruleName, { color: colors.text }]}>{name}</Text>
        <ProgressBar progress={progress} /> 
        <Text style={[styles.progressText, { color: colors.text }]}>
          {viewedCount} / {countElement}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  ruleNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default RuleCard;

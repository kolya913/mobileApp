import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/ThemeContext';
import { themes } from '../../theme/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ItemListWithNavigation = ({ items, chapterId, saveAllViewedItems }) => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const [currentIndex, setCurrentIndex] = useState(0);

  const saveLastViewed = async (chapterId: number, itemId: number) => {
    try {
      console.log(`lastViewedChapterId: ${chapterId} `);
      console.log(`lastViewedItemId: ${itemId} `);
    } catch (error) {
      console.error('Error saving last viewed chapter and item:', error);
    }
  };

  useEffect(() => {
    const loadLastViewed = async () => {
      try {
        const savedChapterId = await AsyncStorage.getItem('lastViewedChapterId');
        const savedItemId = await AsyncStorage.getItem('lastViewedItemId');

        if (savedChapterId && savedItemId) {
          const savedChapter = parseInt(savedChapterId);
          const savedItem = parseInt(savedItemId);

          if (savedChapter === chapterId) {
            const itemIndex = items.findIndex(item => item.id === savedItem);
            if (itemIndex !== -1) {
              setCurrentIndex(itemIndex);
            }
          }
        } else {
          saveLastViewed(chapterId, items[0].id);
        }
      } catch (error) {
        console.error('Error loading last viewed chapter and item:', error);
      }
    };

    loadLastViewed();
  }, [chapterId, items]);

  useEffect(() => {
    if (items.length > 0) {
      saveAllViewedItems(chapterId, items[currentIndex].id); 
    }
  }, [currentIndex, items, chapterId, saveAllViewedItems]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
    }
  };

  const currentItem = items[currentIndex];
  const buttonTextColor = currentTheme === 'dark' ? 'white' : 'black';

  return (
    <View style={[styles.itemListContainer, { backgroundColor: colors.background }]}>
      <FlatList
        data={[currentItem]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.itemNumber, { color: colors.text }]}>{item.number} </Text>
            <Text style={[styles.itemText, { color: colors.text }]}>{item.description}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.text }]}>Нет данных</Text>}
      />
      <View style={styles.navigationButtons}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            onPress={handlePrev}
            style={[styles.navigationButton, { backgroundColor: colors.buttonBackground }]}>
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {currentIndex < items.length - 1 && (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navigationButton, { backgroundColor: colors.buttonBackground }]}>
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemListContainer: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 16,
  },
  itemCard: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navigationButton: {
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
});

export default ItemListWithNavigation;

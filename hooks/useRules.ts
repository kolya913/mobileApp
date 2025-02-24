import { useEffect, useState } from 'react';
import api from '../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RuleChapter {
  id: number;
  name: string;
  number: number;
  version: number;
  countElement: number;
  viewedCount?: number;
}

interface RuleChapterWithItemsDTO extends RuleChapter {
  items: any[];
}

export const useRules = () => {
  const [rules, setRules] = useState<RuleChapterDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await api.get('/v1/rules');
        setRules(response.data);
      } catch (err) {
        setError('Ошибка загрузки правил');
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return { rules, loading, error };
};

export const useRuleDetails = (id: number) => {
  const [rule, setRule] = useState<RuleChapterWithItemsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const saveAllViewedItems = async (chapterId: number, itemId: number) => {
    try {
      const viewedItems = await AsyncStorage.getItem(`viewedItemsForChapter_${chapterId}`);
      let viewedItemsArray = viewedItems ? JSON.parse(viewedItems) : [];
  
      if (!viewedItemsArray.includes(itemId)) {
        viewedItemsArray.push(itemId);
        await AsyncStorage.setItem(`viewedItemsForChapter_${chapterId}`, JSON.stringify(viewedItemsArray));
      }
  
      console.log(`viewedItemsForChapter_${chapterId}`, viewedItemsArray); 
  
    } catch (error) {
      console.error('Error saving all viewed items for chapter:', error);
    }
  };

  const getSavedItemIdsForChapter = async (chapterId: number) => {
    try {
      const savedItems = await AsyncStorage.getItem(`viewedItemsForChapter_${chapterId}`);
      if (savedItems) {
        return JSON.parse(savedItems); 
      } else {
        return []; 
      }
    } catch (error) {
      console.error('Error getting saved items for chapter:', error);
      return [];
    }
  };

  const clearAllSavedItems = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chapterKeys = keys.filter(key => key.startsWith('viewedItemsForChapter_'));

      await AsyncStorage.multiRemove(chapterKeys);
      console.log('All saved items cleared');
    } catch (error) {
      console.error('Error clearing all saved items:', error);
    }
  };

  useEffect(() => {
    const fetchRuleDetails = async () => {
      try {
        const response = await api.get(`/v1/rules/${id}`);
        setRule(response.data);
      } catch (err) {
        setError('Ошибка загрузки деталей правила');
      } finally {
        setLoading(false);
      }
    };
    fetchRuleDetails();
  }, [id]);

  return { rule, loading, error, saveAllViewedItems, getSavedItemIdsForChapter, clearAllSavedItems };
};

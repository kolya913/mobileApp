import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRuleDetails } from '../hooks/useRules';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import ItemListWithNavigation from '../components/RuleDetailsScreen/ItemListWithNavigation'; 

const RuleDetailsScreen = ({ route, navigation }): React.JSX.Element => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const { id } = route.params;
  const { rule, loading, error, saveAllViewedItems } = useRuleDetails(id); 

  useLayoutEffect(() => {
    if (rule) {
      navigation.setOptions({
        headerTitle: () => (
          <Text style={[styles.title, { color: colors.text }]}>
            {rule.number}. {rule.name}
          </Text>
        ),
      });
    }
  }, [navigation, rule, colors.text]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (!rule?.items || rule.items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>Нет пунктов в правиле</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ItemListWithNavigation items={rule.items} chapterId={rule.id} saveAllViewedItems={saveAllViewedItems} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});

export default RuleDetailsScreen;

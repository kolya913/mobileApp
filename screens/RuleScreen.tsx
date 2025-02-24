import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRules } from '../hooks/useRules';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import RuleCard from '../components/RuleCard';

const RulesScreen = ({ navigation }): React.JSX.Element => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const { rules, loading, error } = useRules();

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RuleCard
            ruleId={item.id}
            number={item.number}
            name={item.name}
            countElement={item.countElement}
            navigation={navigation}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 16,
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

export default RulesScreen;

import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTickets } from '../hooks/useTickets';
import TicketCard from '../components/TicketCard';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useNavigation } from '@react-navigation/native';

const TicketsScreen = (): React.JSX.Element => {
  const { tickets, loading, error } = useTickets();
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const navigation = useNavigation();

  const handleExamPress = () => {
    if (tickets.length > 0) {
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const randomTicket = tickets[randomIndex];
      navigation.navigate('Ticket', { ticketNumber: randomTicket.ticketNumber, exam: true });
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Нет доступных билетов</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={[styles.examBox, { backgroundColor: colors.primary }]} onPress={handleExamPress}>
        <Text style={[styles.examTitle, { color: colors.text }]}>Экзамен</Text>
      </TouchableOpacity>

      <FlatList
        data={tickets}
        renderItem={({ item }) => (
          <View style={styles.ticketContainer}>
            <TicketCard
              ticketNumber={item.ticketNumber}
              questionNumbers={item.questionNumbers}
              onPress={() => navigation.navigate('Ticket', { ticketNumber: item.ticketNumber, exam: false})}
            />
          </View>
        )}
        keyExtractor={(item) => item.ticketNumber.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  examBox: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ticketContainer: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
});

export default TicketsScreen;

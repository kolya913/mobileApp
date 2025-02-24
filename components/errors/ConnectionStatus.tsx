import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthInternetConnection } from '../../hooks/useAuthInternetConnection';

const ConnectionStatus = () => {
  const { isConnected, isServerHealthy } = useAuthInternetConnection();

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Нет интернета</Text>
      </View>
    );
  }

  if (isServerHealthy === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Сервер не отвечает</Text>
      </View>
    );
  }

  if (isServerHealthy === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Проверка соединения...</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'red',
    padding: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConnectionStatus;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/ThemeContext';
import { themes } from '../../theme/Styles';
import { useAuthInternetConnection } from '../../hooks/useAuthInternetConnection';

const { width } = Dimensions.get('window');

interface SidebarMenuProps {
  onClose: () => void;
  menuAnimation: Animated.Value;
}

const SidebarMenu = ({ onClose, menuAnimation }: SidebarMenuProps): React.JSX.Element => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const navigation = useNavigation<any>();

  const { isAuthenticated, userId } = useAuthInternetConnection();

  return (
    <Animated.View
      style={[
        styles.menu,
        {
          transform: [{ translateX: menuAnimation }],
          backgroundColor: colors.background,
          borderRightColor: colors.border,
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.icon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>

        <View style={styles.menuItemsContainer}>
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
              onClose();
              navigation.navigate('Rules');
            }}
          >
            <Text style={{ color: colors.text }}>📜 Правила</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
              onClose();
              navigation.navigate('Tickets');
            }}
          >
            <Text style={{ color: colors.text }}>🎫 Билеты</Text>
          </TouchableOpacity>

          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => {
                onClose();
                navigation.navigate('Course', { userId });
              }}
            >
              <Text style={{ color: colors.text }}>📚 Курс</Text>
            </TouchableOpacity>
          )}

          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => {
                onClose();
                navigation.navigate('Schedule');
              }}
            >
              <Text style={{ color: colors.text }}>🗓 Расписание</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
              onClose();
              navigation.navigate('Statistics');
            }}
          >
            <Text style={{ color: colors.text }}>📊 Статистика</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
              onClose();
              navigation.navigate('Settings');
            }}
          >
            <Text style={{ color: colors.text }}>⚙️ Настройки</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.6,
    paddingVertical: 20,
    zIndex: 10,
    borderRightWidth: 2,
  },
  safeArea: {
    flex: 1,
    paddingTop: 20,
  },
  closeButton: {
    marginLeft: 10,
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  menuItemsContainer: {
    paddingTop: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
  },
});

export default SidebarMenu;
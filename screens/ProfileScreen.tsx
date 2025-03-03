import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useAuthInternetConnection } from '../hooks/useAuthInternetConnection';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useNavigation } from '@react-navigation/native';
import { useUsers } from '../hooks/useUsers';

const ProfileScreen = (): React.JSX.Element => {
  const { logout } = useAuthInternetConnection();
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const navigation = useNavigation();

  const { userDetails, loading, error, getUserDetails, userPayments, getUserPayments, makePayment } = useUsers();
  const { userId, isAuthenticated } = useAuthInternetConnection();

  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: userDetails?.payForStudying || 0,
    cardNumber: '',
    cvv: '',
    expiryDate: '',
  });

  useEffect(() => {
    if (isAuthenticated && userId) {
      getUserDetails(userId);
      getUserPayments(userId);
    }
  }, [isAuthenticated, userId]);

  const handleLogout = async () => {
    await logout();
    navigation.goBack();
  };

  const handlePayment = () => {
    setPaymentModalVisible(true);
  };

  const handleViewPayments = async () => {
    if (userId) {
      setLoadingPayments(true);
      await getUserPayments(userId);
      setLoadingPayments(false);
      setTimeout(() => setModalVisible(true), 100);
    }
  };

  const handlePaymentSubmit = async () => {
    await makePayment(paymentData);
    setPaymentModalVisible(false);
  };

  const renderStudent = ({ item }) => (
    <Text style={[styles.studentText, { color: colors.text }]}>
      {item.firstName} {item.lastName}
    </Text>
  );

  const renderLicenseCategory = ({ item }) => {
    const statusTranslations = {
      TEACHING: 'учит',
      TRAINING: 'учится',
      PAUSED: 'приостановлено',
      GRADUATED: 'выпустился',
    };

    return (
      <Text style={[styles.userInfoText, { color: colors.text }]}>
        <Text style={styles.bold}>Категория лицензии:</Text> {item.licenseCategoryName} -{' '}
        {statusTranslations[item.status]} ({item.code})
      </Text>
    );
  };

  const renderPaymentItem = ({ item }) => (
    <View style={[styles.paymentItem, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.paymentText, { color: colors.text }]}>{item.amount} руб.</Text>
      <Text style={[styles.paymentText, { color: colors.text }]}>
        <Text style={styles.bold}>Дата:</Text> {new Date(item.paymentDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.paymentText, { color: colors.text }]}>
        <Text style={styles.bold}>Метод:</Text> {item.paymentMethod}
      </Text>
      <Text style={[styles.paymentText, { color: colors.text }]}>
        <Text style={styles.bold}>Статус:</Text> {item.paymentStatus}
      </Text>
    </View>
  );

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
      {userDetails && (
        <View style={styles.userInfoContainer}>
          <Text style={[styles.userInfoText, { color: colors.text }]}>
            <Text style={styles.bold}>Имя:</Text> {userDetails.firstName} {userDetails.lastName}
          </Text>
          <Text style={[styles.userInfoText, { color: colors.text }]}>
            <Text style={styles.bold}>Email:</Text> {userDetails.email}
          </Text>
          <Text style={[styles.userInfoText, { color: colors.text }]}>
            <Text style={styles.bold}>Телефон:</Text> {userDetails.phoneNumber}
          </Text>
          <Text style={[styles.userInfoText, { color: colors.text }]}>
            <Text style={styles.bold}>Группа:</Text> {userDetails.groups?.[0]?.name || 'Не назначено'}
          </Text>
          <Text style={[styles.userInfoText, { color: colors.text }]}>
            <Text style={styles.bold}>Оплата за обучение:</Text> {userDetails.payForStudying} руб.
          </Text>

          {userDetails.licenseCategories?.length > 0 && (
            <FlatList
              data={userDetails.licenseCategories}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderLicenseCategory}
            />
          )}

          {userDetails.students?.length > 0 && (
            <FlatList
              data={userDetails.students}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStudent}
            />
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {userDetails?.payForStudying > 0 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handlePayment}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Оплатить</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleViewPayments}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>История платежей</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>История платежей</Text>
            {loadingPayments ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : userPayments.length > 0 ? (
              <FlatList
                data={userPayments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPaymentItem}
                style={styles.paymentList}
              />
            ) : (
              <Text style={[styles.noPaymentsText, { color: colors.text }]}>Нет доступных платежей</Text>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Оплата обучения</Text>

            <TextInput
              style={[styles.input, {
                color: colors.text,
                borderColor: colors.text,
                backgroundColor: colors.cardBackground,
              }]}
              placeholder="Сумма"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={paymentData.amount.toString()}
              onChangeText={(text) => {
                const numericValue = parseFloat(text) || 0;
                const maxAmount = userDetails?.payForStudying || 0;
                const newAmount = Math.min(numericValue, maxAmount);
                setPaymentData({ ...paymentData, amount: newAmount });
              }}
            />

            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.text,
                backgroundColor: colors.cardBackground 
              }]}
              placeholder="Номер карты"
              placeholderTextColor={colors.textSecondary}
              value={paymentData.cardNumber}
              onChangeText={(text) => setPaymentData({ ...paymentData, cardNumber: text })}
            />

            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.text,
                backgroundColor: colors.cardBackground 
              }]}
              placeholder="CVV"
              placeholderTextColor={colors.textSecondary}
              value={paymentData.cvv}
              onChangeText={(text) => setPaymentData({ ...paymentData, cvv: text })}
            />

            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.text,
                backgroundColor: colors.cardBackground 
              }]}
              placeholder="Срок действия (MM/YY)"
              placeholderTextColor={colors.textSecondary}
              value={paymentData.expiryDate}
              onChangeText={(text) => setPaymentData({ ...paymentData, expiryDate: text })}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handlePaymentSubmit}
              >
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Оплатить</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 16,
    marginVertical: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  paymentItem: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  paymentText: {
    fontSize: 14,
  },
  studentText: {
    fontSize: 14,
    marginVertical: 2,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    fontSize: 16,
  },
  modalButtonContainer: {
    marginTop: 15,
    gap: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noPaymentsText: {
    textAlign: 'center',
    marginVertical: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;

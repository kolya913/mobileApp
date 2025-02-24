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
            <Text style={styles.bold}>Группа:</Text> {userDetails.groups ? userDetails.groups[0]?.name : 'Не назначено'}
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
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Посмотреть оплаты</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          {loadingPayments ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>История платежей</Text>
              {userPayments.length > 0 ? (
                <FlatList
                  data={userPayments}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPaymentItem}
                />
              ) : (
                <Text style={[styles.noPaymentsText, { color: colors.text }]}>Нет доступных платежей</Text>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Оплата</Text>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.text }]}
              placeholder="Сумма"
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
              style={[styles.input, { color: colors.text, borderColor: colors.text }]}
              placeholder="Номер карты"
              value={paymentData.cardNumber}
              onChangeText={(text) => setPaymentData({ ...paymentData, cardNumber: text })}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.text }]}
              placeholder="CVV"
              value={paymentData.cvv}
              onChangeText={(text) => setPaymentData({ ...paymentData, cvv: text })}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.text }]}
              placeholder="Срок действия (MM/YY)"
              value={paymentData.expiryDate}
              onChangeText={(text) => setPaymentData({ ...paymentData, expiryDate: text })}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handlePaymentSubmit}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Оплатить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    marginBottom: 30,
  },
  userInfoText: {
    fontSize: 16,
    marginVertical: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  noPaymentsText: {
    fontSize: 16,
    marginVertical: 20,
  },
  paymentItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 14,
    marginVertical: 2,
  },
  studentText: {
    fontSize: 14,
    marginVertical: 2,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
  },
});

export default ProfileScreen;
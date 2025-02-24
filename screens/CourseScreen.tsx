import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import useCourse from '../hooks/useCourse';
import { useTheme } from '../hooks/ThemeContext';
import { themes } from '../theme/Styles';
import { useAuthInternetConnection } from '../hooks/useAuthInternetConnection';

const CourseScreen = ({ route }: { route: any }) => {
  const { userId } = route.params;

  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];
  const { isAuthenticated, roles } = useAuthInternetConnection();

  const [hasCourseRole, setHasCourseRole] = useState(false);
  const [updatingElement, setUpdatingElement] = useState<number | null>(null);
  const { course, loading, error, toggleElementVisibility } = useCourse(userId);

  const normalizedRoles = Array.isArray(roles) ? roles : [roles];

  useEffect(() => {
    if (normalizedRoles.includes('THEORY_INSTRUCTOR')) {
      setHasCourseRole(true);
    } else {
      setHasCourseRole(false);
    }
  }, [roles]);

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить курс');
    }
  }, [error]);

  const fadeAnims = useRef<{ [key: number]: Animated.Value }>({});

  useMemo(() => {
    if (course?.elements) {
      course.elements.forEach((element) => {
        if (!fadeAnims.current[element.id]) {
          fadeAnims.current[element.id] = new Animated.Value(1);
        }
      });
    }
  }, [course]);

  const toggleVisibility = async (elementId: number) => {
    setUpdatingElement(elementId);
    try {
      await toggleElementVisibility(elementId);
    } finally {
      setUpdatingElement(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Загрузка...</Text>
      </View>
    );
  }

  if (course) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{course.name}</Text>
        {course.elements && course.elements.length > 0 ? (
          <View style={styles.elementsContainer}>
            {course.elements.map((element) => {
              const fadeAnim = fadeAnims.current[element.id];

              const handlePress = () => {
                Animated.timing(fadeAnim, {
                  toValue: 0.5,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  toggleVisibility(Number(element.id));
                  fadeAnim.setValue(1);
                });
              };

              return (
                <Animated.View
                  key={element.id}
                  style={[
                    styles.element,
                    { backgroundColor: colors.card, opacity: fadeAnim },
                  ]}
                >
                  <Text style={[styles.elementTitle, { color: colors.text }]}>
                    {element.type}
                  </Text>
                  <Text style={{ color: colors.text }}>{element.content}</Text>

                  {hasCourseRole && (
                    <TouchableOpacity
                      style={styles.visibilityButton}
                      onPress={handlePress}
                      disabled={updatingElement === element.id}
                    >
                      {updatingElement === element.id ? (
                        <ActivityIndicator color={colors.text} />
                      ) : (
                        <Text style={{ fontSize: 24, color: colors.text }}>
                          {element.visible ? '👁️' : '🙈'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <Text style={{ color: colors.text }}>Элементы курса не найдены</Text>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  elementsContainer: {
    marginTop: 20,
    width: '100%',
  },
  element: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elementTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  visibilityButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default CourseScreen;
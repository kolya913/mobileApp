import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  questionStates: (boolean | null)[];
  colors: any;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ questionStates, colors }) => {
  const generateSegments = () => {
    return questionStates.map((state, index) => {
      let backgroundColor = '#ccc';

      if (state === true) {
        backgroundColor = '#4caf50';
      } else if (state === false) {
        backgroundColor = '#f44336';
      }

      return (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        />
      );
    });
  };

  return (
    <View>
      <View style={styles.progressBar}>{generateSegments()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
  },
  segment: {
    width: '4%',
    height: 10,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default ProgressBar;

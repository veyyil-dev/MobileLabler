import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <View style={styles.loadingOverlay}>
      <BlurView intensity={50} style={styles.blurView}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Processing...</Text>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurView: {
    width: 150,
    height: 100,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
  },
});

export default LoadingOverlay; 
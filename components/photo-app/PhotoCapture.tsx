import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SimpleGradient } from './Header';

interface PhotoCaptureProps {
  takePictureWithCamera: () => Promise<void>;
  pickImage: () => Promise<void>;
  cameraError: string | null;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ 
  takePictureWithCamera, 
  pickImage, 
  cameraError 
}) => {
  return (
    <>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={takePictureWithCamera}
        >
          <SimpleGradient
            colors={['#00c6ff', '#0072ff']}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.mainActionButtonText}>📸 Take a Photo</Text>
          </SimpleGradient>
        </TouchableOpacity>
        
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity 
            style={styles.secondaryActionButton}
            onPress={pickImage}
          >
            <SimpleGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>🖼️ Pick Image</Text>
            </SimpleGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      {cameraError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {cameraError}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    width: '90%',
    marginBottom: 20,
  },
  mainActionButton: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mainActionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center', 
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PhotoCapture; 
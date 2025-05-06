import React from 'react';
import {
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { SimpleGradient } from './Header';

// Create a conditional ViewShot wrapper component
const ConditionalViewShot = ({ children, forwardedRef, ...props }: any) => {
  if (Platform.OS === 'web') {
    // On web, just render the children without ViewShot
    return <View ref={forwardedRef}>{children}</View>;
  }
  
  // On native platforms, use ViewShot
  return <ViewShot ref={forwardedRef} {...props}>{children}</ViewShot>;
};

interface PhotoEditorProps {
  photo: { uri: string } | null;
  label: string;
  setLabel: (label: string) => void;
  setFolderName: (name: string) => void;
  saveLabeledPhoto: () => Promise<void>;
  uploadToGoogleDrive: () => Promise<void>;
  isAndroid: boolean;
  viewShotRef: React.RefObject<any>;
  isUploading: boolean;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photo,
  label,
  setLabel,
  setFolderName,
  saveLabeledPhoto,
  uploadToGoogleDrive,
  isAndroid,
  viewShotRef,
  isUploading
}) => {
  return (
    <>
      <View style={styles.inputsContainer}>
        <Text style={styles.inputLabel}>Label for Photo</Text>
        <TextInput
          placeholder="Enter a descriptive label"
          value={label}
          onChangeText={(text) => {
            setLabel(text);
            setFolderName(text);
          }}
          style={styles.input}
          placeholderTextColor="#999"
        />
      </View>

      {photo && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <ConditionalViewShot forwardedRef={viewShotRef} options={{ format: 'jpg', quality: isAndroid ? 0.7 : 0.9 }}>
            <View style={styles.photoFrame}>
              <ImageBackground
                source={photo}
                style={styles.image}
              />
            </View>
          </ConditionalViewShot>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveLabeledPhoto}
            >
              <SimpleGradient
                colors={['#11998e', '#38ef7d']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.buttonText}>💾 Save to Device</Text>
              </SimpleGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.driveButton} 
              onPress={uploadToGoogleDrive}
              disabled={isUploading}
            >
              <SimpleGradient
                colors={['#4285F4', '#34A853']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.buttonText}>☁️ Save to Drive</Text>
              </SimpleGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  inputsContainer: {
    width: '90%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  previewContainer: {
    marginTop: 10,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  photoFrame: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    marginBottom: 20,
  },
  image: {
    width: 280,
    height: 280,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  driveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center', 
  },
});

export default PhotoEditor; 
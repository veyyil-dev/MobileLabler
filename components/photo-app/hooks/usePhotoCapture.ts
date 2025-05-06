import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export const usePhotoCapture = () => {
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [label, setLabel] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('LabeledPhotos');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const takePictureWithCamera = async () => {
    setCameraError(null);
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setCameraError('Camera permission denied');
        Alert.alert('Permission Denied', 'Camera access required');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
  
      if (!result.canceled && result.assets?.[0]?.uri) {
        // No need for additional cropping as the built-in editor is used
        setPhoto({ uri: result.assets[0].uri });
        
        if (!label) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          setLabel(`Photo_${timestamp}`);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Failed to capture image');
    }
  };

  const pickImage = async () => {
    // Reset any previous errors
    setCameraError(null);
    
    try {
      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // If already edited with the built-in picker, we can skip the additional cropping
        setPhoto({ uri: result.assets[0].uri });
        
        // If no label is set, extract a name from the original file
        if (!label) {
          const uriParts = result.assets[0].uri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          const baseName = fileName.split('.')[0];
          setLabel(baseName);
          setFolderName(baseName);
        }
      }
    } catch (error) {
      console.error('Error picking or cropping image:', error);
      setCameraError('Failed to pick or crop image');
      Alert.alert('Error', 'Failed to pick or crop image from library');
    }
  };
  
  const cropImage = async (imageUri: string) => {
    try {
      // We're not defining a specific crop area to enable free cropping
      return await ImageManipulator.manipulateAsync(
        imageUri,
        [], // Empty actions array to skip automatic cropping
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
    } catch (error) {
      console.error('Image cropper error:', error);
      // Fallback to original image if cropping fails
      return { uri: imageUri };
    }
  };

  const resetPhoto = () => {
    setPhoto(null);
    setLabel('');
    setCameraError(null);
  };

  return {
    photo,
    setPhoto,
    label,
    setLabel,
    folderName,
    setFolderName,
    cameraError,
    setCameraError,
    takePictureWithCamera,
    pickImage,
    cropImage,
    resetPhoto
  };
};

export default usePhotoCapture; 
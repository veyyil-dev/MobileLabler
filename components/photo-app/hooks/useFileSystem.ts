import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { Alert, Platform, Share } from 'react-native';

// Conditionally import PermissionsAndroid only for non-web platforms
const PermissionsAndroidModule = Platform.OS !== 'web' ? require('react-native').PermissionsAndroid : null;

export const useFileSystem = () => {
  const [rootFolder, setRootFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveToGallery = async (photo: { uri: string } | null, folderName: string) => {
    if (!photo) {
      Alert.alert('Error', 'No photo to save');
      return;
    }
    
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const timestamp = `${monthName.toLowerCase()}_${year}`;
    const deviceName = Device.modelName
      ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'unknown_device';
    const fileName = `${deviceName}_${timestamp}.jpg`;
    const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
  
    await FileSystem.copyAsync({
      from: photo?.uri || '',
      to: tempUri,
    });
  
    const asset = await MediaLibrary.createAssetAsync(tempUri);
    const album = await MediaLibrary.getAlbumAsync(folderName);
  
    if (album === null) {
      await MediaLibrary.createAlbumAsync(folderName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
  
    Alert.alert('Success', `Photo saved to "${folderName}" album in your gallery`, [{ text: 'OK' }]);
  };
  
  const saveToCustomLocation = async (photo: { uri: string } | null, folderName: string) => {
    if (!photo) {
      Alert.alert('Error', 'No photo to save');
      return;
    }
    
    try {
      // If root folder is already selected, use it
      if (rootFolder) {
        const timestamp = new Date().getTime();
        const deviceName = Device.modelName
          ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          : 'unknown_device';
        const fileName = `${deviceName}_${timestamp}.jpg`;
        const destinationUri = `${rootFolder}/${fileName}`;

        await FileSystem.copyAsync({
          from: photo?.uri || '',
          to: destinationUri,
        });

        Alert.alert('Success', `Photo saved to your selected root folder`, [{ text: 'OK' }]);
        return;
      }
      
      // For Android, use DocumentPicker to select a directory
      if (Platform.OS === 'android') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          multiple: false,
        });
        
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        
        const selectedAsset = result.assets[0];
        if (!selectedAsset.uri) return;

        const timestamp = new Date().getTime();
        const deviceName = Device.modelName
          ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          : 'unknown_device';
        const fileName = `${deviceName}_${timestamp}.jpg`;
        const destinationUri = `${selectedAsset.uri.split('/').slice(0, -1).join('/')}/${fileName}`;

        await FileSystem.copyAsync({
          from: photo?.uri || '',
          to: destinationUri,
        });

        Alert.alert('Success', `Photo saved to custom location: ${selectedAsset.name || 'selected folder'}`, [{ text: 'OK' }]);  
      } else {
        // For iOS, we can only suggest saving to Files app
        const shareResult = await Share.share({
          url: photo?.uri || '',
          message: 'Save this photo to your desired location',
        });

        if (shareResult.action === Share.sharedAction) {
          Alert.alert('Success', 'Photo saved to selected location', [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('Error saving to custom location:', error);
      Alert.alert(
        'Error',
        `Failed to save to custom location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const saveToRootFolder = async (photo: { uri: string } | null, label: string) => {
    if (!photo || !rootFolder) {
      Alert.alert('Error', 'No photo or root folder set');
      return;
    }
    
    try {
      const timestamp = new Date().getTime();
      const deviceName = Device.modelName
        ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'unknown_device';
      const fileName = `${deviceName}_${timestamp}.jpg`;
      const destinationUri = `${rootFolder}/${fileName}`;

      await FileSystem.copyAsync({
        from: photo?.uri || '',
        to: destinationUri,
      });

      Alert.alert('Success', `Photo saved to your root folder`, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error saving to root folder:', error);
      Alert.alert('Error', 'Failed to save to root folder');
    }
  };

  const selectRootFolder = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/*', // Allow any file type to select folders
          multiple: false,
          copyToCacheDirectory: false,
        });
        
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        
        const selectedAsset = result.assets[0];
        if (!selectedAsset.uri) return;

        // Get the folder path by removing the file name from the URI
        const folderPath = selectedAsset.uri.split('/').slice(0, -1).join('/');
        setRootFolder(folderPath);
        
        Alert.alert(
          'Root Folder Set', 
          `All photos will be saved to: ${selectedAsset.name ? selectedAsset.name.split('/').pop() || 'selected folder' : 'selected folder'}`
        );
      } else {
        // For iOS, explain the limitation
        Alert.alert(
          'iOS Limitation',
          'On iOS, you can only select save locations when actually saving a file.'
        );
      }
    } catch (error) {
      console.error('Error selecting root folder:', error);
      Alert.alert('Error', 'Could not select folder');
    }
  };

  const saveLabeledPhoto = async (photo: { uri: string } | null, label: string, folderName: string) => {
    if (!photo) {
      Alert.alert('Error', 'No photo to save');
      return;
    }
  
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a label for the photo');
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
        if (mediaLibraryStatus !== 'granted') {
          throw new Error('Media Library permission denied');
        }
  
        if (Platform.Version < 33) {
          const storageStatus = await PermissionsAndroidModule.request(
            PermissionsAndroidModule.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to storage to save photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
  
          if (storageStatus !== PermissionsAndroidModule.RESULTS.GRANTED) {
            throw new Error('Storage permission denied');
          }
        }
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media Library permission denied');
        }
      }
  
      // Prepare save options
      const saveOptions = [
        {
          text: 'Device Gallery',
          onPress: async () => await saveToGallery(photo, folderName),
        },
        {
          text: 'Custom Location',
          onPress: async () => await saveToCustomLocation(photo, label),
        }
      ];
      
      // Add root folder option if it's set
      if (rootFolder) {
        saveOptions.unshift({
          text: 'Root Folder',
          onPress: async () => await saveToRootFolder(photo, label),
        });
      }
      
      saveOptions.push({
        text: 'Cancel',
        onPress: async () => { return; },
      });

      // Show save options dialog
      await Alert.alert(
        'Save Location',
        'Where would you like to save the photo?',
        saveOptions
      );
  
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert(
        'Error',
        `Failed to save photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rootFolder,
    isLoading,
    saveLabeledPhoto,
    selectRootFolder,
    saveToGallery,
    saveToCustomLocation,
    saveToRootFolder
  };
};

export default useFileSystem; 
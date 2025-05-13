import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';
// @ts-ignore - Importing react-native-file-access

import  {ImagePicker} from 'expo-image-picker';
import Sharing from 'expo-sharing';
import {StorageAccessFramework} from 'expo-file-system';



const FileAccess = require('react-native-file-access');

// Conditionally import PermissionsAndroid only for non-web platforms
const PermissionsAndroidModule = Platform.OS !== 'web' ? require('react-native').PermissionsAndroid : null;

const ROOT_FOLDER_ID = 'my_photo_app_root_folder_v1';

console.log(ROOT_FOLDER_ID);


interface DirectoryInfo {
  uri: string;
  name: string;
}

async function requestPermission(directoryId: string): Promise<DirectoryInfo | null> {
  try {
    // Check if we're running in Expo Go
    if (Platform.OS === 'android' && !ScopedStorage.openDocumentTree) {
      Alert.alert(
        'Development Build Required',
        'To use folder selection, you need to create a development build. For now, you can save photos to your device gallery.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Use the correct method to open directory picker with persistable flag
    const dir = await ScopedStorage.openDocumentTree(true);
    if (!dir) {
      Alert.alert('Error', 'No directory selected');
      return null;
    }

    const dirInfo = { 
      uri: dir.uri, 
      name: dir.name || 'Selected Folder'
    };
    await AsyncStorage.setItem(directoryId, JSON.stringify(dirInfo));
    return dirInfo;
  } catch (error) {
    console.error('Error requesting permission:', error);
    Alert.alert('Error', 'Failed to access directory');
    return null;
  }
}

async function getAndroidDir(directoryId: string): Promise<DirectoryInfo | null> {
  try {
    // Check if we have a saved directory
    let dirStr = await AsyncStorage.getItem(directoryId);
    if (!dirStr) {
      // If no saved directory, request new permission
      const dir = await requestPermission(directoryId);
      if (!dir) return null;
      dirStr = JSON.stringify(dir);
    }

    const dir = JSON.parse(dirStr) as DirectoryInfo;
    
    // Verify we still have permission
    try {
      const persistedUris = await ScopedStorage.getPersistedUriPermissions();
      console.log('Persisted URIs:', persistedUris);
      
      if (persistedUris.indexOf(dir.uri) !== -1) {
        // Make sure we can actually access this directory
        try {
          // Check if we can list the directory contents
          const contents = await ScopedStorage.listFiles(dir.uri);
          console.log(`Verified access to ${dir.name} - found ${contents.length} files/folders`);
          return dir;
        } catch (accessError) {
          console.log(`Access check for ${dir.uri} failed:`, accessError);
          // We don't have actual access, request permission again
        }
      } else {
        console.log(`Permission for ${dir.uri} not found in persisted URIs`);
      }
    } catch (error) {
      console.log('Error checking permissions:', error);
    }

    // If permission check fails, request new permission
    return await requestPermission(directoryId);
  } catch (e) {
    console.error('Error getting directory:', e);
    Alert.alert('Error', 'Could not access directory');
    return null;
  }
}

export const useFileSystem = () => {
  const [rootFolder, setRootFolder] = useState<string | null>(null);
  const [rootFolderName, setRootFolderName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load saved root folder on initialization
  useEffect(() => {
    const loadSavedRootFolder = async () => {
      try {
        const savedDirStr = await AsyncStorage.getItem(ROOT_FOLDER_ID);
        if (savedDirStr) {
          const savedDir = JSON.parse(savedDirStr) as DirectoryInfo;
          setRootFolder(savedDir.uri);
          setRootFolderName(savedDir.name);
          console.log('Loaded saved root folder:', savedDir.name);
        }
      } catch (error) {
        console.error('Error loading saved root folder:', error);
      }
    };

    loadSavedRootFolder();
  }, []);

 const saveToGallery = async (photoUri: string, labelName: string) => {
  try {
      
      const uri = photoUri;
      // Request access to external directory
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert("Permission denied", "Cannot save file without permissions");
        return;
      }
      // Create folders: classifier/sjersey (if not exists)
      const classifierFolderUri = await StorageAccessFramework.makeDirectoryAsync(
        permissions.directoryUri,
        'classifier'
      );

      const sjerseyFolderUri = await StorageAccessFramework.makeDirectoryAsync(
        classifierFolderUri,
        labelName
      );

      // Define file name
      const filename = `image.jpg`;

      // Read file into base64
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save file using SAF
      const savedFileUri = await StorageAccessFramework.createFileAsync(
        sjerseyFolderUri,
        filename,
        'image/jpeg'
      );

      await FileSystem.writeAsStringAsync(savedFileUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Success", "Image saved successfully!");

      // Optional: Share immediately
      // await Sharing.shareAsync(savedFileUri);

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert("Error", "Could not save image: " + errorMessage);
    }
};



 const saveImageToPublicFolder = async (photoUrl:string , labelName : string) => {
    try {
      
      const uri = photoUrl;
      // Request access to external directory
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert("Permission denied", "Cannot save file without permissions");
        return;
      }
      // Create folders: classifier/sjersey (if not exists)
      const classifierFolderUri = await StorageAccessFramework.makeDirectoryAsync(
        permissions.directoryUri,
        'classifier'
      );

      const sjerseyFolderUri = await StorageAccessFramework.makeDirectoryAsync(
        classifierFolderUri,
        'sjersey'
      );

      // Define file name
      const filename = `image.jpg`;

      // Read file into base64
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save file using SAF
      const savedFileUri = await StorageAccessFramework.createFileAsync(
        sjerseyFolderUri,
        filename,
        'image/jpeg'
      );

      await FileSystem.writeAsStringAsync(savedFileUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Success", "Image saved successfully!");

      // Optional: Share immediately
      // await Sharing.shareAsync(savedFileUri);

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert("Error", "Could not save image: " + errorMessage);
    }
  }

  const saveToExternalFolder = async (photo: { uri: string } | null, directory: string = 'downloads') => {
    if (!photo) {
      Alert.alert('Error', 'No photo to save');
      return;
    }
    try {
      const timestamp = new Date().getTime();
      const deviceName = Device.modelName
        ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'unknown_device';
      const fileName = `${deviceName}_${timestamp}.jpg`;

      // Use FileAccess.Dirs.CacheDir if needed for temporary storage
      await FileAccess.copyFile(photo.uri, `${directory}/${fileName}`);

      Alert.alert('Success', `Photo saved to ${directory}/${fileName}`);
    } catch (error) {
      console.error('Error saving to external folder:', error);
      Alert.alert('Error', 'Failed to save to external folder');
    }
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

        // If rootFolder is a content URI, use ScopedStorage
        if (rootFolder.startsWith('content://')) {
          const fileData = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
          await ScopedStorage.writeFile(
            rootFolder,
            fileName,
            'image/jpeg',
            fileData,
            'base64'
          );
        } else {
          // Otherwise, use FileSystem.copyAsync
          const destinationUri = `${rootFolder}/${fileName}`;
          await FileSystem.copyAsync({
            from: photo?.uri || '',
            to: destinationUri,
          });
        }

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

        // Use FileSystem.copyAsync only for file:// URIs
        if (destinationUri.startsWith('file://')) {
          await FileSystem.copyAsync({
            from: photo?.uri || '',
            to: destinationUri,
          });
        } else {
          // Otherwise, use ScopedStorage
          const fileData = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
          await ScopedStorage.writeFile(
            selectedAsset.uri,
            fileName,
            'image/jpeg',
            fileData,
            'base64'
          );
        }

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

const saveToRootFolder = async (photo: { uri: string } | null, label: string, rootFolder: string) => {
  if (!photo || !rootFolder) {
    Alert.alert('Error', 'No photo or root folder set');
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const deviceName = Device.modelName
      ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'unknown_device';

    const fileName = `${deviceName}_${dateStr}.jpg`;
    const folderName = label.trim() || 'Untitled';

    // Create subfolder inside selected root
    const subfolder = await ScopedStorage.createDirectory(rootFolder, folderName);
    if (!subfolder?.uri) throw new Error('Failed to create subfolder');

    // Create file inside subfolder
    const imageFile = await ScopedStorage.createFile(
      subfolder.uri,
      fileName,
      'image/jpeg'
    );
    if (!imageFile?.uri) throw new Error('Failed to create image file');

    // Read binary file as blob (not base64!)
    const response = await fetch(photo.uri);
    const blob = await response.blob();

    // Write binary data to file using 'blob' mode
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result?.toString().split(',')[1] || '';
      await ScopedStorage.writeFile(imageFile.uri, 'image/jpeg', base64data, 'base64');
    };
    reader.readAsDataURL(blob);

    Alert.alert('Success', `Photo saved to ${folderName}/${fileName}`);
  } catch (error: any) {
    console.error('Error saving photo:', error);
    Alert.alert('Error', error.message || 'Failed to save photo');
  }
};




  const selectRootFolder = async () => {
    try {
      if (Platform.OS === 'android') {
        // Check if we're running in Expo Go
        if (!ScopedStorage.openDocumentTree) {
          Alert.alert(
            'Development Build Required',
            'To use folder selection, you need to create a development build. For now, you can save photos to your device gallery.',
            [{ text: 'OK' }]
          );
          return;
        }

        // If we already have a root folder, offer to change or keep it
        if (rootFolder && rootFolderName) {
          // Verify we still have permission to the current folder
          let hasPermission = false;
          try {
            const persistedUris = await ScopedStorage.getPersistedUriPermissions();
            hasPermission = persistedUris.indexOf(rootFolder) !== -1;
            
            // Try to list files as an additional permission check
            if (hasPermission) {
              await ScopedStorage.listFiles(rootFolder);
            }
          } catch (error) {
            console.log('Permission verification error:', error);
            hasPermission = false;
          }
          
          // If we don't have permission, inform the user
          if (!hasPermission) {
            Alert.alert(
              'Permission Issue',
              'The previously selected folder is no longer accessible. Please select a new folder.',
              [
                {
                  text: 'Select New Folder',
                  onPress: async () => {
                    const dir = await getAndroidDir(ROOT_FOLDER_ID);
                    if (!dir) {
                      Alert.alert('Error', 'Could not select folder');
                      return;
                    }
                    setRootFolder(dir.uri);
                    setRootFolderName(dir.name);
                    Alert.alert(
                      'Root Folder Updated',
                      `All photos will be saved to: ${dir.name || 'selected folder'}`
                    );
                  }
                }
              ]
            );
            return;
          }

          Alert.alert(
            'Root Folder',
            `Current folder: ${rootFolderName}\n\nWhat would you like to do?`,
            [
              {
                text: 'Keep Current Folder',
                style: 'cancel'
              },
              {
                text: 'Select New Folder',
                onPress: async () => {
                  const dir = await getAndroidDir(ROOT_FOLDER_ID);
                  if (!dir) {
                    Alert.alert('Error', 'Could not select folder');
                    return;
                  }
                  setRootFolder(dir.uri);
                  setRootFolderName(dir.name);
                  Alert.alert(
                    'Root Folder Updated',
                    `All photos will be saved to: ${dir.name || 'selected folder'}`
                  );
                }
              },
              {
                text: 'Clear Root Folder',
                style: 'destructive',
                onPress: async () => {
                  await AsyncStorage.removeItem(ROOT_FOLDER_ID);
                  setRootFolder(null);
                  setRootFolderName(null);
                  Alert.alert('Root Folder Cleared', 'You can select a new folder when needed');
                }
              }
            ]
          );
          return;
        }

        // If no root folder is set, select a new one
        const dir = await getAndroidDir(ROOT_FOLDER_ID);
        if (!dir) {
          Alert.alert('Error', 'Could not select folder');
          return;
        }

        setRootFolder(dir.uri);
        setRootFolderName(dir.name);
        Alert.alert(
          'Root Folder Set',
          `All photos will be saved to: ${dir.name || 'selected folder'}`
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
          onPress: async () => await saveToGallery(photo.uri, folderName),
        },
        {
          text: 'Pictures Folder',
          onPress: async () => {
            try {
              // Create folder name from label (or default if empty)
              const albumName = folderName.trim() || 'PhotoApp';
              
              // Create a better filename with device and date
              const now = new Date();
              const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
              const deviceName = Device.modelName
                ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
                : 'unknown_device';
              const fileName = `${deviceName}_${dateStr}.jpg`;
              
              // Create the folder if it doesn't exist
              const picturesPath = FileAccess.Dirs.PictureDir;
              const albumFolder = `${picturesPath}/${albumName}`;
              try {
                await FileAccess.mkdir(albumFolder);
              } catch (mkdirError) {
                // Folder might already exist
                console.log('Folder creation error (might exist):', mkdirError);
              }
              
              // Copy the photo to the album folder
              const destPath = `${albumFolder}/${fileName}`;
              await FileAccess.copyFile(photo.uri, destPath);
              
              // Register with media library to show in gallery
              try {
                await MediaLibrary.createAssetAsync(destPath);
              } catch (mediaError) {
                console.log('Error adding to media library:', mediaError);
              }
              
              Alert.alert('Success', `Photo saved to Pictures/${albumName}/${fileName}`, [{ text: 'OK' }]);
            } catch (error) {
              console.error('Error saving to Pictures folder:', error);
              Alert.alert('Error', 'Failed to save to Pictures folder. Trying gallery instead...');
              // Fall back to gallery
              await saveToGallery(photo.uri, folderName);
            }
          }
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
          onPress: async () => await saveToRootFolder(photo, label, rootFolder!),
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
    rootFolderName,
    isLoading,
    saveLabeledPhoto,
    selectRootFolder,
    saveToGallery,
    saveToCustomLocation,
    saveToRootFolder,
    saveToExternalFolder,
  };
};

export default useFileSystem;
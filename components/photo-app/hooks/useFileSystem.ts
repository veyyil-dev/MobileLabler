import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Alert, Platform, Share, ToastAndroid } from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';
// @ts-ignore - Importing react-native-file-access
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

  const saveToGallery = async (photo: { uri: string } | null, folderName: string) => {
    if (!photo) {
      Alert.alert('Error', 'No photo to save');
      return;
    }
    
    // Create folder name (default if empty)
    const albumName = folderName.trim() || 'PhotoApp';
    
    // Create a better filename with device and date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const deviceName = Device.modelName
      ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'unknown_device';
    const fileName = `${deviceName}_${dateStr}.jpg`;
    const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
  
    await FileSystem.copyAsync({
      from: photo?.uri || '',
      to: tempUri,
    });
  
    const asset = await MediaLibrary.createAssetAsync(tempUri);
    const album = await MediaLibrary.getAlbumAsync(albumName);
  
    if (album === null) {
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
  
    Alert.alert('Success', `Photo saved to "${albumName}" album in your gallery`, [{ text: 'OK' }]);
  };

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

  const saveToRootFolder = async (photo: { uri: string } | null, label: string) => {
    if (!photo || !rootFolder) {
      Alert.alert('Error', 'No photo or root folder set');
      return;
    }

    try {
      console.log(`=== SAVING TO ROOT FOLDER ===`);
      console.log(`Root folder URI: ${rootFolder}`);
      console.log(`Root folder name: ${rootFolderName || 'Unknown'}`);
      console.log(`Label (subfolder name): ${label}`);
      
      // Show toast on Android to indicate we're working
      if (Platform.OS === 'android') {
        ToastAndroid.show('Saving photo...', ToastAndroid.SHORT);
      }
      
      // Create a better filename with device and date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const deviceName = Device.modelName
        ? Device.modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'unknown_device';
      
      // IMPORTANT: Exact filename format that should be used
      const exactFileName = `${deviceName}_${dateStr}.jpg`;
      console.log(`Using exact filename: ${exactFileName}`);
      
      // Create folder name from label (or default if empty)
      const folderName = label.trim() || 'Untitled';
      console.log(`Using folder name: ${folderName}`);

      // First, create a temporary copy of the photo with proper MIME type
      const tempUri = `${FileSystem.cacheDirectory}${exactFileName}`;
      console.log(`Temp file path: ${tempUri}`);
      
      // Attempt to create a proper image file
      try {
        // First, ensure image is in JPEG format with proper extension
        const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
        
        // Create a proper JPEG with no compression/manipulation
        const manipResult = await manipulateAsync(
          photo.uri,
          [], // no manipulations
          { format: SaveFormat.JPEG }
        );
        
        console.log(`Created manipulated image: ${manipResult.uri}`);
        
        // Save directly to the temp path
        await FileSystem.copyAsync({
          from: manipResult.uri,
          to: tempUri
        });
        
        console.log(`Copied to temporary location: ${tempUri}`);
      } catch (imageError) {
        console.log(`Image manipulation failed: ${imageError}`);
        // Direct copy as fallback
        await FileSystem.copyAsync({
          from: photo.uri,
          to: tempUri
        });
        console.log(`Used direct copy instead: ${tempUri}`);
      }
      
      // Now that we have a properly formatted image, let's save it to the root folder
      if (rootFolder.startsWith('content://')) {
        // CONTENT URI APPROACH - Android Scoped Storage
        console.log(`Using content URI approach`);
        
        try {
          // Read the file as base64
          const fileData = await FileSystem.readAsStringAsync(tempUri, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          console.log(`Read temp file as base64 data - ${fileData.length} bytes`);
          
          // Verify permissions and try to get a fresh permission if needed
          try {
            // First, check if we have permission
            const persistedUris = await ScopedStorage.getPersistedUriPermissions();
            let currentRootUri = rootFolder;
            
            if (persistedUris.indexOf(rootFolder) === -1) {
              console.log(`Permission for ${rootFolder} not found! Requesting new permission...`);
              // Show tooltip for user
              if (Platform.OS === 'android') {
                ToastAndroid.show('Refreshing folder permissions...', ToastAndroid.SHORT);
              }
              
              const newDir = await getAndroidDir(ROOT_FOLDER_ID);
              if (newDir && newDir.uri) {
                console.log(`Using newly requested folder: ${newDir.uri}`);
                setRootFolder(newDir.uri);
                setRootFolderName(newDir.name);
                currentRootUri = newDir.uri;
              } else {
                throw new Error("Permission to write to this folder was revoked. Please select the folder again.");
              }
            } else {
              console.log(`Permission verified for ${rootFolder}`);
            }
            
            // ===== DIRECT DOCUMENT APPROACH =====
            // Try to create a file directly using the DocumentFile API
            console.log(`Trying to create file using DocumentFile API`);
            
            try {
              // First check if we can access the root directory by listing files
              try {
                const fileList = await ScopedStorage.listFiles(currentRootUri);
                console.log(`Can access directory, contains ${fileList.length} items`);
              } catch (listError) {
                console.log(`Cannot list files in ${currentRootUri}:`, listError);
                throw new Error("Directory access failed. Please select a different folder.");
              }
              
              // Attempt to create a file in the root directory first as a test
              const testFile = await ScopedStorage.createFile(
                currentRootUri,
                "test.txt",
                "text/plain"
              );
              
              if (testFile && testFile.uri) {
                console.log(`Test file created successfully at: ${testFile.uri}`);
                
                // Write some test data
                await ScopedStorage.writeFile(
                  testFile.uri,
                  "This is a test file",
                  "text/plain",
                  "This is a test file",
                  "utf8"
                );
                
                // Clean up the test file
                await ScopedStorage.deleteFile(testFile.uri);
                console.log(`Test file deleted`);
              }
              
              // Now try to create a subfolder
              let targetUri = currentRootUri;
              let finalFilename = exactFileName;
              
              // Try to create and use a subfolder if possible
              try {
                const subfolder = await ScopedStorage.createDirectory(currentRootUri, folderName);
                if (subfolder && subfolder.uri) {
                  console.log(`Created subfolder: ${subfolder.uri}`);
                  targetUri = subfolder.uri;
                } else {
                  console.log(`Could not create subfolder, using root folder`);
                  // Use the folderName in the filename instead
                  finalFilename = `${folderName}_${exactFileName}`;
                }
              } catch (folderError) {
                console.log(`Error creating subfolder: ${folderError}`);
                // Use the folderName in the filename instead
                finalFilename = `${folderName}_${exactFileName}`;
              }
              
              // Create the image file
              const imageFile = await ScopedStorage.createFile(
                targetUri,
                finalFilename,
                "image/jpeg"
              );
              
              if (imageFile && imageFile.uri) {
                console.log(`Image file created at: ${imageFile.uri}`);
                
                // Write the image data
                await ScopedStorage.writeFile(
                  imageFile.uri,
                  "image/jpeg",
                  fileData,
                  "base64"
                );
                
                console.log(`Image data written successfully`);
                
                // Show success message
                if (targetUri !== currentRootUri) {
                  Alert.alert('Success', `Photo saved to ${folderName}/${finalFilename}`, [{ text: 'OK' }]);
                } else {
                  Alert.alert('Success', `Photo saved as ${finalFilename}`, [{ text: 'OK' }]);
                }
                
                return;
              } else {
                throw new Error("Failed to create image file");
              }
            } catch (documentError) {
              console.error(`DocumentFile approach failed: ${documentError}`);
              
              // Fall back to simpler approaches
              // Try direct file write with a simple filename
              const simpleFile = `photo_${Math.floor(Math.random() * 10000)}.jpg`;
              console.log(`Trying simple file approach with: ${simpleFile}`);
              
              await ScopedStorage.writeFile(
                currentRootUri,
                simpleFile,
                'image/jpeg',
                fileData,
                'base64'
              );
              
              console.log(`SAVED FILE with simple name`);
              Alert.alert('Success', `Photo saved as ${simpleFile}`, [{ text: 'OK' }]);
              return;
            }
          } catch (permError) {
            console.error(`Permission verification failed: ${permError}`);
            throw permError;
          }
        } catch (contentError) {
          console.error(`ALL content URI approaches failed: ${contentError}`);
          
          // Fall back to Pictures directory
          try {
            // Create folder in Pictures directory
            const picturesPath = `${FileAccess.Dirs.PictureDir}/${folderName}`;
            console.log(`Falling back to Pictures directory: ${picturesPath}`);
            
            await FileAccess.mkdir(picturesPath);
            const pictureFile = `${picturesPath}/${exactFileName}`;
            await FileAccess.copyFile(tempUri, pictureFile);
            
            // Add to media library for visibility
            await MediaLibrary.createAssetAsync(pictureFile);
            
            console.log(`Successfully saved to Pictures directory: ${pictureFile}`);
            Alert.alert('Success', `Photo saved to Pictures/${folderName}/${exactFileName} (Root folder failed)`, [{ text: 'OK' }]);
            return;
          } catch (picturesError) {
            console.error(`Pictures directory fallback failed: ${picturesError}`);
            throw contentError; // Let the outer catch handle the original error
          }
        }
      } else {
        // FILE URI APPROACH - Direct File Access
        console.log(`Using file URI approach`);
        
        try {
          // Create subfolder path
          const subfolderPath = `${rootFolder}/${folderName}`;
          console.log(`Attempting to create folder at: ${subfolderPath}`);
          
          // Create folder
          await FileAccess.mkdir(subfolderPath);
          console.log(`Successfully created folder at: ${subfolderPath}`);
          
          // Save file to subfolder
          const finalPath = `${subfolderPath}/${exactFileName}`;
          console.log(`Saving file to: ${finalPath}`);
          
          await FileAccess.copyFile(tempUri, finalPath);
          console.log(`Successfully copied file to: ${finalPath}`);
          
          // Try to add to media library for visibility
          try {
            const asset = await MediaLibrary.createAssetAsync(finalPath);
            console.log(`Successfully added to media library: ${asset.uri}`);
          } catch (mediaError) {
            console.log(`Failed to add to media library: ${mediaError}`);
            // Not critical
          }
          
          Alert.alert('Success', `Photo saved to ${folderName}/${exactFileName}`, [{ text: 'OK' }]);
        } catch (fileError) {
          console.error(`File URI approach failed: ${fileError}`);
          
          // Fall back to Pictures directory
          const picturesPath = `${FileAccess.Dirs.PictureDir}/${folderName}`;
          try {
            console.log(`Falling back to Pictures directory: ${picturesPath}`);
            await FileAccess.mkdir(picturesPath);
            const pictureFile = `${picturesPath}/${exactFileName}`;
            await FileAccess.copyFile(tempUri, pictureFile);
            
            // Add to media library
            await MediaLibrary.createAssetAsync(pictureFile);
            
            console.log(`Successfully saved to Pictures directory: ${pictureFile}`);
            Alert.alert('Success', `Photo saved to Pictures/${folderName}/${exactFileName}`, [{ text: 'OK' }]);
          } catch (picturesError) {
            console.error(`Pictures directory fallback failed: ${picturesError}`);
            // Last resort: Save to gallery directly
            await saveToGallery(photo, folderName);
          }
        }
      }
    } catch (error) {
      console.error(`Critical error in saveToRootFolder: ${error}`);
      
      // Provide more helpful error message to user
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Could not save to selected folder';
        
      Alert.alert(
        'Error Saving Photo', 
        `${errorMsg}\n\nWould you like to try another location?`,
        [
          {
            text: 'Try Gallery',
            onPress: async () => {
              try {
                await saveToGallery(photo, label);
              } catch (galleryError) {
                console.error(`Even gallery save failed: ${galleryError}`);
                Alert.alert('Error', 'Could not save photo anywhere. Please check app permissions.');
              }
            }
          },
          {
            text: 'Select New Folder',
            onPress: async () => {
              await AsyncStorage.removeItem(ROOT_FOLDER_ID);
              setRootFolder(null);
              setRootFolderName(null);
              
              // Clear old permissions if possible
              try {
                await ScopedStorage.releasePersistableUriPermission(rootFolder);
              } catch (e) {
                // Ignore errors when trying to release
              }
              
              // Request new directory
              const dir = await getAndroidDir(ROOT_FOLDER_ID);
              if (dir) {
                // Try to save again
                setTimeout(() => {
                  saveToRootFolder(photo, label);
                }, 500);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
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
          onPress: async () => await saveToGallery(photo, folderName),
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
              await saveToGallery(photo, folderName);
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
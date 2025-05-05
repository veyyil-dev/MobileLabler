// import CameraRoll from '@react-native-community/cameraroll';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

// Conditionally import PermissionsAndroid only for non-web platforms
const PermissionsAndroid = Platform.OS !== 'web' ? require('react-native').PermissionsAndroid : null;

// Check if running on Android
const isAndroid = Platform.OS === 'android';

// Create a conditional ViewShot wrapper component
const ConditionalViewShot = ({ children, forwardedRef, ...props }: any) => {
  if (Platform.OS === 'web') {
    // On web, just render the children without ViewShot
    return <View ref={forwardedRef}>{children}</View>;
  }
  
  // On native platforms, use ViewShot
  return <ViewShot ref={forwardedRef} {...props}>{children}</ViewShot>;
};

export default function CameraExample() {
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [label, setLabel] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('LabeledPhotos');
  const [googleDriveFolder, setGoogleDriveFolder] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [galleryVisible, setGalleryVisible] = useState<boolean>(false);
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appReady, setAppReady] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;

  // Replace the current useEffect with useLayoutEffect for early client detection
  useLayoutEffect(() => {
    // This runs before the component mounts in the client
    setIsMounted(true);
  }, []);

  // Keep the setupApp in a separate useEffect that depends on isMounted
  useEffect(() => {
    // Skip running on server
    if (!isMounted) return;
    
    // Initialize app with permissions check
    const setupApp = async () => {
      try {
        // Request media library permission
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          setCameraError('Media library permission denied');
        }

        // Request MediaLibrary permissions
        const { status: mediaLibStatus } = await MediaLibrary.requestPermissionsAsync();
        if (mediaLibStatus !== 'granted') {
          console.log('MediaLibrary permission denied');
        }
        
        // Mark app as ready for rendering
        setAppReady(true);
        
        // Simplified animation for Android
        if (isAndroid) {
          // Use a simple opacity change without animation on Android
          opacity.setValue(1);
        } else {
          // Use animation only on iOS for better performance
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error("Error setting up app:", error);
        setAppReady(true); // Ensure we show something even on error
        opacity.setValue(1);
      }
    };
    
    setupApp();
  }, [isMounted]);

  // useEffect(() => {
  //   // Initialize Google Sign-In
  //   GoogleSignin.configure({
  //     // Client ID from user's credentials
  //     webClientId: '1040205303673-hpk91ep7qm96u46tuiqfjmet7f00m2v3.apps.googleusercontent.com',
  //     offlineAccess: true,
  //     forceCodeForRefreshToken: true,
  //     scopes: ['https://www.googleapis.com/auth/drive.file'],
  //   });

  //   // Check if user is already signed in
  //   checkIsSignedIn();
  // }, []);

  // const checkIsSignedIn = async () => {
  //   try {
  //     // Use as any to work around TypeScript definition issues
  //     const googleSignin = GoogleSignin as any;
  //     const isSignedIn = await googleSignin.isSignedIn();
  //     if (isSignedIn) {
  //       getCurrentUserInfo();
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to check if user is signed in:', error);
  //   }
  // };

  // const getCurrentUserInfo = async () => {
  //   try {
  //     const userInfo = await GoogleSignin.signInSilently();
  //     setUserInfo(userInfo);
  //   } catch (error: any) {
  //     if (error.code === statusCodes.SIGN_IN_REQUIRED) {
  //       // User hasn't signed in yet
  //       setUserInfo(null);
  //     } else {
  //       console.error('Failed to get user info:', error);
  //     }
  //   }
  // };

  // const signIn = async () => {
  //   try {
  //     setIsSigninInProgress(true);
  //     await GoogleSignin.hasPlayServices();
  //     const userInfo = await GoogleSignin.signIn();
  //     setUserInfo(userInfo);
  //     setIsSigninInProgress(false);
  //   } catch (error: any) {
  //     setIsSigninInProgress(false);
  //     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
  //       // User cancelled the sign-in flow
  //     } else if (error.code === statusCodes.IN_PROGRESS) {
  //       // Sign-in already in progress
  //     } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
  //       Alert.alert('Error', 'Play services not available');
  //     } else {
  //       Alert.alert('Error', 'Failed to sign in: ' + error.message);
  //     }
  //   }
  // };

  // const signOut = async () => {
  //   try {
  //     await GoogleSignin.signOut();
  //     setUserInfo(null);
  //   } catch (error: any) {
  //     console.error('Failed to sign out:', error);
  //   }
  // };

  const requestStoragePermission = async () => {
    // Web platform doesn't need storage permissions in the same way
    if (Platform.OS === 'web') {
      return true;
    }
    
    // For Android, request permissions
    if (Platform.OS === 'android' && PermissionsAndroid) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    
    // For iOS, no explicit permission needed
    return true;
  };

  const loadGalleryAssets = async (afterCursor?: string) => {
    try {
      setIsLoading(true);
      // Request MediaLibrary permissions again just to be sure
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Cannot access your media library');
        setIsLoading(false);
        return;
      }
      
      // Get all photos from media library - reduce number on Android for performance
      const options: MediaLibrary.AssetsOptions = {
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: isAndroid ? 12 : 20, // Load fewer images on Android
      };
      
      if (afterCursor) {
        options.after = afterCursor;
      }
      
      const result = await MediaLibrary.getAssetsAsync(options);
      console.log(`Loaded ${result.assets.length} assets, has next page: ${result.hasNextPage}`);
      
      // If first load, replace assets, otherwise append
      if (!afterCursor) {
        setGalleryAssets(result.assets);
      } else {
        setGalleryAssets(prev => [...prev, ...result.assets]);
      }
      
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading gallery assets:', error);
      Alert.alert('Error', 'Failed to load gallery images');
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    await loadGalleryAssets();
    setGalleryVisible(true);
  };

  const selectGalleryImage = (asset: MediaLibrary.Asset) => {
    setPhoto({ uri: asset.uri });
    setGalleryVisible(false);
  };

  const pickImage = async () => {
    // Reset any previous errors
    setCameraError(null);
    
    try {
      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // If no label is set, extract a name from the original file
        if (!label) {
          // Get original filename from uri
          const uriParts = result.assets[0].uri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          // Remove extension
          const baseName = fileName.split('.')[0];
          setLabel(baseName);
          setFolderName(baseName);
        }
        
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setCameraError('Failed to pick image');
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };
  
  const takePictureWithCamera = async () => {
    // Reset any previous errors
    setCameraError(null);
    
    try {
      // Request camera permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setCameraError('Camera permission denied');
        Alert.alert(
          'Permission Denied', 
          'Camera permission is required. Please enable it in settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // If no label is set, use a timestamp as a default name
        if (!label) {
          const timestamp = new Date().toLocaleString().replace(/[\/\s:,]/g, '_');
          const defaultName = `Photo_${timestamp}`;
          setLabel(defaultName);
          setFolderName(defaultName);
        }
        
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      setCameraError('Failed to take picture');
      Alert.alert('Error', 'Failed to take picture with camera');
    }
  };

  const saveLabeledPhoto = async () => {
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
      // 1. Request permissions (Android only)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to save photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Storage permission denied');
        }
      }
  
      // 2. Create folder named after the label
      const sanitizedLabel = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const directory = `${FileSystem.documentDirectory}LabeledPhotos/${sanitizedLabel}/`;
      
      // Create parent directory if it doesn't exist
      const parentDirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}LabeledPhotos/`);
      if (!parentDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}LabeledPhotos/`, { intermediates: true });
      }
      
      // Create label-specific directory
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
  
      // 3. Generate filename and path
      const timestamp = new Date().getTime();
      const fileName = `image_${timestamp}.jpg`; // or `${sanitizedLabel}_${timestamp}.jpg`
      const fileUri = `${directory}${fileName}`;
  
      // 4. Copy the photo to the new location
      await FileSystem.copyAsync({
        from: photo.uri,
        to: fileUri,
      });
  
      // 5. (Optional) Save to device's gallery
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync(sanitizedLabel, asset, false);
        }
      } catch (galleryError) {
        console.log('Saved to app storage but not gallery:', galleryError);
      }
  
      // 6. Show success message
      Alert.alert(
        'Success', 
        `Photo saved in "${sanitizedLabel}" folder as "${fileName}"`,
        [{ text: 'OK' }]
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

  const uploadToGoogleDrive = async () => {
    // Simplified version that just alerts the user
    Alert.alert(
      'Google Drive Upload',
      'To enable Google Drive uploads, we need to complete the native module setup. For now, you can save to your device folder.',
      [
        {
          text: 'OK',
          style: 'default',
        },
        {
          text: 'Learn More',
          onPress: () => Linking.openURL('https://github.com/react-native-google-signin/google-signin/blob/master/docs/android-guide.md'),
        },
      ]
    );
  };

  const renderGalleryItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const imageSize = (screenWidth - 40) / 3;
    return (
      <TouchableOpacity 
        onPress={() => selectGalleryImage(item)}
        style={styles.galleryImageContainer}
      >
        <Image
          source={{ uri: item.uri }}
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: 8,
          }}
        />
      </TouchableOpacity>
    );
  };

  // Gallery modal component
  const GalleryModal = () => (
    <Modal
      visible={galleryVisible}
      animationType="slide"
      onRequestClose={() => setGalleryVisible(false)}
      statusBarTranslucent
    >
      <View style={styles.galleryContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
          style={styles.galleryHeader}
        >
          <Text style={styles.galleryTitle}>Photo Gallery</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setGalleryVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
        
        <FlatList
          data={galleryAssets}
          renderItem={renderGalleryItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.galleryList}
          onEndReached={() => {
            if (hasNextPage && endCursor && !isLoading) {
              loadGalleryAssets(endCursor);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#4285F4" style={styles.loader} /> : null}
        />
      </View>
    </Modal>
  );

  // Loading overlay
  const LoadingOverlay = () => {
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

  // Simplified gradient component for Android to improve performance
  const SimpleGradient = ({ 
    colors, 
    style, 
    children 
  }: { 
    colors: readonly string[], 
    style: any, 
    children: React.ReactNode 
  }) => {
    if (isAndroid) {
      // On Android, use a simple View instead of LinearGradient for better performance
      return (
        <View style={[style, { backgroundColor: colors[0] }]}>
          {children}
        </View>
      );
    }
    
    // On iOS, use the full LinearGradient
    return (
      <LinearGradient
        colors={colors as any}
        style={style}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {children}
      </LinearGradient>
    );
  };

  if (typeof window === 'undefined' || !isMounted) {
    // This will render during SSR (server side rendering) or before hydration
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.mainContainer, { opacity }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          removeClippedSubviews={isAndroid} // Performance optimization for Android
        >
          <SimpleGradient
            colors={['#4e54c8', '#8f94fb']}
            style={styles.header}
          >
            <Text style={styles.title}>Photo Labeler</Text>
            <Text style={styles.subtitle}>Capture, label, and organize your photos</Text>
          </SimpleGradient>

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
              
              {/* <TouchableOpacity 
                style={styles.secondaryActionButton}
                onPress={openGallery}
              >
                <SimpleGradient
                  colors={['#ff9a9e', '#fad0c4']}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>📱 Browse Gallery</Text>
                </SimpleGradient>
              </TouchableOpacity> */}
            </View>
          </View>
          
          {cameraError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {cameraError}</Text>
            </View>
          )}

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

            {/* <Text style={styles.inputLabel}>Save to Folder</Text>
            <TextInput
              placeholder="Folder name for saving photos"
              value={folderName}
              onChangeText={setFolderName}
              style={styles.input}
              placeholderTextColor="#999"
            /> */}
          </View>

        

          {photo && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview</Text>
              <ConditionalViewShot forwardedRef={viewShotRef} options={{ format: 'jpg', quality: isAndroid ? 0.7 : 0.9 }}>
                <View style={styles.photoFrame}>
                  <ImageBackground
                    source={photo}
                    style={styles.image}
                  
                  >
                    {/* {label && (
                      <View style={styles.labelContainer}>
                        <Text style={styles.label}>{label}</Text>
                      </View>
                    )} */}
                  </ImageBackground>
                </View>
                {/* <Text style={styles.fileNameText}>{label}.jpg</Text> */}
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
        </ScrollView>
      </Animated.View>
      
      <GalleryModal />
      <LoadingOverlay />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 40 : 60, // Adjust for Android
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '90%',
    marginBottom: 20,
  },
  mainActionButton: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    // Simplified shadows for Android
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
    // Simplified shadows for Android
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
    // Simplified shadows for Android
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
  previewContainer: {
    marginTop: 10,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    // Simplified shadows for Android
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
    // Simplified shadows for Android
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
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
    maxWidth: '90%',
  },
  label: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
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
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  galleryList: {
    padding: 10,
  },
  galleryImageContainer: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
    // Simplified shadows for Android
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
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
  loader: {
    padding: 20,
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
});

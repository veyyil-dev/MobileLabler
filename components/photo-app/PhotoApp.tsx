import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    DrawerLayoutAndroid,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// Components
import DrawerMenu from './DrawerMenu';
import GalleryModal from './GalleryModal';
import Header from './Header';
import LoadingOverlay from './LoadingOverlay';
import PhotoCapture from './PhotoCapture';
import PhotoEditor from './PhotoEditor';

// Hooks
import useFileSystem from './hooks/useFileSystem';
import useMediaLibrary from './hooks/useMediaLibrary';
import usePhotoCapture from './hooks/usePhotoCapture';

// Check if running on Android
const isAndroid = Platform.OS === 'android';

const PhotoApp: React.FC = () => {
  // Animation and UI state
  const [appReady, setAppReady] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<any>(null);
  const drawerRef = useRef<DrawerLayoutAndroid>(null);
  
  // Additional state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Custom hooks
  const { 
    photo, label, folderName, cameraError, 
    setLabel, setFolderName, takePictureWithCamera, pickImage 
  } = usePhotoCapture();
  
  const {
    galleryAssets, hasNextPage, endCursor, galleryVisible,
    isLoading: galleryLoading, loadGalleryAssets, showGallery, hideGallery
  } = useMediaLibrary(isAndroid);
  
  const {
    rootFolder, isLoading: fileSystemLoading, 
    saveLabeledPhoto, selectRootFolder
  } = useFileSystem();

  // Combined loading state
  const isLoading = galleryLoading || fileSystemLoading || isUploading;

  // Replace the current useEffect with useLayoutEffect for early client detection
  useLayoutEffect(() => {
    // This runs before the component mounts in the client
    setIsMounted(true);
  }, []);

  // Initialize with permissions check
  useEffect(() => {
    // Skip running on server
    if (!isMounted) return;
    
    const setupApp = async () => {
      try {
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

  // Gallery image selection handler
  const selectGalleryImage = (asset: MediaLibrary.Asset) => {
    hideGallery();
  };

  // Google Drive upload handler (dummy)
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

  // Photo save handler
  const handleSavePhoto = async () => {
    await saveLabeledPhoto(photo, label, folderName);
  };

  // Main app UI
  const renderMainContent = () => (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.mainContainer, { opacity }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          removeClippedSubviews={isAndroid} // Performance optimization for Android
        >
          <Header 
            openDrawer={() => drawerRef.current?.openDrawer()} 
            isAndroid={isAndroid} 
          />

          <PhotoCapture 
            takePictureWithCamera={takePictureWithCamera}
            pickImage={pickImage}
            cameraError={cameraError}
          />

          <PhotoEditor
            photo={photo}
            label={label}
            setLabel={setLabel}
            setFolderName={setFolderName}
            saveLabeledPhoto={handleSavePhoto}
            uploadToGoogleDrive={uploadToGoogleDrive}
            isAndroid={isAndroid}
            viewShotRef={viewShotRef}
            isUploading={isUploading}
          />
        </ScrollView>
      </Animated.View>
      
      <GalleryModal 
        visible={galleryVisible}
        onClose={hideGallery}
        galleryAssets={galleryAssets}
        onSelectImage={selectGalleryImage}
        hasNextPage={hasNextPage}
        loadMoreAssets={loadGalleryAssets}
        endCursor={endCursor}
        isLoading={galleryLoading}
      />
      
      <LoadingOverlay isLoading={isLoading} />
    </>
  );

  // Wrap content in drawer for Android, or just return content for iOS
  if (typeof window === 'undefined' || !isMounted) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Use drawer on Android, regular view on iOS
  if (Platform.OS === 'android') {
    return (
      <DrawerLayoutAndroid
        ref={drawerRef}
        drawerWidth={280}
        drawerPosition="left"
        renderNavigationView={() => (
          <DrawerMenu
            closeDrawer={() => drawerRef.current?.closeDrawer()}
            takePictureWithCamera={takePictureWithCamera}
            pickImage={pickImage}
            selectRootFolder={selectRootFolder}
            saveLabeledPhoto={handleSavePhoto}
            rootFolder={rootFolder}
            hasPhoto={!!photo}
          />
        )}
      >
        {renderMainContent()}
      </DrawerLayoutAndroid>
    );
  } else {
    return renderMainContent();
  }
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  }
});

export default PhotoApp; 
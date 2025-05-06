import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useMediaLibrary = (isAndroid: boolean) => {
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [galleryVisible, setGalleryVisible] = useState<boolean>(false);

  useEffect(() => {
    if (galleryVisible) {
      loadGalleryAssets();
    }
  }, [galleryVisible]);

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

  const showGallery = () => {
    setGalleryVisible(true);
  };

  const hideGallery = () => {
    setGalleryVisible(false);
  };

  return {
    galleryAssets,
    hasNextPage,
    endCursor,
    isLoading,
    galleryVisible,
    loadGalleryAssets,
    showGallery,
    hideGallery
  };
};

export default useMediaLibrary; 
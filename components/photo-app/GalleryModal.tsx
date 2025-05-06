import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface GalleryModalProps {
  visible: boolean;
  onClose: () => void;
  galleryAssets: MediaLibrary.Asset[];
  onSelectImage: (asset: MediaLibrary.Asset) => void;
  hasNextPage: boolean;
  loadMoreAssets: (endCursor?: string) => Promise<void>;
  endCursor?: string;
  isLoading: boolean;
}

const GalleryModal: React.FC<GalleryModalProps> = ({
  visible,
  onClose,
  galleryAssets,
  onSelectImage,
  hasNextPage,
  loadMoreAssets,
  endCursor,
  isLoading
}) => {
  const screenWidth = Dimensions.get('window').width;
  
  const renderGalleryItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const imageSize = (screenWidth - 40) / 3;
    return (
      <TouchableOpacity 
        onPress={() => onSelectImage(item)}
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
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
            onPress={onClose}
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
              loadMoreAssets(endCursor);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#4285F4" style={styles.loader} /> : null}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  loader: {
    padding: 20,
  },
});

export default GalleryModal; 
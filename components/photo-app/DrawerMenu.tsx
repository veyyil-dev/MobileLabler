import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DrawerMenuProps {
  closeDrawer: () => void;
  takePictureWithCamera: () => Promise<void>;
  pickImage: () => Promise<void>;
  selectRootFolder: () => Promise<void>;
  saveLabeledPhoto: () => Promise<void>;
  rootFolder: string | null;
  hasPhoto: boolean;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  closeDrawer,
  takePictureWithCamera,
  pickImage,
  selectRootFolder,
  saveLabeledPhoto,
  rootFolder,
  hasPhoto
}) => {
  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Photo Labeler</Text>
        <Text style={styles.drawerSubtitle}>Menu Options</Text>
      </View>
      
      <View style={styles.drawerContent}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            takePictureWithCamera();
          }}
        >
          <Text style={styles.drawerItemIcon}>📸</Text>
          <Text style={styles.drawerItemText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            pickImage();
          }}
        >
          <Text style={styles.drawerItemIcon}>🖼️</Text>
          <Text style={styles.drawerItemText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <View style={styles.drawerDivider} />
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            selectRootFolder();
          }}
        >
          <Text style={styles.drawerItemIcon}>📁</Text>
          <Text style={styles.drawerItemText}>Select Folder</Text>
        </TouchableOpacity>
        
        {rootFolder && (
          <View style={styles.rootFolderInfo}>
            <Text style={styles.rootFolderLabel}>Root Folder:</Text>
            <Text style={styles.rootFolderPath} numberOfLines={2} ellipsizeMode="middle">
              {rootFolder}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            if (hasPhoto) {
              saveLabeledPhoto();
            } else {
              Alert.alert("No Photo", "Please take or select a photo first");
            }
          }}
        >
          <Text style={styles.drawerItemIcon}>💾</Text>
          <Text style={styles.drawerItemText}>Save Current Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            Alert.alert(
              "About",
              "Photo Labeler App\nVersion 1.0\n\nThis app allows you to capture, label, and organize your photos."
            );
          }}
        >
          <Text style={styles.drawerItemIcon}>ℹ️</Text>
          <Text style={styles.drawerItemText}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#4e54c8',
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  drawerItemIcon: {
    fontSize: 24,
    marginRight: 20,
    width: 30,
    textAlign: 'center',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#dddddd',
    marginVertical: 10,
  },
  rootFolderInfo: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  rootFolderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rootFolderPath: {
    fontSize: 14,
    color: '#333',
  },
});

export default DrawerMenu; 
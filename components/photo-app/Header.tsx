import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  openDrawer: () => void;
  isAndroid: boolean;
}

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
  if (Platform.OS === 'android') {
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

const Header: React.FC<HeaderProps> = ({ openDrawer, isAndroid }) => {
  return (
    <SimpleGradient
      colors={['#4e54c8', '#8f94fb']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {isAndroid && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openDrawer}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>Photo Labeler</Text>
          <Text style={styles.subtitle}>Capture, label, and organize your photos</Text>
        </View>
      </View>
    </SimpleGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    marginBottom: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  menuButton: {
    padding: 10,
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 24,
    color: 'white',
  },
});

export { SimpleGradient };
export default Header; 
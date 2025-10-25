import { View, useWindowDimensions, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

export function ResponsiveContainer({ 
  children, 
  maxWidth = 1000,
  style 
}: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  
  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: width > maxWidth ? maxWidth : width,
    alignSelf: 'center',
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

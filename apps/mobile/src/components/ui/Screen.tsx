import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Extra classes for the content container. */
  className?: string;
  contentContainerStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scroll = false,
  className = '',
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={[{ padding: 20, flexGrow: 1 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className={className}>{children}</View>
    </ScrollView>
  ) : (
    <View className={`flex-1 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { Pressable, ScrollView, Text, View } from 'react-native';

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mr-2 rounded-full border px-3.5 py-2 ${
        selected
          ? 'border-brand bg-brand'
          : 'border-[#E2E8E4] bg-surface'
      }`}
    >
      <Text
        className={`text-sm ${selected ? 'text-white font-semibold' : 'text-ink-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface Option<T extends string> {
  value: T;
  label: string;
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  allowClear = true,
}: {
  options: Option<T>[];
  value: T | undefined;
  onChange: (next: T | undefined) => void;
  allowClear?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-1 px-1"
    >
      <View className="flex-row py-1">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onPress={() =>
              onChange(allowClear && value === opt.value ? undefined : opt.value)
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}

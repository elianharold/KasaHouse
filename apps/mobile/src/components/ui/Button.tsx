import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from 'react-native';
import { colors } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  /** Helper text shown under the button, e.g. why it is disabled. */
  hint?: string;
}

const base =
  'flex-row items-center justify-center rounded-xl px-5 py-3.5 active:opacity-80';

const styles: Record<Variant, { container: string; text: string; spinner: string }> = {
  primary: { container: 'bg-brand', text: 'text-white font-semibold', spinner: '#fff' },
  secondary: {
    container: 'bg-brand-light border border-brand/20',
    text: 'text-brand-dark font-semibold',
    spinner: colors.brand,
  },
  ghost: { container: 'bg-transparent', text: 'text-brand-dark font-semibold', spinner: colors.brand },
  danger: { container: 'bg-danger', text: 'text-white font-semibold', spinner: '#fff' },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  hint,
  disabled,
  ...rest
}: ButtonProps) {
  const s = styles[variant];
  const isDisabled = disabled || loading;

  return (
    <View className={fullWidth ? 'w-full' : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled, busy: loading }}
        disabled={isDisabled}
        className={`${base} ${s.container} ${isDisabled ? 'opacity-50' : ''}`}
        {...rest}
      >
        {loading ? <ActivityIndicator color={s.spinner} className="mr-2" /> : null}
        <Text className={s.text}>{label}</Text>
      </Pressable>
      {hint ? (
        <Text className="mt-1.5 text-center text-xs text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}

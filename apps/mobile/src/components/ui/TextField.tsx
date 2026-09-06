import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { colors } from '../../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, hint, ...rest }, ref) => (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkFaint}
        className={`rounded-xl border bg-surface px-4 py-3 text-base text-ink ${
          error ? 'border-danger' : 'border-[#E2E8E4]'
        }`}
        {...rest}
      />
      {error ? (
        <Text className="mt-1 text-xs text-danger">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  ),
);
TextField.displayName = 'TextField';

interface ControlledProps<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  hint?: string;
  /** For number fields — parse the string before storing in the form. */
  transform?: (raw: string) => unknown;
}

export function ControlledTextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  transform,
  ...rest
}: ControlledProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextField
      label={label}
      hint={hint}
      error={fieldState.error?.message}
      value={
        field.value === undefined || field.value === null
          ? ''
          : String(field.value)
      }
      onBlur={field.onBlur}
      onChangeText={(text) => field.onChange(transform ? transform(text) : text)}
      {...rest}
    />
  );
}

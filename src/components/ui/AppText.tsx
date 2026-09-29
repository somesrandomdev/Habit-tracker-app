import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/tokens';

type Variant = 'title' | 'heading' | 'body' | 'caption' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'text' | 'dim' | 'faint' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  align?: TextStyle['textAlign'];
}

const SIZES: Record<Variant, number> = {
  title: typography.title,
  heading: typography.heading,
  body: typography.body,
  caption: typography.caption,
  label: typography.label,
};

const WEIGHTS: Record<NonNullable<AppTextProps['weight']>, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function AppText({
  variant = 'body',
  weight = 'regular',
  color = 'text',
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const colorMap: Record<string, string> = {
    text: colors.text,
    dim: colors.textDim,
    faint: colors.textFaint,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    accent: colors.accent,
  };
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: SIZES[variant],
          fontWeight: WEIGHTS[weight],
          color: colorMap[color],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}

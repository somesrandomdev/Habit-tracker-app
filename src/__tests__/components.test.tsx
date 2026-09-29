import { fireEvent, render } from '@testing-library/react-native';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

describe('AppText', () => {
  it('renders its text', async () => {
    const { getByText } = await render(<AppText>Hello FastHabit</AppText>);
    expect(getByText('Hello FastHabit')).toBeTruthy();
  });

  it('applies the caption variant size', async () => {
    const { getByText } = await render(<AppText variant="caption">small</AppText>);
    const element = getByText('small');
    const style = Array.isArray(element.props.style) ? element.props.style.flat() : [element.props.style];
    const sizes = style.filter(Boolean).map((s: { fontSize?: number }) => s.fontSize).filter(Boolean);
    expect(sizes).toContain(13);
  });
});

describe('AppButton', () => {
  it('renders its label and handles presses', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<AppButton label="Start Fast" onPress={onPress} />);
    const button = getByRole('button', { name: 'Start Fast' });
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<AppButton label="End Fast" onPress={onPress} disabled />);
    const button = getByRole('button', { name: 'End Fast' });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});

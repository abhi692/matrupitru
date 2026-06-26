import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, radius } from '../theme';

export default function Select({ value, onValueChange, items, placeholder = 'Select...' }) {
  return (
    <View style={s.wrap}>
      <Picker selectedValue={value} onValueChange={onValueChange} style={s.picker}>
        <Picker.Item label={placeholder} value="" />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, marginBottom: 4, overflow: 'hidden' },
  picker: { height: 50 },
});

import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme';

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
  wrap: { borderWidth: 1, borderColor: colors.stone200, borderRadius: 10, marginBottom: 4, backgroundColor: colors.white, overflow: 'hidden' },
  picker: { height: 50 },
});

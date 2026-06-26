import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import HomeScreen from '../screens/parent/HomeScreen';

import DashboardScreen from '../screens/buyer/DashboardScreen';
import VisitDetailScreen from '../screens/buyer/VisitDetailScreen';
import SosScreen from '../screens/buyer/SosScreen';
import BookScreen from '../screens/buyer/BookScreen';
import BillingScreen from '../screens/buyer/BillingScreen';
import MessagesScreen from '../screens/buyer/MessagesScreen';

import ConsoleScreen from '../screens/caremanager/ConsoleScreen';
import FieldAppScreen from '../screens/caregiver/FieldAppScreen';
import AdminConsoleScreen from '../screens/admin/AdminConsoleScreen';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VisitDetail" component={VisitDetailScreen} options={{ title: 'Visit' }} />
    </Stack.Navigator>
  );
}

// Buyer is the only role with enough distinct screens to warrant tabs; the
// others (Care Manager, Caregiver, Admin, Parent) are single scrollable
// screens, same as their web counterparts.
function BuyerTabs() {
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: colors.brand600, headerShown: false }}>
      <Tabs.Screen name="Home" component={DashboardStack} />
      <Tabs.Screen name="Book" component={BookScreen} />
      <Tabs.Screen name="Billing" component={BillingScreen} />
      <Tabs.Screen name="Messages" component={MessagesScreen} />
      <Tabs.Screen name="SOS" component={SosScreen} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user.role === 'buyer' && <BuyerTabs />}
      {user.role === 'care_manager' && <ConsoleScreen />}
      {user.role === 'caregiver' && <FieldAppScreen />}
      {user.role === 'admin' && <AdminConsoleScreen />}
      {user.role === 'parent' && <HomeScreen />}
    </NavigationContainer>
  );
}

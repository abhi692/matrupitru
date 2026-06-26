import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import HomeScreen from '../screens/parent/HomeScreen';

import DashboardScreen from '../screens/buyer/DashboardScreen';
import VisitDetailScreen from '../screens/buyer/VisitDetailScreen';
import SosScreen from '../screens/buyer/SosScreen';
import BookScreen from '../screens/buyer/BookScreen';
import BillingScreen from '../screens/buyer/BillingScreen';
import MessagesScreen from '../screens/buyer/MessagesScreen';

import AlertsScreen from '../screens/caremanager/AlertsScreen';
import FamiliesScreen from '../screens/caremanager/FamiliesScreen';
import ScheduleScreen from '../screens/caremanager/ScheduleScreen';
import CmChatScreen from '../screens/caremanager/ChatScreen';

import TodayScreen from '../screens/caregiver/TodayScreen';
import HistoryScreen from '../screens/caregiver/HistoryScreen';

import OverviewScreen from '../screens/admin/OverviewScreen';
import CaregiversScreen from '../screens/admin/CaregiversScreen';
import AuditScreen from '../screens/admin/AuditScreen';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabBarOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarStyle: { borderTopColor: colors.separator, height: 58, paddingTop: 6, paddingBottom: 8 },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
};

function icon(name) {
  return ({ color, size }) => <Ionicons name={name} size={size} color={color} />;
}

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VisitDetail" component={VisitDetailScreen} options={{ title: 'Visit', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  );
}

function BuyerTabs() {
  return (
    <Tabs.Navigator screenOptions={tabBarOptions}>
      <Tabs.Screen name="Home" component={DashboardStack} options={{ tabBarIcon: icon('home') }} />
      <Tabs.Screen name="Book" component={BookScreen} options={{ tabBarIcon: icon('add-circle-outline') }} />
      <Tabs.Screen name="Billing" component={BillingScreen} options={{ tabBarIcon: icon('card-outline') }} />
      <Tabs.Screen name="Chat" component={MessagesScreen} options={{ tabBarIcon: icon('chatbubble-ellipses-outline') }} />
      <Tabs.Screen name="SOS" component={SosScreen} options={{ tabBarIcon: icon('warning-outline'), tabBarActiveTintColor: colors.danger }} />
    </Tabs.Navigator>
  );
}

function CareManagerTabs() {
  return (
    <Tabs.Navigator screenOptions={tabBarOptions}>
      <Tabs.Screen name="Alerts" component={AlertsScreen} options={{ tabBarIcon: icon('notifications-outline') }} />
      <Tabs.Screen name="Families" component={FamiliesScreen} options={{ tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="Chat" component={CmChatScreen} options={{ tabBarIcon: icon('chatbubble-ellipses-outline') }} />
    </Tabs.Navigator>
  );
}

function CaregiverTabs() {
  return (
    <Tabs.Navigator screenOptions={tabBarOptions}>
      <Tabs.Screen name="Today" component={TodayScreen} options={{ tabBarIcon: icon('today-outline') }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: icon('time-outline') }} />
    </Tabs.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tabs.Navigator screenOptions={tabBarOptions}>
      <Tabs.Screen name="Overview" component={OverviewScreen} options={{ tabBarIcon: icon('stats-chart-outline') }} />
      <Tabs.Screen name="Caregivers" component={CaregiversScreen} options={{ tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="Audit" component={AuditScreen} options={{ tabBarIcon: icon('document-text-outline') }} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user.role === 'buyer' && <BuyerTabs />}
      {user.role === 'care_manager' && <CareManagerTabs />}
      {user.role === 'caregiver' && <CaregiverTabs />}
      {user.role === 'admin' && <AdminTabs />}
      {user.role === 'parent' && <HomeScreen />}
    </NavigationContainer>
  );
}

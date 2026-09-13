import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';
import { Bell, Home, MessageCircle, Search } from 'lucide-react-native';
export default function TabLayout() {
  const [accent, muted, background, border] = useThemeColor([
    'accent',
    'muted',
    'background',
    'border',
  ]);
  const options = {
    headerShown: false,
    tabBarActiveTintColor: accent,
    tabBarInactiveTintColor: muted,
    tabBarHideOnKeyboard: true,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
    tabBarStyle: {
      backgroundColor: background,
      borderTopColor: border,
      height: 64,
      paddingTop: 7,
      paddingBottom: 7,
    },
  };
  return (
    <>
      {/* Expo StatusBar accepts a bar-style string rather than a React style object. */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style="dark" />
      <Tabs screenOptions={options}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="dms"
          options={{
            title: 'DMs',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}

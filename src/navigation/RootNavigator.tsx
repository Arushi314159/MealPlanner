import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MealPlanScreen from '../screens/MealPlanScreen';
import RecipesScreen from '../screens/RecipesScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootTabParamList = {
  MealPlan: undefined;
  Recipes: undefined;
  GroceryList: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  MealPlan: 'calendar-outline',
  Recipes: 'book-outline',
  GroceryList: 'cart-outline',
  Profile: 'person-outline',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name as keyof RootTabParamList]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="MealPlan" component={MealPlanScreen} options={{ title: 'Meal Plan' }} />
        <Tab.Screen name="Recipes" component={RecipesScreen} />
        <Tab.Screen name="GroceryList" component={GroceryListScreen} options={{ title: 'Grocery List' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

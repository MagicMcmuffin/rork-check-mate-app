// template
import { Tabs } from "expo-router";
import { ClipboardList, FileText, Users, Building2 } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1e293b",
          borderTopWidth: 1,
          borderTopColor: "#334155",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inspections",
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vehicle-inspection"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="company"
        options={{
          title: "Company",
          tabBarIcon: ({ color }) => <Building2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

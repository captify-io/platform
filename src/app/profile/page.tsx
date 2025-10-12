"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useCaptify } from "@captify-io/core/components";
import { User, Settings, Bell, Palette } from "lucide-react";

type Tab = "account" | "settings" | "preferences";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { userState, updateUserState } = useCaptify();
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const tabs = [
    { id: "account" as Tab, label: "Account", icon: User },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
    { id: "preferences" as Tab, label: "Preferences", icon: Palette },
  ];

  return (
    <div className="h-full w-full p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <div className="mt-1 text-lg">
                      {session?.user?.name || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="mt-1 text-lg">
                      {session?.user?.email || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </label>
                    <div className="mt-1 text-sm font-mono bg-accent p-2 rounded">
                      {userState?.userId || "Not available"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Groups
                    </label>
                    <div className="mt-1">
                      {session?.user?.groups && session.user.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {session.user.groups.map((group: string) => (
                            <span
                              key={group}
                              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No groups</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive email updates about your account
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userState?.preferences?.notifications?.email ?? true}
                        onChange={async (e) => {
                          if (userState) {
                            await updateUserState({
                              ...userState,
                              preferences: {
                                ...userState.preferences,
                                notifications: {
                                  ...userState.preferences?.notifications,
                                  email: e.target.checked,
                                },
                              },
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <div className="font-medium">In-App Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Show notifications within the application
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userState?.preferences?.notifications?.inApp ?? true}
                        onChange={async (e) => {
                          if (userState) {
                            await updateUserState({
                              ...userState,
                              preferences: {
                                ...userState.preferences,
                                notifications: {
                                  ...userState.preferences?.notifications,
                                  inApp: e.target.checked,
                                },
                              },
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">Pin Sidebar</div>
                      <div className="text-sm text-muted-foreground">
                        Keep the sidebar open by default
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userState?.preferences?.sidebarPinned ?? false}
                        onChange={async (e) => {
                          if (userState) {
                            await updateUserState({
                              ...userState,
                              preferences: {
                                ...userState.preferences,
                                sidebarPinned: e.target.checked,
                              },
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Theme
                    </label>
                    <select
                      value={userState?.preferences?.theme || "captify"}
                      onChange={async (e) => {
                        if (userState) {
                          await updateUserState({
                            ...userState,
                            preferences: {
                              ...userState.preferences,
                              theme: e.target.value as any,
                            },
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="captify">Captify</option>
                      <option value="lite">Lite</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Favorite Apps
                    </label>
                    <div className="text-sm text-muted-foreground">
                      {userState?.preferences?.favoriteApps?.length || 0} apps favorited
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Recent Apps
                    </label>
                    <div className="text-sm text-muted-foreground">
                      {userState?.preferences?.recentApps?.length || 0} recently used
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

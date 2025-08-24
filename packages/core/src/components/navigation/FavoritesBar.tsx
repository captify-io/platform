"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useCaptify } from "../../context/CaptifyContext";

interface FavoritesBarProps {
  currentApplication?: {
    id: string;
    name: string;
  };
}

export function FavoritesBar({ currentApplication }: FavoritesBarProps) {
  const router = useRouter();
  const { favoriteApplications, favoritesLoading, toggleFavorite } =
    useCaptify();

  const handleApplicationClick = (href: string) => {
    router.push(href);
  };

  const handleToggleFavorite = async (appId: string) => {
    await toggleFavorite(appId);
  };

  return (
    <>
      {/* Only render the FavoritesBar if there are favorite applications */}
      {favoriteApplications.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="flex items-center px-4 h-10 space-x-1">
            {favoritesLoading ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading favorites...</span>
              </div>
            ) : (
              favoriteApplications.map((app) => {
                const isActive = currentApplication?.id === app.id;

                return (
                  <button
                    key={app.appId}
                    onClick={() => handleApplicationClick(app.href)}
                    className={`transition-all duration-200 text-xs px-3 py-1 h-8 flex items-center space-x-2 cursor-pointer rounded ${
                      isActive
                        ? "bg-gray-800 text-white border border-gray-600"
                        : "text-white hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center`}
                      style={{ backgroundColor: app.color }}
                    >
                      <DynamicIcon
                        name={app.icon as any}
                        className="h-3 w-3 text-white"
                      />
                    </div>
                    <span>{app.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}

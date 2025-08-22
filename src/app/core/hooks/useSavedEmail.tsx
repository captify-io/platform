import { useState, useEffect } from "react";

interface SavedEmailData {
  email: string | null;
  savedAt?: string;
}

export function useSavedEmail() {
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedEmail = async () => {
      try {
        const response = await fetch("/api/auth/save-email");
        const data: SavedEmailData = await response.json();

        // Since email sessions are long-lived, just use the email if present
        setSavedEmail(data.email);
      } catch (error) {
        console.error("Failed to fetch saved email:", error);
        setSavedEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedEmail();
  }, []);

  const saveEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/save-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSavedEmail(email);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save email:", error);
      return false;
    }
  };

  const clearEmail = () => {
    setSavedEmail(null);
    // Clear the session cookie by calling the API with an empty request
    fetch("/api/auth/save-email", { method: "DELETE" }).catch(console.error);
  };

  return {
    savedEmail,
    isLoading,
    saveEmail,
    clearEmail,
  };
}

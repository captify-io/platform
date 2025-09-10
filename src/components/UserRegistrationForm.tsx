"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../lib";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2, UserPlus, AlertCircle, Building, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserRegistrationFormProps {
  onRegistrationComplete?: () => void;
  captifyStatus?: string | null;
  userId?: string;
}

export function UserRegistrationForm({
  onRegistrationComplete,
  captifyStatus,
  userId,
}: UserRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [isLocked, setIsLocked] = useState(captifyStatus === "registered");
  const [loadingUser, setLoadingUser] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(captifyStatus);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    department: "",
    phone: "",
    tenantId: "",
  });
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch user data if userId is provided
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        return;
      }

      setLoadingUser(true);
      try {
        // Query the User table directly for the current user
        const result = await apiClient.run({
          service: "dynamo",
          operation: "get",
          app: "core",
          table: "User",
          data: {
            Key: {
              id: userId,
            },
          },
        });

        if (result.success && result.data) {
          setFormData({
            firstName: result.data.profile?.firstName || "",
            lastName: result.data.profile?.lastName || "",
            email: result.data.email || "",
            title: result.data.profile?.title || "",
            department: result.data.profile?.department || "",
            phone: result.data.profile?.phone || "",
            tenantId: result.data.tenantId || "",
          });

          // Check the user's status and update the form state
          if (result.data.status === "registered") {
            setIsLocked(true);
            setCurrentStatus("registered");
            setRegistrationMessage(
              "Your registration has been submitted and is pending approval from an administrator."
            );
          } else if (result.data.status === "unregistered") {
            setIsLocked(false);
            setCurrentStatus("unregistered");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch available tenants on mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        // Query the Tenant table directly using core app
        const result = await apiClient.run({
          service: "dynamo",
          operation: "scan",
          app: "core",
          table: "Tenant",
          data: {
            FilterExpression: "#status = :status",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":status": "active",
            },
          },
        });

        if (result.success && result.data?.Items) {
          setTenants(result.data.Items);
        }
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If form is locked and status is registered, unlock it and update status to unregistered
    if (isLocked && currentStatus === "registered") {
      try {
        // Update user status to unregistered when they unlock to edit
        const result = await apiClient.run({
          service: "user",
          operation: "updateOwnStatus",
          data: {
            status: "unregistered",
          },
        });

        if (result.success) {
          setIsLocked(false);
          setCurrentStatus("unregistered");
          setRegistrationMessage("You can now edit your registration.");
        } else {
          setError("Failed to unlock form");
        }
      } catch (err) {
        console.error("Failed to update status to unregistered:", err);
        setError("Failed to unlock form");
      }
      return;
    }

    setRegistrationMessage(null);
    setError(null);
    setLoading(true);

    // For initial registration or updates - save data and update status to registered
    try {
      // First, save/update the user profile data
      console.log("Saving profile data:", formData);

      const profileResult = await apiClient.run({
        service: "dynamo",
        operation: "update",
        app: "core",
        table: "User",
        data: {
          Key: {
            id: userId,
          },
          UpdateExpression: "SET #profile = :profile, #email = :email, #tenantId = :tenantId, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#profile": "profile",
            "#email": "email",
            "#tenantId": "tenantId",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":profile": {
              firstName: formData.firstName,
              lastName: formData.lastName,
              title: formData.title,
              department: formData.department,
              phone: formData.phone,
            },
            ":email": formData.email,
            ":tenantId": formData.tenantId || null,
            ":updatedAt": new Date().toISOString(),
          },
        },
      });

      console.log("Profile update result:", profileResult);

      if (profileResult.success) {
        // Then update status to registered
        const statusResult = await apiClient.run({
          service: "dynamo",
          operation: "update",
          app: "core",
          table: "User",
          data: {
            Key: {
              id: userId,
            },
            UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames: {
              "#status": "status",
              "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
              ":status": "registered",
              ":updatedAt": new Date().toISOString(),
            },
          },
        });

        console.log("Status update result:", statusResult);

        if (statusResult.success) {
          setRegistrationMessage(
            "Registration complete! Your account is pending approval from an administrator."
          );
          setIsLocked(true);
          setCurrentStatus("registered");

          // Call the optional callback if provided
          if (onRegistrationComplete) {
            setTimeout(() => {
              onRegistrationComplete();
            }, 2000);
          }
        } else {
          setError("Failed to update registration status");
        }
      } else {
        setError(profileResult.error || "Failed to save profile information");
      }
    } catch (err) {
      setError("Failed to complete registration");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits (US phone numbers)
    const limitedNumber = phoneNumber.slice(0, 10);
    
    // Format as (XXX) XXX-XXXX
    if (limitedNumber.length === 0) {
      return '';
    } else if (limitedNumber.length <= 3) {
      return `(${limitedNumber}`;
    } else if (limitedNumber.length <= 6) {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    } else {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`;
    }
  };

  const validateEmail = (email: string) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format phone number for US format
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }));
    } else if (name === 'email') {
      // Update email and validate
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Validate email and set error if invalid
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError(null);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      <Button
        onClick={() => signOut()}
        size="sm"
        className="absolute top-4 right-4 bg-black text-white hover:bg-gray-800"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {currentStatus === "registered"
            ? "Update Your Registration"
            : "Complete Your Registration"}
        </CardTitle>
        <CardDescription>
          {currentStatus === "registered"
            ? "Your registration is pending approval. You can unlock and update your profile, but this may reset your position in the approval queue."
            : "Please provide your information to complete the registration process. Your account will require administrator approval before you can access the system."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLocked}
              placeholder="john.doe@example.com"
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={isLocked}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={isLocked}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="Engineering"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (US)</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isLocked}
              placeholder="(555) 123-4567"
              type="tel"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantId" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Organization (Optional)
            </Label>
            {loadingTenants ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading organizations...
              </div>
            ) : (
              <Select
                value={formData.tenantId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tenantId: value }))
                }
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your organization (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.length > 0 ? (
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.code})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No organizations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {registrationMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{registrationMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || !!emailError}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : isLocked && currentStatus === "registered" ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Unlock Registration
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Complete Registration
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
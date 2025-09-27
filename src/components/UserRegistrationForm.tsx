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
import { Loader2, UserPlus, AlertCircle, Building, LogOut, Upload, FileText, X } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserRegistrationFormProps {
  onRegistrationComplete?: () => void;
  userId?: string;
  userEmail?: string | null;
  userName?: string | null;
  userGroups?: string[];
}

export function UserRegistrationForm({
  onRegistrationComplete,
  userId,
  userEmail,
  userName,
  userGroups = [],
}: UserRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [canAccessCorePool, setCanAccessCorePool] = useState<boolean | null>(null);
  const [checkingCorePool, setCheckingCorePool] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileS3Key, setUploadedFileS3Key] = useState<string | null>(null);
  // Initialize form data with session information
  const [formData, setFormData] = useState(() => {
    // Parse userName into first and last name if available
    const nameparts = userName ? userName.split(' ') : [];
    const firstName = nameparts[0] || "";
    const lastName = nameparts.slice(1).join(' ') || "";

    return {
      firstName,
      lastName,
      email: userEmail || "",
      title: "",
      department: "",
      phone: "",
      tenantId: "",
    };
  });
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Check if user is in captify-authorized group
  useEffect(() => {
    console.log("🔍 Checking user groups:", userGroups);
    const isAuthorized = userGroups.includes('captify-authorized');
    console.log("🔍 User is authorized:", isAuthorized);

    // If user is authorized, they shouldn't see the registration form
    setCanAccessCorePool(isAuthorized);
    setCheckingCorePool(false);
  }, [userGroups]);

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
          // Use DynamoDB data first, fall back to session data for new users
          setFormData(prev => ({
            firstName: result.data.profile?.firstName || prev.firstName,
            lastName: result.data.profile?.lastName || prev.lastName,
            email: result.data.email || prev.email,
            title: result.data.profile?.title || prev.title,
            department: result.data.profile?.department || prev.department,
            phone: result.data.profile?.phone || prev.phone,
            tenantId: result.data.tenantId || prev.tenantId,
          }));

          // Check the user's status and update the form state
          if (result.data.status === "registered") {
            setIsLocked(true);
            setCurrentStatus("registered");
            setRegistrationMessage(
              "Your registration has been submitted and is pending approval from an administrator."
            );
            // Load existing file URL and S3 key if available
            if (result.data.documents?.form2875Url) {
              setUploadedFileUrl(result.data.documents.form2875Url);
            }
            if (result.data.documents?.form2875S3Key) {
              setUploadedFileS3Key(result.data.documents.form2875S3Key);
            }
          } else if (result.data.status === "unregistered") {
            setIsLocked(false);
            setCurrentStatus("unregistered");
          }
        } else {
          // No existing record in DynamoDB - user is new, keep session data
          console.log("No existing user record found, using session data for new user");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // On error, keep the session data that was already set in formData
        console.log("Error fetching user data, using session data as fallback");
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

  // Temporary approval function for testing
  const handleApprove = async () => {
    try {
      setLoading(true);
      console.log("Approving user registration...");

      const result = await apiClient.run({
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
            ":status": "approved",
            ":updatedAt": new Date().toISOString(),
          },
        },
      });

      if (result.success) {
        setCurrentStatus("approved");
        setRegistrationMessage("✅ User approved! Redirecting to platform...");
        setIsLocked(true);

        // Refresh the page after a short delay to re-check approval status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || "Failed to approve user");
      }
    } catch (err) {
      console.error("Failed to approve user:", err);
      setError("Failed to approve user");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If form is locked and status is registered, unlock it and update status to unregistered
    if (isLocked && currentStatus === "registered") {
      try {
        // Update user status to unregistered when they unlock to edit
        const result = await apiClient.run({
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
              ":status": "unregistered",
              ":updatedAt": new Date().toISOString(),
            },
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

    // Save/update user profile data in DynamoDB User table
    try {
      console.log("Updating user profile:", formData);
      console.log("Saving user record to DynamoDB...");
      const profileResult = await apiClient.run({
        service: "dynamo",
        operation: "put",
        app: "core",
        table: "User",
        data: {
          Item: {
            id: userId,
            email: formData.email,
            profile: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              title: formData.title,
              department: formData.department,
              phone: formData.phone,
            },
            tenantId: formData.tenantId || null,
            status: "registered",
            documents: uploadedFileUrl ? {
              form2875Url: uploadedFileUrl,
              form2875S3Key: uploadedFileS3Key,
              form2875UploadedAt: new Date().toISOString(),
            } : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      console.log("DynamoDB update result:", profileResult);

      if (profileResult.success) {
        setRegistrationMessage("Registration complete! Your account is pending approval from an administrator.");
        setIsLocked(true);
        setCurrentStatus("registered");

        // Call the optional callback if provided
          if (onRegistrationComplete) {
            setTimeout(() => {
              onRegistrationComplete();
            }, 2000);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for form 2875)
    if (file.type !== 'application/pdf') {
      setFileUploadError('Please upload a PDF file only.');
      return;
    }

    // Validate file size (max 10MB for base64 transmission)
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadError('File size must be less than 10MB.');
      return;
    }

    setFileUploadError(null);
    setUploadingFile(true);

    try {
      // Create S3 key path: users/{userId}/form2875-{timestamp}-{fileName}
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `users/${userId}/form2875-${timestamp}-${sanitizedFileName}`;


      // Convert file to base64 for API transmission
      console.log('Converting file to base64 for upload:', s3Key);
      const fileBuffer = await file.arrayBuffer();
      const base64File = Buffer.from(fileBuffer).toString('base64');

      // Upload file via captifyApi S3 put operation
      const uploadResult = await apiClient.run({
        service: "s3",
        operation: "put",
        app: "core",
        data: {
          bucket: "captify-core-bucket",
          key: s3Key,
          body: base64File,
          contentType: file.type,
          contentEncoding: "base64",
          metadata: {
            originalFileName: file.name,
            uploadedBy: userId || '',
            fileType: 'form2875',
            uploadTimestamp: new Date().toISOString(),
          }
        },
      });

      console.log('S3 upload result:', uploadResult);

      if (!uploadResult.success) {
        console.error('S3 upload error:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload file to S3');
      }

      // Success - update UI state
      const fileUrl = `https://captify-core-bucket.s3.amazonaws.com/${s3Key}`;
      setUploadedFile(file);
      setUploadedFileUrl(fileUrl);
      setUploadedFileS3Key(s3Key);
      setFileUploadError(null);

      console.log(`File uploaded successfully to S3: ${s3Key}`);

    } catch (error) {
      console.error('File upload error:', error);
      setFileUploadError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileUrl(null);
    setUploadedFileS3Key(null);
    setFileUploadError(null);
    // Reset file input
    const fileInput = document.getElementById('form2875File') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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

  // Show loading state while checking core pool access
  if (checkingCorePool) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking access permissions...</span>
        </CardContent>
      </Card>
    );
  }

  // If user HAS core pool access, they shouldn't see the registration form
  // This should be handled at the layout level, but adding safety check here
  if (canAccessCorePool === true) {
    return (
      <Card className="w-full max-w-2xl mx-auto relative">
        <Button
          onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/signout")}
          size="sm"
          className="absolute top-4 right-4 bg-black text-white hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            Already Authorized
          </CardTitle>
          <CardDescription>
            You already have access to the Captify platform. Redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You have core identity pool access. Please refresh the page to access the full application.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto relative">
      <div className="absolute top-4 right-4">
        <Button
          onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/signout")}
          size="sm"
          className="bg-black text-white hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
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
            <p className="text-xs text-muted-foreground">
              Email can be updated and will be synchronized with your authentication
            </p>
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

          <div className="grid grid-cols-2 gap-4">
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
                Organization
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
          </div>

          {/* Form 2875 Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="form2875File" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Security Clearance Form 2875
            </Label>
            <p className="text-xs text-muted-foreground">
              If you require security clearance, please upload your Form 2875 (PDF only, max 10MB)
            </p>

            {/* File upload area */}
            {!uploadedFileUrl && !uploadedFile && (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadingFile ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF files only (max 10MB)</p>
                  <input
                    id="form2875File"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isLocked || uploadingFile}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLocked || uploadingFile}
                    onClick={() => document.getElementById('form2875File')?.click()}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Uploaded file display */}
            {(uploadedFile || uploadedFileUrl) && (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {uploadedFile?.name || "Form 2875.pdf"}
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Uploaded
                    </span>
                  </div>
                  {!isLocked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {uploadedFileUrl && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(uploadedFileUrl, '_blank')}
                    >
                      View uploaded file
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* File upload error */}
            {fileUploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileUploadError}</AlertDescription>
              </Alert>
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
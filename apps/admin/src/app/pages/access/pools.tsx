"use client";

import * as React from "react";
import { Button } from "@captify/core/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@captify/core/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Alert, AlertDescription } from "@captify/core/ui";
import { ScrollArea } from "@captify/core/ui";
import { Separator } from "@captify/core/ui";
import { Input } from "@captify/core/ui";
import { Label } from "@captify/core/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@captify/core/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@captify/core/ui";
import { Switch } from "@captify/core/ui";
import {
  Shield,
  Users,
  Key,
  Lock,
  Unlock,
  Database,
  Cloud,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  Settings,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Globe,
  ArrowRight,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { apiClient } from "@captify/core/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@captify/core/ui";
import { Textarea } from "@captify/core/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@captify/core/ui";

interface UserPool {
  id: string;
  name: string;
  region: string;
  userCount?: number;
  mfaConfiguration?: string;
  status?: string;
  createdAt?: string;
  lastModified?: string;
  policies?: any;
  attributes?: any[];
}

interface IdentityPool {
  id: string;
  name: string;
  region: string;
  allowUnauthenticated: boolean;
  authProviders: string[];
  authenticatedRole?: string;
  unauthenticatedRole?: string;
  roles?: any;
}

interface IAMRole {
  roleName: string;
  roleArn: string;
  trustPolicy?: any;
  attachedPolicies: string[];
  inlinePolicies?: any[];
  description?: string;
}

interface CognitoGroup {
  groupName: string;
  description?: string;
  roleArn?: string;
  precedence?: number;
  userCount?: number;
}

interface User {
  userId: string;
  email: string;
  name: string;
  status: string;
  enabled: boolean;
  createdAt?: string;
  lastModified?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  department?: string;
  title?: string;
  attributes?: Record<string, any>;
}

export function AccessPoolsPage() {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [userPools, setUserPools] = React.useState<UserPool[]>([]);
  const [identityPools, setIdentityPools] = React.useState<IdentityPool[]>([]);
  const [roles, setRoles] = React.useState<IAMRole[]>([]);
  const [groups, setGroups] = React.useState<CognitoGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPool, setSelectedPool] = React.useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [createType, setCreateType] = React.useState<
    "user" | "identity" | "group" | "role"
  >("user");

  // Users tab state
  const [users, setUsers] = React.useState<User[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [usersError, setUsersError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedUser, setEditedUser] = React.useState<User | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Fetch all pool data
  const fetchPoolData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch User Pool data
      const userPoolResult = await apiClient.run({
        service: "cognito",
        operation: "describeUserPool",
      });

      if (userPoolResult.success && userPoolResult.data) {
        const pool = userPoolResult.data;
        const userCountResult = await apiClient.run({
          service: "cognito",
          operation: "listUsers",
          data: { Limit: 1 },
        });

        setUserPools([
          {
            id: pool.UserPoolId || pool.Id || "us-east-1_k3Fp77c09",
            name: pool.UserPoolName || pool.Name || "Captify User Pool",
            region: "us-east-1",
            userCount: userCountResult.data?.length || 0,
            mfaConfiguration: pool.MfaConfiguration || "OFF",
            status: pool.Status || "Enabled",
            createdAt: pool.CreationDate || new Date().toISOString(),
            lastModified: pool.LastModifiedDate,
            attributes:
              pool.SchemaAttributes?.map((attr: any) => attr.Name) || [],
          },
        ]);
      } else {
        // Fallback to hardcoded data if API fails
        setUserPools([
          {
            id: "us-east-1_k3Fp77c09",
            name: "Captify User Pool",
            region: "us-east-1",
            userCount: 0,
            mfaConfiguration: "OPTIONAL",
            status: "Enabled",
            createdAt: "2024-01-15",
            attributes: ["email", "name", "phone_number"],
          },
        ]);
      }

      // Fetch Groups
      const groupsResult = await apiClient.run({
        service: "cognito",
        operation: "listGroups",
      });

      if (groupsResult.success && groupsResult.data) {
        const mappedGroups = groupsResult.data.map((group: any) => ({
          groupName: group.GroupName,
          description: group.Description || "",
          roleArn: group.RoleArn,
          precedence: group.Precedence,
          userCount: 0, // Would need separate call to get member count
        }));
        setGroups(mappedGroups);
      } else {
        // Fallback data
        setGroups([
          {
            groupName: "Admins",
            description: "System administrators with full access",
            roleArn:
              "arn:aws:iam::211125459951:role/Cognito_CaptifyAdmin_Auth_Role",
            precedence: 1,
            userCount: 0,
          },
          {
            groupName: "Users",
            description: "Regular users with standard access",
            precedence: 10,
            userCount: 0,
          },
        ]);
      }

      // For Identity Pools and IAM Roles, we still use static data as these require different AWS services
      // These would need Cognito Identity and IAM service implementations
      setIdentityPools([
        {
          id: "us-east-1:565334e6-f014-45ba-9b85-399f2888f1dc",
          name: "Captify Default Pool",
          region: "us-east-1",
          allowUnauthenticated: true,
          authProviders: [
            "cognito-idp.us-east-1.amazonaws.com/us-east-1_k3Fp77c09",
          ],
          authenticatedRole: "Captify_Default_Auth_Role",
          unauthenticatedRole: "Captify_Default_Unauth_Role",
        },
        {
          id: "us-east-1:52e865f2-4871-4a74-8976-edc945af0c0f",
          name: "Captify Admin Pool",
          region: "us-east-1",
          allowUnauthenticated: false,
          authProviders: [
            "cognito-idp.us-east-1.amazonaws.com/us-east-1_k3Fp77c09",
          ],
          authenticatedRole: "Cognito_CaptifyAdmin_Auth_Role",
          unauthenticatedRole: "Cognito_CaptifyAdmin_Unauth_Role",
        },
      ]);

      setRoles([
        {
          roleName: "Captify_Default_Auth_Role",
          roleArn: "arn:aws:iam::211125459951:role/Captify_Default_Auth_Role",
          attachedPolicies: ["DynamoDB Access", "Cognito Identity Access"],
          description: "Default role for authenticated users",
        },
        {
          roleName: "Cognito_CaptifyAdmin_Auth_Role",
          roleArn:
            "arn:aws:iam::211125459951:role/Cognito_CaptifyAdmin_Auth_Role",
          attachedPolicies: ["Cognito Admin Access", "DynamoDB Full Access"],
          description: "Admin role with elevated permissions",
        },
      ]);
    } catch (error) {
      console.error("Error fetching pool data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users from Cognito
  const fetchUsers = React.useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);

      const result = await apiClient.run({
        service: "cognito",
        operation: "listUsers",
      });

      if (result.success && result.data) {
        const mappedUsers: User[] = result.data.map((user: any) => {
          const attributes =
            user.Attributes?.reduce((acc: any, attr: any) => {
              acc[attr.Name] = attr.Value;
              return acc;
            }, {}) || {};

          return {
            userId: user.Username,
            email: attributes.email || "",
            name: attributes.name || attributes.given_name || user.Username,
            status: user.UserStatus,
            enabled: user.Enabled !== false,
            createdAt: user.UserCreateDate,
            lastModified: user.UserLastModifiedDate,
            emailVerified: attributes.email_verified === "true",
            phoneNumber: attributes.phone_number,
            department: attributes["custom:department"],
            title: attributes["custom:title"],
            attributes,
          };
        });

        setUsers(mappedUsers);
      } else {
        console.warn("Failed to fetch users from Cognito:", result.error);
        setUsersError("Unable to connect to Cognito. Showing demo data.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsersError(
        "Failed to load users. Please check your AWS configuration."
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Update user in Cognito
  const updateUser = async () => {
    if (!editedUser || !selectedUser) return;

    setSaving(true);
    try {
      const updates: any = {
        Username: editedUser.userId,
        UserAttributes: [],
      };

      if (editedUser.name !== selectedUser.name) {
        updates.UserAttributes.push({ Name: "name", Value: editedUser.name });
      }
      if (editedUser.email !== selectedUser.email) {
        updates.UserAttributes.push({ Name: "email", Value: editedUser.email });
      }
      if (editedUser.phoneNumber !== selectedUser.phoneNumber) {
        updates.UserAttributes.push({
          Name: "phone_number",
          Value: editedUser.phoneNumber || "",
        });
      }
      if (editedUser.department !== selectedUser.department) {
        updates.UserAttributes.push({
          Name: "custom:department",
          Value: editedUser.department || "",
        });
      }
      if (editedUser.title !== selectedUser.title) {
        updates.UserAttributes.push({
          Name: "custom:title",
          Value: editedUser.title || "",
        });
      }

      const result = await apiClient.run({
        service: "cognito",
        operation: "updateUser",
        data: updates,
      });

      if (result.success) {
        setUsers(
          users.map((u) => (u.userId === editedUser.userId ? editedUser : u))
        );
        setSelectedUser(editedUser);
        setIsEditing(false);
        setEditedUser(null);
      } else {
        alert(`Failed to update user: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle user enabled status
  const toggleUserStatus = async (userId: string, enabled: boolean) => {
    try {
      const operation = enabled ? "enableUser" : "disableUser";
      const result = await apiClient.run({
        service: "cognito",
        operation,
        data: { Username: userId },
      });

      if (result.success) {
        setUsers(
          users.map((u) => (u.userId === userId ? { ...u, enabled } : u))
        );
        if (selectedUser?.userId === userId) {
          setSelectedUser({ ...selectedUser, enabled });
        }
      } else {
        alert(
          `Failed to ${enabled ? "enable" : "disable"} user: ${
            result.error || "Unknown error"
          }`
        );
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Failed to update user status. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "UNCONFIRMED":
        return "warning";
      case "FORCE_CHANGE_PASSWORD":
        return "secondary";
      case "ARCHIVED":
        return "destructive";
      default:
        return "default";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    if (
      activeTab === "overview" ||
      activeTab === "user-pools" ||
      activeTab === "identity-pools" ||
      activeTab === "groups" ||
      activeTab === "roles"
    ) {
      fetchPoolData();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // Overview Tab - Educational content
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How AWS Cognito Pools Work
          </CardTitle>
          <CardDescription>
            Understanding the relationship between User Pools and Identity Pools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Flow Diagram */}
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* User */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm font-medium">User</p>
                <p className="text-xs text-muted-foreground">Logs in</p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              {/* User Pool */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserCheck className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-sm font-medium">User Pool</p>
                <p className="text-xs text-muted-foreground">Authentication</p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              {/* Identity Pool */}
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-sm font-medium">Identity Pool</p>
                <p className="text-xs text-muted-foreground">Authorization</p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              {/* AWS Services */}
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Cloud className="h-10 w-10 text-orange-500" />
                </div>
                <p className="text-sm font-medium">AWS Services</p>
                <p className="text-xs text-muted-foreground">Access</p>
              </div>
            </div>
          </div>

          {/* Explanation Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  User Pools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  User Pools handle <strong>authentication</strong> (who you
                  are).
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Manages user registration and sign-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Stores user profiles and attributes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Handles password policies and MFA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Issues JWT tokens after login</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Identity Pools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  Identity Pools handle <strong>authorization</strong> (what you
                  can do).
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Exchanges tokens for AWS credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Maps users to IAM roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Controls access to AWS services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Supports federated identities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Current Configuration */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Current Setup:</strong> You have {userPools.length}{" "}
              User Pool and {identityPools.length} Identity Pools configured.
              The Admin Pool is used for administrative operations, while the
              Default Pool is for regular users.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setActiveTab("user-pools")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage User Pools
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setActiveTab("identity-pools")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Manage Identity Pools
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setActiveTab("groups")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Manage Groups
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setActiveTab("roles")}
            >
              <Key className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // User Pools Tab
  const UserPoolsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Pools</h3>
          <p className="text-sm text-muted-foreground">
            Manage authentication and user directories
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateType("user");
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create User Pool
        </Button>
      </div>

      {userPools.map((pool) => (
        <Card key={pool.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  {pool.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  <span className="font-mono text-xs">{pool.id}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Region</p>
                <p className="font-medium">{pool.region}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Users</p>
                <p className="font-medium">{pool.userCount || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MFA</p>
                <Badge
                  variant={
                    pool.mfaConfiguration === "ON" ? "default" : "secondary"
                  }
                >
                  {pool.mfaConfiguration}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant="default"
                  className="bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  {pool.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm hover:text-primary">
                <ChevronRight className="h-4 w-4" />
                User Attributes
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {pool.attributes?.map((attr) => (
                    <Badge key={attr} variant="outline">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm hover:text-primary">
                <ChevronRight className="h-4 w-4" />
                App Clients
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">Web Client</span>
                    <Badge>4og43nmsksolkkrk3v47tj7gv9</Badge>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Identity Pools Tab
  const IdentityPoolsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Identity Pools</h3>
          <p className="text-sm text-muted-foreground">
            Manage authorization and AWS credential access
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateType("identity");
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Identity Pool
        </Button>
      </div>

      {identityPools.map((pool) => (
        <Card
          key={pool.id}
          className={
            pool.name.includes("Admin")
              ? "border-orange-200 dark:border-orange-900"
              : ""
          }
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield
                    className={`h-5 w-5 ${
                      pool.name.includes("Admin")
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  />
                  {pool.name}
                  {pool.name.includes("Admin") && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-orange-500 text-orange-500"
                    >
                      Admin
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  <span className="font-mono text-xs">{pool.id}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Unauthenticated Access</p>
                <Badge
                  variant={pool.allowUnauthenticated ? "secondary" : "default"}
                >
                  {pool.allowUnauthenticated ? "Allowed" : "Disabled"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Auth Providers</p>
                <p className="font-medium">
                  {pool.authProviders.length} configured
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">IAM Roles</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Authenticated Role</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {pool.authenticatedRole}
                    </Badge>
                  </div>
                  {pool.unauthenticatedRole && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Unauthenticated Role</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {pool.unauthenticatedRole}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {pool.name.includes("Admin") && (
              <Alert className="border-orange-200 dark:border-orange-700">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  This pool grants administrative privileges. Users accessing
                  this pool can perform sensitive operations.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Groups Tab
  const GroupsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Groups</h3>
          <p className="text-sm text-muted-foreground">
            Organize users and assign roles
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateType("group");
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.groupName}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    {group.groupName}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{group.userCount} users</Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Precedence</p>
                  <p className="font-medium">{group.precedence || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IAM Role</p>
                  {group.roleArn ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {group.roleArn.split("/").pop()}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Groups with lower precedence numbers have
          priority when a user belongs to multiple groups.
        </AlertDescription>
      </Alert>
    </div>
  );

  // Roles & Policies Tab
  const RolesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">IAM Roles & Policies</h3>
          <p className="text-sm text-muted-foreground">
            Define what users can access
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateType("role");
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.roleName}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {role.roleName}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Attached Policies</p>
                  <div className="flex flex-wrap gap-2">
                    {role.attachedPolicies.map((policy) => (
                      <Badge key={policy} variant="secondary">
                        {policy}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {role.roleArn}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Understanding Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-3">
              <Database className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">DynamoDB Access</p>
                <p className="text-muted-foreground">
                  Read and write to application data tables
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Cognito Identity Access</p>
                <p className="text-muted-foreground">
                  Get AWS credentials for authenticated users
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserCheck className="h-4 w-4 mt-0.5 text-orange-500" />
              <div>
                <p className="font-medium">Cognito Admin Access</p>
                <p className="text-muted-foreground">
                  Manage users, groups, and pool settings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Access Control</h1>
          <p className="text-muted-foreground mt-1">
            Manage authentication, users, roles, and groups
          </p>
        </div>
        <Button
          variant="outline"
          onClick={activeTab === "users" ? fetchUsers : fetchPoolData}
          disabled={loading || usersLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading || usersLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="user-pools">User Pools</TabsTrigger>
          <TabsTrigger value="identity-pools">Identity Pools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="user-pools" className="space-y-6">
          <UserPoolsTab />
        </TabsContent>

        <TabsContent value="identity-pools" className="space-y-6">
          <IdentityPoolsTab />
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <GroupsTab />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RolesTab />
        </TabsContent>

        {/* Users Tab Content */}
        <TabsContent value="users" className="space-y-6">
          {/* Error Alert */}
          {usersError && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardDescription className="text-yellow-800">
                  {usersError}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.enabled).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.status === "CONFIRMED").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.emailVerified).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Click on a user to view and edit their details
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading users...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.userId}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(user.status) as any}>
                              {user.status?.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={user.enabled}
                              onCheckedChange={(checked) =>
                                toggleUserStatus(user.userId, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditedUser(user);
                                setIsEditing(false);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* User Details Sheet */}
          <Sheet
            open={!!selectedUser}
            onOpenChange={(open) => !open && setSelectedUser(null)}
          >
            <SheetContent className="w-[600px] sm:max-w-[600px]">
              {selectedUser && (
                <>
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                      <span>User Details</span>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsEditing(true);
                            setEditedUser(selectedUser);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedUser(selectedUser);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={updateUser}
                            disabled={saving}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      User ID: {selectedUser.userId}
                    </SheetDescription>
                  </SheetHeader>

                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Name</Label>
                            {isEditing ? (
                              <Input
                                value={editedUser?.name || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) =>
                                    prev
                                      ? { ...prev, name: e.target.value }
                                      : null
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedUser.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Email</Label>
                            {isEditing ? (
                              <Input
                                type="email"
                                value={editedUser?.email || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) =>
                                    prev
                                      ? { ...prev, email: e.target.value }
                                      : null
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedUser.email}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Phone</Label>
                            {isEditing ? (
                              <Input
                                type="tel"
                                value={editedUser?.phoneNumber || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) =>
                                    prev
                                      ? { ...prev, phoneNumber: e.target.value }
                                      : null
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedUser.phoneNumber || "Not set"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Organization */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">
                          Organization
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Department</Label>
                            {isEditing ? (
                              <Input
                                value={editedUser?.department || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) =>
                                    prev
                                      ? { ...prev, department: e.target.value }
                                      : null
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedUser.department || "Not set"}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Title</Label>
                            {isEditing ? (
                              <Input
                                value={editedUser?.title || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) =>
                                    prev
                                      ? { ...prev, title: e.target.value }
                                      : null
                                  )
                                }
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedUser.title || "Not set"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Account Status */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">
                          Account Status
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Status</Label>
                            <Badge
                              variant={
                                getStatusColor(selectedUser.status) as any
                              }
                            >
                              {selectedUser.status?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Enabled</Label>
                            <Switch
                              checked={selectedUser.enabled}
                              onCheckedChange={(checked) =>
                                toggleUserStatus(selectedUser.userId, checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Email Verified</Label>
                            <Badge
                              variant={
                                selectedUser.emailVerified
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                selectedUser.emailVerified
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                  : ""
                              }
                            >
                              {selectedUser.emailVerified
                                ? "Verified"
                                : "Unverified"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Timestamps */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Timestamps</h3>
                        <div className="space-y-2">
                          <div>
                            <Label>Created</Label>
                            <p className="text-sm mt-1">
                              {selectedUser.createdAt
                                ? new Date(
                                    selectedUser.createdAt
                                  ).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <Label>Last Modified</Label>
                            <p className="text-sm mt-1">
                              {selectedUser.lastModified
                                ? new Date(
                                    selectedUser.lastModified
                                  ).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>
      </Tabs>

      {/* Create Dialog (placeholder) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create{" "}
              {createType === "user"
                ? "User Pool"
                : createType === "identity"
                ? "Identity Pool"
                : createType === "group"
                ? "Group"
                : "Role"}
            </DialogTitle>
            <DialogDescription>
              This feature will be implemented to create AWS resources directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Creating{" "}
                {createType === "user"
                  ? "User Pools"
                  : createType === "identity"
                  ? "Identity Pools"
                  : createType === "group"
                  ? "Groups"
                  : "Roles"}{" "}
                requires appropriate AWS IAM permissions.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button disabled>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccessPoolsPage;

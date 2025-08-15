import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserX, Shield, User, Calendar, Filter, X } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AdminUsersProps {
  user: any;
}

export const AdminUsers = ({ user }: AdminUsersProps) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [userDateFrom, setUserDateFrom] = useState<Date | undefined>();
  const [userDateTo, setUserDateTo] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.find(role => role.user_id === profile.user_id)
      })) || [];

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm("Are you sure you want to remove this user? This action cannot be undone.")) return;

    try {
      // Call the edge function to delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete user');
      }

      toast({
        title: "Success!",
        description: "User removed successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove user.",
      });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "User role updated successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role.",
      });
    }
  };

  // Filter users based on search and filter criteria
  const applyUserFilters = () => {
    let filtered = users;

    // Search filter
    if (userSearchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }

    // Role filter
    if (selectedRole && selectedRole !== "all") {
      filtered = filtered.filter(user => user.user_roles?.role === selectedRole);
    }

    // Date range filter
    if (userDateFrom) {
      filtered = filtered.filter(user => 
        new Date(user.created_at) >= userDateFrom
      );
    }

    if (userDateTo) {
      filtered = filtered.filter(user => 
        new Date(user.created_at) <= userDateTo
      );
    }

    setFilteredUsers(filtered);
  };

  // Apply user filters whenever filter criteria change
  useEffect(() => {
    applyUserFilters();
  }, [userSearchTerm, selectedRole, userDateFrom, userDateTo, users]);

  // Clear user filters
  const clearUserFilters = () => {
    setUserSearchTerm("");
    setSelectedRole("all");
    setUserDateFrom(undefined);
    setUserDateTo(undefined);
  };

  const handleUserSearch = (query: string) => {
    setUserSearchTerm(query);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Badge variant="outline">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleUserSearch}
          placeholder="Search users by name or email..."
          value={userSearchTerm}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {userDateFrom ? format(userDateFrom, "PPP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={userDateFrom}
                onSelect={setUserDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {userDateTo ? format(userDateTo, "PPP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={userDateTo}
                onSelect={setUserDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={clearUserFilters} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{user.full_name || "Unnamed User"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Badge variant={user.user_roles?.role === "admin" ? "default" : "secondary"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.user_roles?.role || "user"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                {user.phone && (
                  <p><strong>Phone:</strong> {user.phone}</p>
                )}
                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Change Role:</label>
                <Select 
                  value={user.user_roles?.role || "user"} 
                  onValueChange={(newRole) => handleRoleChange(user.user_id, newRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleRemoveUser(user.user_id)}
                  className="w-full"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Remove User
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
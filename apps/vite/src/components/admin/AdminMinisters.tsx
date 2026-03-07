import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Minister {
  id: string;
  full_name: string;
  location: string;
  denomination: string | null;
  ministry_focus: string;
  is_verified: boolean;
  created_at: string;
  slug: string;
  user_id: string;
}

interface AdminMinistersProps {
  user: any;
}

export default function AdminMinisters({ user }: AdminMinistersProps) {
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMinisters();
  }, []);

  const fetchMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from("ministers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMinisters(data || []);
    } catch (error) {
      console.error("Error fetching ministers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch ministers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from("ministers")
        .update({ is_verified: isVerified })
        .eq("id", id);

      if (error) throw error;

      setMinisters(ministers.map(minister => 
        minister.id === id ? { ...minister, is_verified: isVerified } : minister
      ));

      toast({
        title: "Success",
        description: `Minister ${isVerified ? "verified" : "unverified"} successfully`,
      });
    } catch (error) {
      console.error("Error updating minister verification:", error);
      toast({
        title: "Error",
        description: "Failed to update minister verification",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ministers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMinisters(ministers.filter(minister => minister.id !== id));
      toast({
        title: "Success",
        description: "Minister profile deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting minister:", error);
      toast({
        title: "Error",
        description: "Failed to delete minister profile",
        variant: "destructive",
      });
    }
  };

  const filteredMinisters = ministers.filter(minister =>
    minister.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minister.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minister.ministry_focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (minister.denomination && minister.denomination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading ministers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ministers Management</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ministers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link to="/minister/new">
              <Button>Add New Minister</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Ministry Focus</TableHead>
                  <TableHead>Denomination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinisters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No ministers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMinisters.map((minister) => (
                    <TableRow key={minister.id}>
                      <TableCell className="font-medium">
                        {minister.full_name}
                      </TableCell>
                      <TableCell>{minister.location}</TableCell>
                      <TableCell>{minister.ministry_focus}</TableCell>
                      <TableCell>
                        {minister.denomination ? (
                          <Badge variant="outline">{minister.denomination}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={minister.is_verified ? "default" : "secondary"}>
                          {minister.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(minister.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {minister.is_verified && (
                            <Link to={`/minister/${minister.slug}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          
                          <Link to={`/minister/edit/${minister.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(minister.id, !minister.is_verified)}
                          >
                            {minister.is_verified ? (
                              <XCircle className="h-4 w-4 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete
                                  the minister profile for {minister.full_name}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(minister.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{ministers.length}</div>
            <div className="text-sm text-muted-foreground">Total Ministers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {ministers.filter(m => m.is_verified).length}
            </div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">
              {ministers.filter(m => !m.is_verified).length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Verification</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
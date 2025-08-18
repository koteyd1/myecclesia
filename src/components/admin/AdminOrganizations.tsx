import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Check, X, MapPin, Users, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrganizations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_followers(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ is_verified: verified })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({
        title: verified ? "Organization verified" : "Organization unverified",
        description: verified 
          ? "The organization is now visible to the public" 
          : "The organization is no longer visible to the public",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({
        title: "Organization deleted",
        description: "The organization has been permanently removed",
      });
      setSelectedOrg(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Denomination</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations?.map((org) => {
                const followerCount = Array.isArray(org.organization_followers) ? org.organization_followers.length : 0;
                
                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {org.logo_url && (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {org.mission_statement}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.denomination ? (
                        <Badge variant="secondary">{org.denomination}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {org.postcode}, {org.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.is_verified ? "default" : "secondary"}>
                        {org.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        {followerCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrg(org)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Organization Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrg && (
                              <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                  {selectedOrg.logo_url && (
                                    <img
                                      src={selectedOrg.logo_url}
                                      alt={selectedOrg.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                  )}
                                  <div>
                                    <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                                    {selectedOrg.denomination && (
                                      <Badge variant="secondary" className="mt-1">
                                        {selectedOrg.denomination}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {selectedOrg.banner_url && (
                                  <img
                                    src={selectedOrg.banner_url}
                                    alt="Banner"
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Contact Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <strong>Address:</strong> {selectedOrg.address}
                                      </div>
                                      <div>
                                        <strong>Postcode:</strong> {selectedOrg.postcode}
                                      </div>
                                      <div>
                                        <strong>Country:</strong> {selectedOrg.country}
                                      </div>
                                      {selectedOrg.safeguarding_contact && (
                                        <div>
                                          <strong>Safeguarding Contact:</strong> {selectedOrg.safeguarding_contact}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Organization Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <strong>Status:</strong> 
                                        <Badge variant={selectedOrg.is_verified ? "default" : "secondary"} className="ml-2">
                                          {selectedOrg.is_verified ? "Verified" : "Pending"}
                                        </Badge>
                                      </div>
                                      <div>
                                        <strong>Created:</strong> {format(new Date(selectedOrg.created_at), 'PPP')}
                                      </div>
                                      <div>
                                        <strong>Followers:</strong> {followerCount}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {selectedOrg.mission_statement && (
                                  <div>
                                    <h4 className="font-medium mb-2">Mission Statement</h4>
                                    <p className="text-sm text-muted-foreground">{selectedOrg.mission_statement}</p>
                                  </div>
                                )}

                                {selectedOrg.services_offered && selectedOrg.services_offered.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Services & Ministries</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedOrg.services_offered.map((service: string, index: number) => (
                                        <Badge key={index} variant="outline">
                                          {service}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {selectedOrg.social_media_links && Object.keys(selectedOrg.social_media_links).length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Social Media</h4>
                                    <div className="space-y-2">
                                      {Object.entries(selectedOrg.social_media_links).map(([platform, url]) => (
                                        <div key={platform} className="flex items-center space-x-2">
                                          <Globe className="h-4 w-4" />
                                          <a
                                            href={url as string}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                          >
                                            {platform.charAt(0).toUpperCase() + platform.slice(1)}: {String(url)}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-between space-x-2 pt-4">
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(selectedOrg.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    Delete Organization
                                  </Button>
                                  
                                  <Button
                                    variant={selectedOrg.is_verified ? "outline" : "default"}
                                    onClick={() => verifyMutation.mutate({
                                      id: selectedOrg.id,
                                      verified: !selectedOrg.is_verified
                                    })}
                                    disabled={verifyMutation.isPending}
                                  >
                                    {selectedOrg.is_verified ? 'Unverify' : 'Verify'} Organization
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant={org.is_verified ? "outline" : "default"}
                          size="sm"
                          onClick={() => verifyMutation.mutate({
                            id: org.id,
                            verified: !org.is_verified
                          })}
                          disabled={verifyMutation.isPending}
                        >
                          {org.is_verified ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
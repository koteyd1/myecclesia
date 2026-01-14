import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Ticket, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  is_active: boolean;
  sort_order: number;
}

interface TicketTypeManagerProps {
  eventId: string;
  onUpdate?: () => void;
}

export const TicketTypeManager = ({ eventId, onUpdate }: TicketTypeManagerProps) => {
  const { toast } = useToast();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    quantity_available: 100,
    max_per_order: 10,
    is_active: true,
  });

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId]);

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from("ticket_types")
          .update({
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            quantity_available: formData.quantity_available,
            max_per_order: formData.max_per_order,
            is_active: formData.is_active,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Ticket Type Updated",
          description: "The ticket type has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("ticket_types")
          .insert({
            event_id: eventId,
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            quantity_available: formData.quantity_available,
            max_per_order: formData.max_per_order,
            is_active: formData.is_active,
            sort_order: ticketTypes.length,
          });

        if (error) throw error;

        toast({
          title: "Ticket Type Created",
          description: "The new ticket type has been created successfully.",
        });
      }

      resetForm();
      fetchTicketTypes();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error saving ticket type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save ticket type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ticketType: TicketType) => {
    setEditingId(ticketType.id);
    setFormData({
      name: ticketType.name,
      description: ticketType.description || "",
      price: ticketType.price,
      quantity_available: ticketType.quantity_available,
      max_per_order: ticketType.max_per_order,
      is_active: ticketType.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket type?")) return;

    try {
      const { error } = await supabase
        .from("ticket_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Ticket Type Deleted",
        description: "The ticket type has been deleted.",
      });

      fetchTicketTypes();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error deleting ticket type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      quantity_available: 100,
      max_per_order: 10,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading ticket types...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Ticket Types
        </h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ticket Type
          </Button>
        )}
      </div>

      {/* Ticket Type Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? "Edit Ticket Type" : "New Ticket Type"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., General Admission, VIP"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's included with this ticket type?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Available</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity_available}
                    onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_per_order">Max Per Order</Label>
                  <Input
                    id="max_per_order"
                    type="number"
                    min="1"
                    value={formData.max_per_order}
                    onChange={(e) => setFormData({ ...formData, max_per_order: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (available for sale)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update" : "Create"} Ticket Type
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ticket Types List */}
      {ticketTypes.length === 0 && !showForm ? (
        <Card>
          <CardContent className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No ticket types yet. Add ticket types to sell tickets for this event.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Ticket Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ticketTypes.map((ticketType) => (
            <Card key={ticketType.id} className={!ticketType.is_active ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ticketType.name}</span>
                      {!ticketType.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {ticketType.quantity_sold >= ticketType.quantity_available && (
                        <Badge variant="destructive">Sold Out</Badge>
                      )}
                    </div>
                    {ticketType.description && (
                      <p className="text-sm text-muted-foreground">{ticketType.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {ticketType.price === 0 ? "Free" : `£${ticketType.price.toFixed(2)}`}
                      </span>
                      <span>
                        {ticketType.quantity_sold} / {ticketType.quantity_available} sold
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(ticketType)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ticketType.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [newKey, setNewKey] = useState({
    label: "",
    isAdmin: false,
    isActive: true
  });

  const { data: keys = [] } = useQuery({
    queryKey: ["access-keys"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/keys");
      return response.json();
    }
  });

  const createKey = useMutation({
    mutationFn: async (data: typeof newKey) => {
      const response = await apiRequest("POST", "/api/keys", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-keys"] });
      setIsCreateOpen(false);
      setNewKey({ label: "", isAdmin: false, isActive: true });
      toast({ title: "Success", description: "Access key created" });
    }
  });

  const updateKey = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof newKey> }) => {
      const response = await apiRequest("PATCH", `/api/keys/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-keys"] });
      toast({ title: "Success", description: "Access key updated" });
    }
  });

  const deleteKey = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/keys/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-keys"] });
      toast({ title: "Success", description: "Access key deleted" });
    }
  });

  return (
    <div className="space-y-6">
      {!keys.length && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Admin Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key"
                className="flex-1"
              />
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["access-keys"] })}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Access Key Management</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create New Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Access Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newKey.label}
                  onChange={e => setNewKey({ ...newKey, label: e.target.value })}
                  placeholder="Key Label"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKey.isAdmin}
                  onCheckedChange={checked => setNewKey({ ...newKey, isAdmin: checked })}
                />
                <Label>Admin Access</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKey.isActive}
                  onCheckedChange={checked => setNewKey({ ...newKey, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button
                className="w-full"
                onClick={() => createKey.mutate(newKey)}
                disabled={!newKey.label}
              >
                Create Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key: any) => (
                <TableRow key={key.id}>
                  <TableCell>{key.label}</TableCell>
                  <TableCell className="font-mono">{key.key}</TableCell>
                  <TableCell>
                    <Switch
                      checked={key.isAdmin}
                      onCheckedChange={checked => updateKey.mutate({ id: key.id, data: { isAdmin: checked } })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={key.isActive}
                      onCheckedChange={checked => updateKey.mutate({ id: key.id, data: { isActive: checked } })}
                    />
                  </TableCell>
                  <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteKey.mutate(key.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

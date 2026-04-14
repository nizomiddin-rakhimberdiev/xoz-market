import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { Category } from '@/types/database';
import { toast } from 'sonner';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { userStore } = useAuth();
  const storeId = userStore?.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sort_order: 1,
    is_active: true,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories', storeId],
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('sort_order');
      if (storeId) query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!storeId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || `cat-${Date.now()}`;
      const nextOrder = (categories?.length || 0) + 1;
      const { error } = await supabase.from('categories').insert({ name: data.name, slug, is_active: data.is_active, store_id: storeId, sort_order: data.sort_order || nextOrder });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Kategoriya qo\'shildi');
    },
    onError: (error: any) => {
      toast.error('Xatolik', { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { id, ...updateData } = data;
      const slug = updateData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || `cat-${Date.now()}`;
      const { error } = await supabase.from('categories').update({ ...updateData, slug }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Kategoriya yangilandi');
    },
    onError: (error: any) => {
      toast.error('Xatolik', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategoriya o\'chirildi');
    },
    onError: (error: any) => {
      toast.error('Xatolik', { description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', sort_order: (categories?.length || 0) + 1, is_active: true });
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ ...formData, id: editingCategory.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Kategoriyalar</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nomi *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Faol</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Bekor
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? 'Saqlash' : 'Qo\'shish'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories list */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : categories?.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Kategoriyalar topilmadi
            </div>
          ) : (
            categories?.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">{category.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: category.id, is_active: checked })
                    }
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('Kategoriyani o\'chirishni xohlaysizmi?')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

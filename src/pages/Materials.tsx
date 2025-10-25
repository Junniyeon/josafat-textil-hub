import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  stock: number;
  stock_minimo: number;
  precio: number;
}

const Materials = () => {
  const { hasRole } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad: '',
    stock: 0,
    stock_minimo: 0,
    precio: 0,
  });

  // Cargar materiales desde la base de datos
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Error cargando materiales:', error);
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!hasRole('admin') && !hasRole('almacenero')) {
      toast.error('No tienes permisos para agregar materiales');
      return;
    }
    setEditingMaterial(null);
    setFormData({ codigo: '', nombre: '', descripcion: '', unidad: '', stock: 0, stock_minimo: 0, precio: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    if (!hasRole('admin') && !hasRole('almacenero')) {
      toast.error('No tienes permisos para editar materiales');
      return;
    }
    setEditingMaterial(material);
    setFormData(material);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasRole('admin')) {
      toast.error('Solo administradores pueden eliminar materiales');
      return;
    }

    if (confirm('¿Estás seguro de eliminar este material?')) {
      try {
        const { error } = await supabase
          .from('materiales')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await loadMaterials();
        toast.success('Material eliminado correctamente');
      } catch (error: any) {
        console.error('Error eliminando material:', error);
        toast.error('Error al eliminar material');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('materiales')
          .update({
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            unidad: formData.unidad,
            stock: formData.stock,
            stock_minimo: formData.stock_minimo,
            precio: formData.precio,
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Material actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('materiales')
          .insert({
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            unidad: formData.unidad,
            stock: formData.stock,
            stock_minimo: formData.stock_minimo,
            precio: formData.precio,
          });

        if (error) throw error;
        toast.success('Material agregado correctamente');
      }

      await loadMaterials();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error guardando material:', error);
      toast.error(error.message || 'Error al guardar material');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Materiales</h1>
          <p className="text-muted-foreground mt-1">Administra el inventario de materiales</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Materiales</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Stock Mín.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Cargando materiales...
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay materiales registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.codigo}</TableCell>
                    <TableCell>{material.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{material.descripcion || '-'}</TableCell>
                    <TableCell>{material.unidad}</TableCell>
                    <TableCell className="text-right">
                      <span className={material.stock <= material.stock_minimo ? 'text-destructive font-medium' : ''}>
                        {material.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{material.stock_minimo}</TableCell>
                    <TableCell className="text-right">S/ {material.precio.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(hasRole('admin') || hasRole('almacenero')) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(material)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {hasRole('admin') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Modifica los datos del material' : 'Completa los datos del nuevo material'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="TEL-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidad">Unidad *</Label>
                <Input
                  id="unidad"
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  placeholder="metros, kg, unidades"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del material"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del material"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_minimo">Stock Mín.</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (S/)</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingMaterial ? 'Guardar Cambios' : 'Agregar Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materials;

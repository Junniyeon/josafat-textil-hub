import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const movementSchema = z.object({
  material_id: z.string().uuid('Seleccione un material'),
  tipo: z.enum(['entrada', 'salida'], { message: 'Seleccione un tipo' }),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().max(500, 'El motivo debe tener máximo 500 caracteres').optional(),
});

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
  unidad: string;
}

interface Movement {
  id: string;
  material_id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string | null;
  created_at: string;
  created_by: string;
  materiales: {
    codigo: string;
    nombre: string;
    unidad: string;
  };
}

const Movements = () => {
  const { user, hasRole } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    material_id: '',
    tipo: '' as 'entrada' | 'salida' | '',
    cantidad: '',
    motivo: '',
  });

  const canCreateMovement = hasRole('admin') || hasRole('almacenero');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar materiales
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('id, codigo, nombre, stock, unidad')
        .order('nombre');

      if (materialesError) throw materialesError;
      setMaterials(materialesData || []);

      // Cargar movimientos
      const { data: movimientosData, error: movimientosError } = await supabase
        .from('movimientos')
        .select(`
          *,
          materiales(codigo, nombre, unidad)
        `)
        .order('created_at', { ascending: false });

      if (movimientosError) throw movimientosError;
      setMovements(movimientosData || []);
    } catch (error) {
      console.error('Error cargando datos');
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!canCreateMovement) {
      toast.error('No tiene permisos para crear movimientos');
      return;
    }
    setFormData({ material_id: '', tipo: '', cantidad: '', motivo: '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Validar datos
      const validated = movementSchema.parse({
        ...formData,
        cantidad: Number(formData.cantidad),
      });

      const { error } = await supabase
        .from('movimientos')
        .insert({
          material_id: validated.material_id,
          tipo: validated.tipo,
          cantidad: validated.cantidad,
          motivo: validated.motivo || null,
          created_by: user!.id,
        });

      if (error) {
        if (error.message.includes('Stock insuficiente')) {
          toast.error(error.message);
        } else {
          throw error;
        }
        return;
      }

      toast.success('Movimiento registrado exitosamente');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error al crear movimiento');
        toast.error('Error al crear el movimiento');
      }
    }
  };

  const filteredMovements = movements.filter(
    (mov) =>
      mov.materiales.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.materiales.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMaterial = materials.find((m) => m.id === formData.material_id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Movimientos de Materiales</h1>
          <p className="text-muted-foreground mt-1">
            Registro de entradas y salidas de inventario
          </p>
        </div>
        {canCreateMovement && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron movimientos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={movement.tipo === 'entrada' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {movement.tipo === 'entrada' ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        )}
                        {movement.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {movement.materiales.nombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.materiales.codigo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {Number(movement.cantidad).toFixed(2)} {movement.materiales.unidad}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.motivo || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>
              Registre una entrada o salida de material del inventario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material *</Label>
              <Select
                value={formData.material_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, material_id: value })
                }
              >
                <SelectTrigger id="material">
                  <SelectValue placeholder="Seleccione un material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.codigo} - {material.nombre} (Stock: {Number(material.stock).toFixed(2)} {material.unidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Movimiento *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'entrada' | 'salida') =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-success" />
                      Entrada
                    </div>
                  </SelectItem>
                  <SelectItem value="salida">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-destructive" />
                      Salida
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'salida' && selectedMaterial && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Stock disponible: <span className="font-medium text-foreground">{Number(selectedMaterial.stock).toFixed(2)} {selectedMaterial.unidad}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                placeholder="Descripción del movimiento (opcional)"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movements;
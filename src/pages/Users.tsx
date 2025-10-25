import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Shield } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  estado: 'activo' | 'inactivo';
}

const Users = () => {
  const { user, hasRole } = useAuth();

  if (!hasRole('admin')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">Solo los administradores pueden acceder a esta sección</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [users, setUsers] = useState<Usuario[]>([
    { id: '1', email: 'admin@josafat.com', nombre: 'Administrador', rol: 'admin', estado: 'activo' },
    { id: '2', email: 'almacen@josafat.com', nombre: 'Juan Pérez', rol: 'almacenero', estado: 'activo' },
    { id: '3', email: 'produccion@josafat.com', nombre: 'María López', rol: 'produccion', estado: 'activo' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<Partial<Usuario>>({
    email: '',
    nombre: '',
    rol: 'produccion',
    estado: 'activo',
  });

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ email: '', nombre: '', rol: 'produccion', estado: 'activo' });
    setIsDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData(usuario);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== id));
      toast.success('Usuario eliminado correctamente');
    }
  };

  const handleSubmit = () => {
    if (!formData.email || !formData.nombre || !formData.rol) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData as Usuario } : u));
      toast.success('Usuario actualizado correctamente');
    } else {
      const newUser: Usuario = {
        id: Date.now().toString(),
        ...formData as Usuario,
      };
      setUsers([...users, newUser]);
      toast.success('Usuario agregado correctamente');
    }

    setIsDialogOpen(false);
  };

  const getRoleBadge = (rol: UserRole) => {
    const styles = {
      admin: 'bg-destructive/10 text-destructive',
      almacenero: 'bg-primary/10 text-primary',
      produccion: 'bg-success/10 text-success',
    };
    return styles[rol];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
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
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${getRoleBadge(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                      usuario.estado === 'activo' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {usuario.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(usuario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(usuario.id)}
                        disabled={usuario.id === user?.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los datos del usuario' : 'Completa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@josafat.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, rol: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="almacenero">Almacenero</SelectItem>
                    <SelectItem value="produccion">Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: 'activo' | 'inactivo') => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingUser && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> La contraseña inicial será generada automáticamente y enviada al email del usuario.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

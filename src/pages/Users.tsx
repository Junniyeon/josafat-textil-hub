import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  roles: UserRole[];
}

const Users = () => {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<{
    email: string;
    nombre: string;
    password: string;
    rol: UserRole;
  }>({
    email: '',
    nombre: '',
    password: '',
    rol: 'produccion',
  });

  useEffect(() => {
    if (hasRole('admin')) {
      loadUsers();
    }
  }, [hasRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nombre');

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            id: profile.id,
            email: profile.email,
            nombre: profile.nombre,
            roles: rolesData?.map(r => r.role as UserRole) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users');
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ email: '', nombre: '', password: '', rol: 'produccion' });
    setIsDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({ 
      email: usuario.email, 
      nombre: usuario.nombre, 
      password: '', 
      rol: usuario.roles[0] || 'produccion' 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      // Eliminar roles del usuario
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);

      if (rolesError) throw rolesError;

      // Eliminar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      toast.success('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user');
      toast.error('No se pudo eliminar el usuario');
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.nombre || (!editingUser && !formData.password)) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ nombre: formData.nombre })
          .eq('id', editingUser.id);

        if (profileError) throw profileError;

        // Actualizar rol
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.id, role: formData.rol });

        if (roleError) throw roleError;

        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nombre: formData.nombre,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo crear el usuario');

        // Asignar rol
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: formData.rol });

        if (roleError) throw roleError;

        toast.success('Usuario creado correctamente');
      }

      setIsDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user');
      toast.error(error.message || 'No se pudo guardar el usuario');
    }
  };

  const getRoleBadge = (roles: UserRole[]) => {
    const styles = {
      admin: 'bg-destructive/10 text-destructive',
      almacenero: 'bg-primary/10 text-primary',
      produccion: 'bg-success/10 text-success',
    };
    return styles[roles[0]] || styles.produccion;
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: 'Administrador',
      almacenero: 'Almacenero',
      produccion: 'Producción',
    };
    return labels[role];
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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${getRoleBadge(usuario.roles)}`}>
                        {getRoleLabel(usuario.roles[0] || 'produccion')}
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
                ))
              )}
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
                disabled={!!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}

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

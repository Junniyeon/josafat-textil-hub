import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  created_at: string;
}

interface Movement {
  id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  created_at: string;
  materiales: {
    nombre: string;
    unidad: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalMateriales, setTotalMateriales] = useState(0);
  const [stockBajo, setStockBajo] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [movimientosHoy, setMovimientosHoy] = useState(0);
  const [materialesBajoStock, setMaterialesBajoStock] = useState<Material[]>([]);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar materiales
      const { data: materiales, error: materialesError } = await supabase
        .from('materiales')
        .select('*');

      if (materialesError) throw materialesError;

      // Calcular estadísticas
      setTotalMateriales(materiales?.length || 0);
      
      const bajoStock = materiales?.filter(m => m.stock <= m.stock_minimo) || [];
      setStockBajo(bajoStock.length);
      setMaterialesBajoStock(bajoStock.slice(0, 3)); // Solo los primeros 3

      // Cargar usuarios
      const { count: usuariosCount, error: usuariosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usuariosError) throw usuariosError;
      setTotalUsuarios(usuariosCount || 0);

      // Cargar movimientos
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const { data: movimientos, error: movimientosError } = await supabase
        .from('movimientos')
        .select(`
          *,
          materiales(nombre, unidad)
        `)
        .gte('created_at', hoy.toISOString())
        .order('created_at', { ascending: false });

      if (movimientosError) throw movimientosError;
      
      setMovimientosHoy(movimientos?.length || 0);
      setRecentMovements((movimientos || []).slice(0, 5));

    } catch (error) {
      console.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Materiales',
      value: totalMateriales.toString(),
      description: 'Materiales registrados',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Stock Bajo',
      value: stockBajo.toString(),
      description: 'Requieren reabastecimiento',
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Usuarios Activos',
      value: totalUsuarios.toString(),
      description: 'En el sistema',
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Movimientos Hoy',
      value: movimientosHoy.toString(),
      description: 'Entradas y salidas',
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-muted-foreground mt-1">
          Sistema de Gestión de Materiales - Empresa Textil JOSAFAT
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos de materiales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="py-2 border-b last:border-0">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))
              ) : recentMovements.length > 0 ? (
                recentMovements.map((movement) => {
                  const timeAgo = Math.floor((Date.now() - new Date(movement.created_at).getTime()) / 60000);
                  const timeText = timeAgo < 60 
                    ? `Hace ${timeAgo} min` 
                    : `Hace ${Math.floor(timeAgo / 60)} h`;
                  
                  return (
                    <div key={movement.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{movement.materiales.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.tipo === 'entrada' ? 'Entrada' : 'Salida'} - {Number(movement.cantidad).toFixed(2)} {movement.materiales.unidad}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeText}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No hay movimientos registrados hoy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
            <CardDescription>Materiales con stock bajo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="py-2 border-b last:border-0">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))
              ) : materialesBajoStock.length > 0 ? (
                materialesBajoStock.map((material) => (
                  <div key={material.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{material.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {Number(material.stock).toFixed(2)} / Mínimo: {Number(material.stock_minimo).toFixed(2)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      material.stock === 0
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {material.stock === 0 ? 'Crítico' : 'Bajo'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No hay materiales con stock bajo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

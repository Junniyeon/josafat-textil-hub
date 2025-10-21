import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Materiales',
      value: '156',
      description: 'Materiales registrados',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Stock Bajo',
      value: '12',
      description: 'Requieren reabastecimiento',
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Usuarios Activos',
      value: '8',
      description: 'En el sistema',
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Movimientos Hoy',
      value: '24',
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
        {stats.map((stat, index) => (
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
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos de materiales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { accion: 'Entrada', material: 'Tela algodón', cantidad: '50 m', tiempo: 'Hace 2 horas' },
                { accion: 'Salida', material: 'Hilo poliéster', cantidad: '20 kg', tiempo: 'Hace 4 horas' },
                { accion: 'Entrada', material: 'Botones plástico', cantidad: '1000 unid', tiempo: 'Hace 6 horas' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{item.material}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.accion} - {item.cantidad}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.tiempo}</span>
                </div>
              ))}
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
              {[
                { material: 'Tela denim', stock: '15 m', minimo: '50 m', nivel: 'Crítico' },
                { material: 'Cremalleras metálicas', stock: '80 unid', minimo: '200 unid', nivel: 'Bajo' },
                { material: 'Etiquetas bordadas', stock: '120 unid', minimo: '300 unid', nivel: 'Bajo' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{item.material}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {item.stock} / Mínimo: {item.minimo}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    item.nivel === 'Crítico' 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {item.nivel}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

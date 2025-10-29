-- Crear tipo enum para los tipos de movimiento
CREATE TYPE public.tipo_movimiento AS ENUM ('entrada', 'salida');

-- Crear tabla de movimientos
CREATE TABLE public.movimientos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materiales(id) ON DELETE RESTRICT,
  tipo tipo_movimiento NOT NULL,
  cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
  motivo TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para movimientos
CREATE POLICY "Usuarios autenticados pueden ver movimientos"
  ON public.movimientos
  FOR SELECT
  USING (true);

CREATE POLICY "Admins y almaceneros pueden crear movimientos"
  ON public.movimientos
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'almacenero'::app_role)
  );

CREATE POLICY "Solo admins pueden eliminar movimientos"
  ON public.movimientos
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_stock_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stock_actual NUMERIC;
BEGIN
  -- Obtener stock actual del material
  SELECT stock INTO stock_actual
  FROM materiales
  WHERE id = NEW.material_id;

  -- Validar que hay suficiente stock para salidas
  IF NEW.tipo = 'salida' AND stock_actual < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Stock disponible: %, Cantidad solicitada: %', stock_actual, NEW.cantidad;
  END IF;

  -- Actualizar stock según el tipo de movimiento
  IF NEW.tipo = 'entrada' THEN
    UPDATE materiales
    SET stock = stock + NEW.cantidad,
        updated_at = now()
    WHERE id = NEW.material_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE materiales
    SET stock = stock - NEW.cantidad,
        updated_at = now()
    WHERE id = NEW.material_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para actualizar stock automáticamente
CREATE TRIGGER trigger_actualizar_stock
  AFTER INSERT ON public.movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_stock_material();

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_movimientos_material_id ON public.movimientos(material_id);
CREATE INDEX idx_movimientos_created_at ON public.movimientos(created_at DESC);
CREATE INDEX idx_movimientos_created_by ON public.movimientos(created_by);
import { Reserva } from '../../aggregates/inventario/reserva.entity';

export interface ReservaRepository {
  guardar(reserva: Reserva): Promise<void>;
  buscarPorId(id: string): Promise<Reserva | null>;
  buscarActivasPorOperacion(operacionId: string): Promise<Reserva[]>;
  buscarExpiradas(): Promise<Reserva[]>;
  actualizar(reserva: Reserva): Promise<void>;
  buscarPorInventario(inventarioId: string): Promise<Reserva[]>;
}

export interface ConfiguracionPort {
  obtenerMaxIntentosLogin(): Promise<number>;
  obtenerMinutosBloqueoInicial(): Promise<number>;
  obtenerDiasExpiracionPasswordEmpleado(): Promise<number>;
  obtenerMaxSesionesPorUsuario(): Promise<number>;
  obtenerMinutosExpiracionTokenRecuperacion(): Promise<number>;
  obtenerHorasExpiracionTokenVerificacion(): Promise<number>;
  obtenerTTLAccessTokenCliente(): Promise<number>;
  obtenerTTLAccessTokenEmpleado(): Promise<number>;
  obtenerTTLRefreshTokenClienteDias(): Promise<number>;
  obtenerTTLRefreshTokenEmpleadoHoras(): Promise<number>;
}

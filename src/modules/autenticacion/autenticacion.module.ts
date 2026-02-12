import { Module } from '@nestjs/common';
import {
  AUTENTICACION_SERVICE_TOKEN,
  REGISTRO_CUENTA_SERVICE_TOKEN,
  VERIFICACION_EMAIL_SERVICE_TOKEN,
  GESTION_PASSWORD_SERVICE_TOKEN,
  GESTION_SESIONES_SERVICE_TOKEN,
  ADMIN_CUENTA_SERVICE_TOKEN,
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  JWT_SERVICE_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CLIENTE_PORT_TOKEN,
  EMPLEADO_PORT_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from './domain/ports/tokens';
import { AutenticacionApplicationService } from './application/services/autenticacion-application.service';
import { RegistroCuentaApplicationService } from './application/services/registro-cuenta-application.service';
import { VerificacionEmailApplicationService } from './application/services/verificacion-email-application.service';
import { GestionPasswordApplicationService } from './application/services/gestion-password-application.service';
import { GestionSesionesApplicationService } from './application/services/gestion-sesiones-application.service';
import { AdminCuentaApplicationService } from './application/services/admin-cuenta-application.service';
import { CuentaValidationService } from './application/services/internal/cuenta-validation.service';
import { TokenRecoveryService } from './application/services/internal/token-recovery.service';
import { SesionManagementService } from './application/services/internal/sesion-management.service';

@Module({
  providers: [
    {
      provide: AUTENTICACION_SERVICE_TOKEN,
      useClass: AutenticacionApplicationService,
    },
    {
      provide: REGISTRO_CUENTA_SERVICE_TOKEN,
      useClass: RegistroCuentaApplicationService,
    },
    {
      provide: VERIFICACION_EMAIL_SERVICE_TOKEN,
      useClass: VerificacionEmailApplicationService,
    },
    {
      provide: GESTION_PASSWORD_SERVICE_TOKEN,
      useClass: GestionPasswordApplicationService,
    },
    {
      provide: GESTION_SESIONES_SERVICE_TOKEN,
      useClass: GestionSesionesApplicationService,
    },
    {
      provide: ADMIN_CUENTA_SERVICE_TOKEN,
      useClass: AdminCuentaApplicationService,
    },
    CuentaValidationService,
    TokenRecoveryService,
    SesionManagementService,
  ],
  exports: [
    AUTENTICACION_SERVICE_TOKEN,
    REGISTRO_CUENTA_SERVICE_TOKEN,
    VERIFICACION_EMAIL_SERVICE_TOKEN,
    GESTION_PASSWORD_SERVICE_TOKEN,
    GESTION_SESIONES_SERVICE_TOKEN,
    ADMIN_CUENTA_SERVICE_TOKEN,
  ],
})
export class AutenticacionModule {}

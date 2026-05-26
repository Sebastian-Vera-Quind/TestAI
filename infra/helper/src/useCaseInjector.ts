import {
  DatasourceUseCase,
  OrganizationUseCase,
  PermissionUseCase,
  RoleUseCase,
} from '@insight-ai/domain-ports/in';
import { OutPortInjector, OutPortType } from './adapterInjector';
import {
  DatasourceUseCaseService,
  OrganizationUseCaseService,
  PermissionUseCaseService,
  RoleUseCaseService,
  UserUseCaseService,
} from '@insight-ai/usecase';

export enum InPortType {
  OrganizationUseCase = 'organizationUseCase',
  UserUseCase = 'userUseCase',
  RoleUseCase = 'roleUseCase',
  PermissionUseCase = 'permissionUseCase',
  DatasourceUseCase = 'datasourceUseCase',
}

export interface InPortTypeMap {
  [InPortType.UserUseCase]: UserUseCaseService;
  [InPortType.OrganizationUseCase]: OrganizationUseCase;
  [InPortType.RoleUseCase]: RoleUseCase;
  [InPortType.PermissionUseCase]: PermissionUseCase;
  [InPortType.DatasourceUseCase]: DatasourceUseCase;
}

const inPortFactories: {
  [K in keyof InPortTypeMap]: () => InPortTypeMap[K];
} = {
  [InPortType.UserUseCase]: () =>
    new UserUseCaseService({
      userRepository: OutPortInjector.getOutPort(OutPortType.UserRepository),
    }),
  [InPortType.OrganizationUseCase]: () =>
    new OrganizationUseCaseService({
      organizationRepository: OutPortInjector.getOutPort(
        OutPortType.OrganizationRepository,
      ),
      roleRepository: OutPortInjector.getOutPort(OutPortType.RoleRepository),
      permissionRepository: OutPortInjector.getOutPort(
        OutPortType.PermissionRepository,
      ),
      userRepository: OutPortInjector.getOutPort(OutPortType.UserRepository),
    }),
  [InPortType.RoleUseCase]: () =>
    new RoleUseCaseService({
      roleRepository: OutPortInjector.getOutPort(OutPortType.RoleRepository),
      permissionRepository: OutPortInjector.getOutPort(
        OutPortType.PermissionRepository,
      ),
      organizationRepository: OutPortInjector.getOutPort(
        OutPortType.OrganizationRepository,
      ),
      datasourceRepository: OutPortInjector.getOutPort(
        OutPortType.DatasourceRepository,
      ),
    }),
  [InPortType.PermissionUseCase]: () =>
    new PermissionUseCaseService({
      roleRepository: OutPortInjector.getOutPort(OutPortType.RoleRepository),
      permissionRepository: OutPortInjector.getOutPort(
        OutPortType.PermissionRepository,
      ),
      organizationRepository: OutPortInjector.getOutPort(
        OutPortType.OrganizationRepository,
      ),
    }),
  [InPortType.DatasourceUseCase]: () =>
    new DatasourceUseCaseService({
      datasourceRepository: OutPortInjector.getOutPort(
        OutPortType.DatasourceRepository,
      ),
      organizationRepository: OutPortInjector.getOutPort(
        OutPortType.OrganizationRepository,
      ),
      permissionRepository: OutPortInjector.getOutPort(
        OutPortType.PermissionRepository,
      ),
      roleRepository: OutPortInjector.getOutPort(OutPortType.RoleRepository),
    }),
};

export class UseCaseInjector {
  private static readonly useCaseInstances = new Map<
    InPortType,
    InPortTypeMap[InPortType]
  >();

  static getUseCase<K extends InPortType>(type: K): InPortTypeMap[K] {
    const existing = UseCaseInjector.useCaseInstances.get(type) as
      | InPortTypeMap[K]
      | undefined;

    if (existing) {
      return existing;
    }
    const created = inPortFactories[type]();
    UseCaseInjector.useCaseInstances.set(type, created);
    return created;
  }
}

import {
  DatasourceRepository,
  OrganizationRepository,
  PermissionRepository,
  RoleRepository,
  UserRepository,
} from '@insight-ai/domain-ports/out';
import {
  DatasourceRepositoryAdapter,
  OrganizationRepositoryAdapter,
  PermissionRepositoryAdapter,
  RoleRepositoryAdapter,
  UserRepositoryAdapter,
} from '@insight-ai/persistence-adapter';

export enum OutPortType {
  UserRepository = 'userRepository',
  RoleRepository = 'roleRepository',
  OrganizationRepository = 'organizationRepository',
  PermissionRepository = 'permissionRepository',
  DatasourceRepository = 'datasourceRepository',
}

export interface OutPortTypeMap {
  [OutPortType.UserRepository]: UserRepository;
  [OutPortType.RoleRepository]: RoleRepository;
  [OutPortType.OrganizationRepository]: OrganizationRepository;
  [OutPortType.PermissionRepository]: PermissionRepository;
  [OutPortType.DatasourceRepository]: DatasourceRepository;
}
const outPortFactories: {
  [K in keyof OutPortTypeMap]: () => OutPortTypeMap[K];
} = {
  [OutPortType.UserRepository]: () => new UserRepositoryAdapter(),
  [OutPortType.RoleRepository]: () => new RoleRepositoryAdapter(),
  [OutPortType.OrganizationRepository]: () =>
    new OrganizationRepositoryAdapter(),
  [OutPortType.PermissionRepository]: () => new PermissionRepositoryAdapter(),
  [OutPortType.DatasourceRepository]: () => new DatasourceRepositoryAdapter(),
};

export class OutPortInjector {
  private static readonly outInstances = new Map<
    OutPortType,
    OutPortTypeMap[OutPortType]
  >();

  private constructor() {}

  static getOutPort<T extends OutPortType>(type: T): OutPortTypeMap[T] {
    const existing = OutPortInjector.outInstances.get(type) as
      | OutPortTypeMap[T]
      | undefined;

    if (existing) {
      return existing;
    }

    const created = outPortFactories[type]();
    OutPortInjector.outInstances.set(type, created);

    return created;
  }
}

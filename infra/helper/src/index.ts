import {
  OutPortInjector,
  OutPortType,
  OutPortTypeMap,
} from './adapterInjector';
import { InPortType, InPortTypeMap, UseCaseInjector } from './useCaseInjector';

function inject<T extends OutPortType>(type: T): OutPortTypeMap[T];
function inject<T extends InPortType>(type: T): InPortTypeMap[T];
function inject(type: OutPortType | InPortType) {
  if (Object.values(OutPortType).includes(type as OutPortType)) {
    return OutPortInjector.getOutPort(type as OutPortType);
  }
  if (Object.values(InPortType).includes(type as InPortType)) {
    return UseCaseInjector.getUseCase(type as InPortType);
  }
}

export { inject, OutPortType, InPortType };

import { UUID } from 'node:crypto';

export interface User {
  idUser: UUID;
  name: string;
  email: string;
  imageUrl?: string;
  validated: boolean;
}

export interface SessionData {
  idUser: UUID;
  name: string;
  imageUrl?: string;
  email: string;
}

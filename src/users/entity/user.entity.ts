import { Roles } from "../enums/roles.enum";

export class UserEntity {
    id: number;
    name: string;
    email: string;
    role?: Roles;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
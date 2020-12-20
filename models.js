import {BaseEntity, EntitySchema} from 'typeorm'

export class User extends BaseEntity {
	name
	ip
}

export const UserSchema = new EntitySchema({
	name: 'User',
	target: User,
	columns: {
		name: {
			type: 'varchar',
			nullable: true
		},
		ip: {
			primary: true,
			type: 'varchar'
		}
	}
})

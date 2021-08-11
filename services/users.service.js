'use strict';

const DbMixin = require('../mixins/db.mixin');
const bcrypt = require('bcryptjs');
const {MoleculerError} = require('moleculer').Errors;
const jwt = require('jsonwebtoken');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'users',
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbMixin('users')],

	/**
	 * Settings
	 */
	settings: {
		// Available fields in the responses
		rest: '/v1/users',
		fields: [
			'_id',
			'name',
			'email',
			'address',
			'gender',
			'phone',
			'createdAt',
			'updatedAt',
		],

		entityValidator: {
			name: {type: 'string', min: 2, nullable: false},
			email: {type: 'email', unique: true, nullable: false},
			password: {type: 'string', min: 6, max: 255},
			address: {type: 'string', min: 2, optional: true},
			gender: {
				type: 'enum',
				values: ['male', 'female'],
				nullable: true,
				default: 'male',
			},
			phone: {type: 'string', length: 10},
		},
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			async create(ctx) {
				const user = await this._find('', {
					query: {email: ctx.params.email},
				});
				if (user) throw new MoleculerError('Email already exists', 401);
				ctx.params.password = bcrypt.hashSync(ctx.params.password, 10);
				ctx.params.createdAt = new Date();
				ctx.params.updatedAt = new Date();
				ctx.params.deletedAt = null;
			},
			async update(ctx) {
				ctx.params.updatedAt = new Date();
			},
			delete(ctx) {
				ctx.params.deletedAt = new Date();
			},
		},
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * The "moleculer-db" mixin registers the following actions:
		 *  - list
		 *  - find
		 *  - count
		 *  - create
		 *  - insert
		 *  - update
		 *  - remove
		 */

		// --- ADDITIONAL ACTIONS ---

		signIn: {
			rest: 'POST /sign_in',
			params: {
				username: {
					type: 'email',
				},
				password: {
					type: 'string',
				},
			},
			async handler(ctx) {
				const {username, password} = ctx.params;
				const user = await this.adapter.findOne({email: username});
				if (!user)
					throw new MoleculerError('Invalid Email', 401, '', [
						{field: 'email', message: 'is not found'},
					]);

				const res = await bcrypt.compare(password, user.password);
				if (!res)
					throw new MoleculerError('Invalid password', 401, '', [
						{field: 'password', message: 'is not found'},
					]);

				return await this.transformEntityAuth(user);
			},
		},

		resolveToken: {
			rest: 'GET /token',
			params: {
				accessToken: 'string',
			},
			async handler(ctx) {
				const {accessToken} = ctx.params;
				const decoded = await jwt.verify(
					accessToken,
					process.env.ACCESS_TOKEN_SECRET,
				);

				const user = await this.getById(decoded.id);

				if (!user) {
					throw new MoleculerError('Invalid token', 401, '', [
						{field: 'User', message: 'is not found'},
					]);
				}
				return await this.transformDocuments(ctx, {}, user);
			},
		},

		/**
		 * Increase the quantity of the product item.
		 */
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Loading sample data to the collection.
		 * It is called in the DB.mixin after the database
		 * connection establishing & the collection is empty.
		 */

		generateJWT({user, type}) {
			if (type === 'ACCESS_TOKEN') {
				return jwt.sign(
					{
						id: user._id,
						email: user.email,
					},
					process.env.ACCESS_TOKEN_SECRET,
					{expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN},
				);
			}
			if (type === 'REFRESH_TOKEN') {
				return jwt.sign(
					{
						id: user._id,
						email: user.email,
					},
					process.env.REFRESH_TOKEN_SECRET,
					{expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN},
				);
			}
			return null;
		},

		async transformEntityAuth(user) {
			return {
				accessToken: await this.generateJWT({
					user,
					type: 'ACCESS_TOKEN',
				}),
				refreshToken: await this.generateJWT({
					user,
					type: 'REFRESH_TOKEN',
				}),
				tokenType: process.env.TOKEN_TYPE,
				expireIn: process.env.TOKEN_EXPIRE_IN,
			};
		},
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	},
};

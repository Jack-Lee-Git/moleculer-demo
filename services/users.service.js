'use strict';


const DbMixin = require('../mixins/db.mixin');
const bcrypt = require('bcryptjs');
const { MoleculerError } = require('moleculer').Errors;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'users',
  // version: 1

  /**
	 * Mixins
	 */
  mixins: [
    DbMixin('users'),
  ],

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
      'password',
      'address',
      'gender',
	  'phone',
      'createdAt',
      'updatedAt',
    ],

    entityValidator: {
      name: { type: 'string', min: 2, nullable: false },
      email: { type: 'email', unique: true, nullable: false },
      password: { type: 'string', min: 6, max: 255 },
      address: { type: 'string', min: 2, optional: true },
      gender: { type: 'enum', values: ['male', 'female'], nullable: true, default: 'male' },
      phone: { type: 'string', length: 10 },
    }
  },

  /**
	 * Action Hooks
	 */
  hooks: {
    before: {
      async create(ctx) {
		 const user = await this._find('', {query: {email: ctx.params.email}});
		 if(user)
			 throw new MoleculerError('Email already exists', 401);
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
      }
    }
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

  },

  /**
	 * Fired after database connection establishing.
	 */
  async afterConnected() {
  // await this.adapter.collection.createIndex({ name: 1 });
  }
};

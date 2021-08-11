'use strict';

const fs = require('fs');
const DbService = require('moleculer-db');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = function (collection) {
	const cacheCleanEventName = `cache.clean.${collection}`;

	const schema = {
		mixins: [DbService],

		events: {
			/**
			 * Subscribe to the cache clean event. If it's triggered
			 * clean the cache entries for this service.
			 *
			 * @param {Context} ctx
			 */
			async [cacheCleanEventName]() {
				if (this.broker.cacher) {
					await this.broker.cacher.clean(`${this.fullName}.*`);
				}
			},
		},

		methods: {
			/**
			 * Send a cache clearing event when an entity changed.
			 *
			 * @param {String} type
			 * @param {any} json
			 * @param {Context} ctx
			 */
			async entityChanged(type, json, ctx) {
				ctx.broadcast(cacheCleanEventName);
			},
		},
	};

	if (process.env.MONGO_URI) {
		// Mongo adapter
		const MongoAdapter = require('moleculer-db-adapter-mongo');

		schema.adapter = new MongoAdapter(process.env.MONGO_URI);
		schema.collection = collection;
	} else if (process.env.NODE_ENV === 'test') {
		// NeDB memory adapter for testing
		schema.adapter = new DbService.MemoryAdapter();
	} else {
		// NeDB file DB adapter

		// Create data folder
		if (!fs.existsSync('./data')) {
			fs.mkdirSync('./data');
		}

		schema.adapter = new DbService.MemoryAdapter({
			filename: `./data/${collection}.db`,
		});
	}

	return schema;
};

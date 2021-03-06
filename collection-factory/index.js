'use strict'

const format        = require('util').format
const _          = require('lodash')
const Collection = require('../collection')

let factoryInstance = null

/**
 * Collection Factory
 * 
 * Singleton used to create and store a map
 * of collections.
 * 
 * @param {Object} defs
 * @param {Mongoose.Connection} connection
 * @class CollectionFactory
 */
class CollectionFactory {
	constructor(defs, connection) {
		if (!factoryInstance) {
			factoryInstance = this
		} else {
			return factoryInstance
		}

		this._instances = {}
		this._definitions = _.assign({}, defs)
		this._connection = connection

		// Add definition key to name property in definition
		// and initialize each collection
		for (let key in this._definitions) {
			this._definitions[key].name = key
			this._instances[key] = this.getInstance(key)
		}
		
		// Gather Model Names
		let modelNames = []
		Object.keys(this._instances).map((key) => {
			modelNames.push(this._instances[key]._definition.singular)
		})
		
		// Validate Field Model References
		for (let key in this._instances) {
			let errors = []
			for (let field in this._instances[key]._definition.fields){
				if(!Collection.isValidFieldRef(this._instances[key]._definition.fields[field], field, modelNames, errors)){
					if(errors.length > 0)
						throw new Error(format('`%s` collection %s', key, errors[0]))
				}
			}
		}
		
	}

	/**
	 * Get a collection instance by name
	 * 
	 * @param  {String} name
	 * @return {Collection}
	 */
	getInstance(name) {
		if (this._instances.hasOwnProperty(name)) {
			return this._instances[name]
		} else {
			let def = this._definitions[name]
			if (!def) return
			return this._instances[name] = new Collection(name, def, this)
		}
	}

	/**
	 * Get a collection instance by model name
	 * 
	 * @param  {String} modelName
	 * @return {Collection}
	 */
	getInstanceWithModel(modelName) {
		let matchDef = _.find(this._definitions, obj => { return obj.singular == modelName })
		if (!matchDef) return
		return this.getInstance(matchDef.name)
	}

	/**
	 * Get all collection instances
	 * 
	 * @readonly
	 * @return {Object}
	 */
	get collections() {
		return Object.assign({}, this._instances)
	}

	/**
	 * Get the Mongoose connection
	 * 
	 * @readonly
	 */
	get connection() {
		return this._connection
	}

	/**
	 * Destroy the factory instance. This is for testing only.
	 * 
	 * @static
	 * @private
	 */
	static _destroy() {
		factoryInstance = null
	}
}

module.exports = CollectionFactory

'use strict';

const assert = require('assert');

const
	Action = require('./Action'),
	Link = require('./Link');

function Entity(entity) {
	if (entity instanceof Entity) {
		return entity;
	}
	if (!(this instanceof Entity)) {
		return new Entity(entity);
	}

	if ('object' !== typeof entity) {
		entity = JSON.parse(entity);
	}

	const self = this;

	assert('undefined' === typeof entity.rel || Array.isArray(entity.rel));
	assert('undefined' === typeof entity.title || 'string' === typeof entity.title);
	assert('undefined' === typeof entity.type || 'string' === typeof entity.type);
	assert('undefined' === typeof entity.properties || 'object' === typeof entity.properties);
	assert('undefined' === typeof entity.class || Array.isArray(entity.class));
	assert('undefined' === typeof entity.actions || Array.isArray(entity.actions));
	assert('undefined' === typeof entity.links || Array.isArray(entity.links));
	assert('undefined' === typeof entity.entities || Array.isArray(entity.entities));

	if (entity.rel) {
		// Only applies to sub-entities (required for them)
		self.rel = entity.rel;
	}

	if (entity.title) {
		self.title = entity.title;
	}

	if (entity.type) {
		self.type = entity.type;
	}

	if (entity.properties) {
		self.properties = entity.properties;
	}

	if (entity.class) {
		self.class = entity.class;
	}

	self._actionsByName = {};
	if (entity.actions) {
		self.actions = [];
		entity.actions.forEach(function(action) {
			const actionInstance = new Action(action);
			self.actions.push(actionInstance);
			self._actionsByName[action.name] = actionInstance;
		});
	}

	self._linkRels = {};
	self._linksByRel = {};
	if (entity.links) {
		self.links = [];
		entity.links.forEach(function(link) {
			const linkInstance = new Link(link);
			self.links.push(linkInstance);

			link.rel.forEach(function(rel) {
				self._linkRels[rel] = true;

				/* istanbul ignore else */
				if (!(self._linksByRel[rel])) {
					self._linksByRel[rel] = [];
				}
				self._linksByRel[rel].push(linkInstance);
			});
		});
	}

	self._entityRels = {};
	self._entitiesByRel = {};
	self._entitiesByClass = {};
	if (entity.entities) {
		self.entities = [];
		entity.entities.forEach(function(subEntity) {
			assert(Array.isArray(subEntity.rel));

			let subEntityInstance;
			if ('string' === typeof subEntity.href) {
				subEntityInstance = new Link(subEntity);
			} else {
				subEntityInstance = new Entity(subEntity);
			}
			self.entities.push(subEntityInstance);

			subEntity.rel.forEach(function(rel) {
				self._entityRels[rel] = true;

				/* istanbul ignore else */
				if (!self._entitiesByRel[rel]) {
					self._entitiesByRel[rel] = [];
				}
				self._entitiesByRel[rel].push(subEntityInstance);
			});

			if (Array.isArray(subEntity.class)) {
				subEntity.class.forEach(function(cls) {
					/* istanbul ignore else */
					if (!self._entitiesByClass[cls]) {
						self._entitiesByClass[cls] = [];
					}
					self._entitiesByClass[cls].push(subEntityInstance);
				});
			}
		});
	}
}

Entity.prototype.hasAction = function(actionName) {
	return this._actionsByName.hasOwnProperty(actionName);
};

Entity.prototype.hasClass = function(cls) {
	return this.class instanceof Array && this.class.indexOf(cls) > -1;
};

Entity.prototype.hasEntity = function(entityRel) {
	return this._entityRels.hasOwnProperty(entityRel);
};

Entity.prototype.hasLink = function(linkRel) {
	return this._linkRels.hasOwnProperty(linkRel);
};

Entity.prototype.hasProperty = function(property) {
	return this.properties.hasOwnProperty(property);
};

Entity.prototype.getAction = function(actionName) {
	return this._actionsByName[actionName];
};

Entity.prototype.getLink = function(linkRel) {
	return this._getFirstOrUndefined('_linksByRel', linkRel);
};

Entity.prototype.getLinks = function(linkRel) {
	return this._getSetOrEmpty('_linksByRel', linkRel);
};

Entity.prototype.getSubEntity = function(entityRel) {
	return this._getFirstOrUndefined('_entitiesByRel', entityRel);
};

Entity.prototype.getSubEntities = function(entityRel) {
	return this._getSetOrEmpty('_entitiesByRel', entityRel);
};

Entity.prototype.getSubEntityByClass = function(cls) {
	return this._getFirstOrUndefined('_entitiesByClass', cls);
};

Entity.prototype.getSubEntitiesByClass = function(cls) {
	return this._getSetOrEmpty('_entitiesByClass', cls);
};

Entity.prototype._getFirstOrUndefined = function(set, key) {
	const vals = this[set][key];

	return vals ? vals[0] : undefined;
};

Entity.prototype._getSetOrEmpty = function(set, key) {
	const vals = this[set][key];

	return vals ? vals.slice() : [];
};

module.exports = Entity;

// Generated by CoffeeScript 1.7.1
(function() {
  var Kerigan, async, coffee, _,
    __slice = [].slice;

  Kerigan = (typeof exports !== "undefined" && exports !== null) && exports || (this.Kerigan = {});

  coffee = require('coffee-script');

  require('coffee-script/register');

  _ = require('underscore');

  async = require('async');

  Kerigan.Engine = function() {
    var eg;
    eg = new (require('events').EventEmitter);
    eg.next = function(skill) {
      var buff, valid, _i, _len, _ref;
      valid = true;
      eg.emit('validation', eg, skill, function(v) {
        return valid = v && valid;
      });
      if (!eg.finished) {
        if (valid) {
          eg.emit('next', eg, skill);
          skill(eg);
          _ref = eg.buffs;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            buff = _ref[_i];
            if (buff.initial) {
              buff.emit('add', eg);
              buff.initial = false;
            } else {
              buff.emit('tick', eg, skill);
            }
          }
          eg.rounds += 1;
          return eg.emit('check-finish', eg);
        } else {
          return eg.emit('invalid', eg, skill);
        }
      } else {
        return eg.emit('finished', eg);
      }
    };
    eg.init = function(init) {
      eg.state = init || {};
      eg.values = {};
      eg.emit('init', eg);
      return eg.reset();
    };
    eg.reset = function() {
      eg.rounds = 0;
      eg.buffs = [];
      eg.finished = false;
      return eg.emit('reset', eg);
    };
    eg.chk_buff = function(buff) {
      if (typeof buff === 'string') {
        return _.any(eg.buffs, function(bf) {
          return bf.id === buff;
        });
      } else {
        return _.contains(eg.buffs, buff);
      }
    };
    eg.get_buff = function(id) {
      return _.filter(eg.buffs, function(buff) {
        return buff.id === id;
      });
    };
    eg.add_buff = function(buff) {
      var mutual, _i, _len, _ref;
      _ref = buff.mutuals;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mutual = _ref[_i];
        eg.del_buff(mutual);
      }
      return eg.buffs.push(buff);
    };
    eg.del_buff = function(buff) {
      var bf, removed, _i, _len, _results;
      if (typeof buff === 'string') {
        removed = _.filter(eg.buffs, function(bf) {
          return bf.id === buff;
        });
        eg.buffs = _.filter(eg.buffs, function(bf) {
          return bf.id !== buff;
        });
        _results = [];
        for (_i = 0, _len = removed.length; _i < _len; _i++) {
          bf = removed[_i];
          _results.push(bf.emit('delete', eg));
        }
        return _results;
      } else {
        eg.buffs = _.without(eg.buffs, buff);
        return buff.emit('delete', eg);
      }
    };
    eg.inspect = function() {
      var buff, inspect_state, result, util, _i, _len, _ref;
      util = require('util');
      result = '';
      inspect_state = function(obj, d) {
        var key, value, _results;
        d += 1;
        _results = [];
        for (key in obj) {
          value = obj[key];
          _.times(d, function() {
            return result += '  ';
          });
          if (typeof value !== 'object') {
            if (typeof value === 'number') {
              value = parseFloat(value.toFixed(3));
            }
            result += util.inspect(value);
            _results.push(result += '\n');
          } else {
            result += "" + key + ":\n";
            _results.push(inspect_state(value, d));
          }
        }
        return _results;
      };
      result += 'State:\n';
      inspect_state(eg.state, 0);
      result += '\n';
      result += 'Rounds: ' + (util.inspect(eg.rounds, {
        colors: true
      })) + '\n\n';
      result += 'Buffs:\n';
      _ref = eg.buffs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        buff = _ref[_i];
        result += '  ' + util.inspect(buff) + '\n';
      }
      return result;
    };
    eg.init();
    eg._this = this;
    eg._type = Kerigan.Engine;
    return eg;
  };

  Kerigan.Buff = function(id) {
    var bf;
    bf = new (require('events').EventEmitter);
    bf.id = id;
    bf.on('add', function(engine) {
      var setup, _i, _len, _ref, _results;
      _ref = bf.mods;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        setup = _ref[_i];
        _results.push(setup.value.install(bf.id, setup.mod));
      }
      return _results;
    });
    bf.on('tick', function(engine) {
      if (bf.life !== 'infinite' && bf.life !== 0) {
        bf.life -= 1;
      }
      if (bf.life === 0) {
        return engine.del_buff(bf);
      }
    });
    bf.on('delete', function(engine) {
      var setup, _i, _len, _ref, _results;
      _ref = bf.mods;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        setup = _ref[_i];
        _results.push(setup.value.uninstall(bf.id));
      }
      return _results;
    });
    bf.init = function() {
      var init, life, mutuals;
      life = arguments[0], init = arguments[1], mutuals = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      bf.state = init || {};
      bf.mutuals = mutuals;
      bf.mutuals.push(bf.id);
      bf.life = life || 0;
      bf.mods = [];
      bf.initial = true;
      return bf.emit('init');
    };
    bf.update = function() {
      var setup, _i, _len, _ref, _results;
      _ref = bf.mods;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        setup = _ref[_i];
        _results.push(setup.value.update());
      }
      return _results;
    };
    bf.install = function(value, mod) {
      return bf.mods.push({
        value: value,
        mod: mod
      });
    };
    bf.inspect = function() {
      var util;
      util = require('util');
      return ("" + bf.id + ": ") + util.inspect(bf.life, {
        colors: true
      }) + ', ' + util.inspect(bf.state, {
        colors: true
      });
    };
    bf.add_mod = bf.install;
    bf.reset = bf.init;
    bf.init();
    bf._this = this;
    bf._type = Kerigan.Buff;
    return bf;
  };

  Kerigan.Skill = function(id, action) {
    var sk;
    sk = function(engine) {
      return sk.action.call(sk, engine);
    };
    sk.id = id;
    sk.init = function(cost, init) {
      sk.state = init || {};
      return sk.cost = cost;
    };
    sk.action = action;
    sk.reset = sk.init;
    sk.exec = sk;
    sk.init();
    sk._this = this;
    sk._type = Kerigan.Skill;
    return sk;
  };

  Kerigan.Value = function(id, val) {
    var va;
    va = function() {
      return va.cache;
    };
    va.id = id;
    va.events = new (require('events').EventEmitter);
    va.init = function(value) {
      va.base = value;
      va.cache = value;
      return va.modifiers = [];
    };
    va.update = function() {
      return va.cache = _.inject(va.modifiers, (function(akk, mod) {
        return mod.call(va, akk);
      }), va.base);
    };
    va.get_mod = function(id) {
      var result;
      result = _.filter(va.modifiers, function(mod) {
        return mod.id === id;
      });
      return result;
    };
    va.add_mod = function(id, mod, pos) {
      mod.id = id;
      if (pos == null) {
        va.modifiers.push(mod);
        va.cache = mod.call(va, va.cache);
      } else {
        va.modifiers.splice(pos, 0, mod);
        va.update();
      }
      return va.events.emit('install', mod, pos);
    };
    va.del_mod = function(mod) {
      var m, removed, _i, _len;
      if (typeof mod === 'string') {
        removed = _.filter(va.modifiers, function(m) {
          return m.id === mod;
        });
        va.modifiers = _.filter(va.modifiers, function(m) {
          return m.id !== mod;
        });
        for (_i = 0, _len = removed.length; _i < _len; _i++) {
          m = removed[_i];
          va.emit('uninstall', m);
        }
      } else {
        va.modifiers = _.without(va.modifiers, mod);
        va.emit('uninstall', mod);
      }
      return va.update();
    };
    va.count = function() {
      return va.modifiers.length;
    };
    va.inspect = function() {
      var util, value;
      util = require('util');
      value = va();
      if (typeof value === 'number') {
        value = parseFloat(value.toFixed(3));
      }
      return ("" + va.id + ": ") + util.inspect(value, {
        colors: true
      });
    };
    va.length = va.count;
    va.get = va.cache;
    va.reset = va.set = va.init;
    va.install = va.add_mod;
    va.uninstall = va.del_mod;
    va.on = function() {
      var p;
      p = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return va.events.on.apply(va.events, p);
    };
    va.emit = function() {
      var p;
      p = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return va.events.emit.apply(va.events, p);
    };
    va.removeListener = function() {
      var p;
      p = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return va.events.removeListener.apply(va.events, p);
    };
    va.removeAllListeners = function() {
      var p;
      p = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return va.events.removeAllListeners.apply(va.events, p);
    };
    va.once = function() {
      var p;
      p = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return va.events.once.apply(va.events, p);
    };
    va.init(val);
    va._this = this;
    va._type = Kerigan.Value;
    return va;
  };

  Kerigan.successor = function(chance) {
    var rand;
    rand = Math.random();
    if (chance == null) {
      return rand;
    }
    if (chance >= 1.0) {
      return true;
    } else {
      if (chance >= rand) {
        return rand;
      } else {
        return false;
      }
    }
  };


  /*
    The 'validation' event validates the consisiting state and set
    engine['valid'] and engine['finished'] to their appropriate values
   */

}).call(this);

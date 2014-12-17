"use strict";

var _toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var parse = require('./parser').parse;


function map(f, collection) {
  return _toArray(collection).map(function (c) {
    return f(c);
  });
}

Function.prototype.isUserDefined = function () {
  return false;
};

var RadObject = (function () {
  var RadObject = function RadObject(data) {
    this.parent = data.parent;
    this.slots = data.slots || {};
    this.messages = {};
  };

  RadObject.prototype.send = function (message, args, env) {
    var self = this;
    while (self != undefined) {
      if (message in self.messages) {
        var block = self.messages[message];
        if (block.isUserDefined()) {
          var vars = { self: self };
          for (var i = 0; i < args.length; x++) {
            var _ref = [args[i], block.labels[i]];
            var _ref2 = _toArray(_ref);

            var x = _ref2[0];
            var arg = _ref2[1];
            vars[x] = arg;
          }
          var block_env = Env(env, vars);
          return block_env.a(block_env.ast);
        } else {
          return block.apply(null, [this].concat(args).concat(env));
        }
      }
      self = self.parent;
    }
    return 2; //this.send('a:', [message], env);
  };

  return RadObject;
})();

;


var Env = (function () {
  var Env = function Env(parent, vars, interpreter) {
    this.parent = parent;
    this.vars = vars;
    this.root = this.parent ? this.parent.root : this;
    this.interpreter = interpreter || this.parent.interpreter;
  };

  Env.prototype.get = function (z) {
    var a = this;
    while (a) {
      if (z in this.vars) {
        return this.vars[z];
      }
      a = a.parent;
    }
    return this.root.vars.nil;
  };

  Env.prototype.set = function (z, value) {
    this.vars[z] = value;
  };

  Env.prototype.a = function (ast) {
    return this.interpreter.eval(ast, this);
  };

  return Env;
})();

var Interpreter = (function () {
  var Interpreter = function Interpreter() {};

  Interpreter.prototype.eval = function (ast, env) {
    var _this = this;
    switch (ast.type) {
      case "number":
        return ast.value;
      case "string":
        return ast.value;
      case "symbol":
        return new env.root.Object({ parent: env.root.Symbol, slots: { value: ast.value } });
      case "block":
        return env.root.Block();
      case "assignment":
        env.set(ast.left.value, ast.right);
        return ast.right;
      case "message":
        var receiver = this.eval(ast.receiver, env);
        return receiver.send(ast.message, map(function (a) {
          return _this.eval(a, env);
        }, ast.args), env);
      case "label":
        return env.get(ast.label);
      case "radomir":
        var results = map(function (expr) {
          return _this.eval(expr, env);
        }, ast.ast);
        if (results.length == 0) {
          return env.root.nil;
        } else {
          return results[0];
        }
        return ast;
    }
  };

  return Interpreter;
})();

function bless(javascript_type, parent, name) {
  javascript_type.prototype.parent = javascript_type;
  javascript_type.prototype.slots = {};
  javascript_type.prototype.messages = {};
  javascript_type.prototype.send = RadObject.prototype.send;

  javascript_type.parent = parent;
  javascript_type.slots = { name: name };
  javascript_type.messages = {};
  javascript_type.send = RadObject.prototype.send;

  return javascript_type;
}

var CoreEnv = new Env(undefined, {}, new Interpreter());
CoreEnv.vars.Object = new RadObject({ slots: { name: "Object" } });

CoreEnv.vars.Object.messages = {
  "when:do:": function (self, message, block, env) {
    self.messages[message.value] = block;
    return block;
  },

  alloc: function (self, env) {
    return new CoreObject({ parent: self });
  },

  "a:": function (self, message, env) {
    throw "cant understand " + message;
  },

  asString: function (self, env) {
    if ("name" in self.slots) {
      return self.slots.name;
    } else {
      return "an Object";
    }
  }
};


var CoreObject = CoreEnv.vars.Object;

CoreEnv.vars.Integer = bless(Number, CoreObject, "Integer");
CoreEnv.vars.String = bless(String, CoreObject, "String");
CoreEnv.vars.Collection = new RadObject({ parent: CoreObject, slots: { name: "Collection" } });
CoreEnv.vars.Array = bless(Array, CoreEnv.Collection, "Array");
CoreEnv.vars.nil = new RadObject({ parent: CoreObject });
CoreEnv.vars.Boolean = bless(Boolean, CoreObject, "Boolean");
CoreEnv.vars.true = new RadObject({ parent: Boolean });
CoreEnv.vars.false = new RadObject({ parent: Boolean });
CoreEnv.vars.Block = new RadObject({ parent: CoreObject, slots: { name: "Block" } });

CoreEnv.vars.Block.isUserDefined = function () {
  return true;
};

CoreEnv.vars.Integer.messages = {
  "+": function (self, other) {
    return self + other;
  },
  "-": function (self, other) {
    return self - other;
  },
  "*": function (self, other) {
    return self * other;
  },
  asString: function (self) {
    return String(self);
  }
};

CoreEnv.vars.Array.messages = {
  "at:": function (self, index) {
    return self[index];
  },
  "at:put:": function (self, index, value) {
    self[index] = value;return value;
  },
  asString: function (self) {
    return "#(" + self.join(" ") + ")";
  }
};

CoreEnv.vars.String.messages = {
  asString: function (self) {
    return "'" + self + "'";
  }
};



var source = "2\ns = Array new\n";
console.log(CoreEnv.a(parse(source)).send("asString", [], CoreEnv));


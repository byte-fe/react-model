"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
/// <reference path="./index.d.ts" />
var React = require("react");
var react_1 = require("react");
var helper_1 = require("./helper");
exports.Consumer = helper_1.Consumer;
var GlobalState = {};
// Communicate between Provider-Consumer and Hooks
// Use to provide backwards-compatible.
var Setter = {
    classSetter: undefined,
    functionSetter: {}
};
var uid = Math.random(); // The unique id of hooks
var registerModel = function (models) {
    GlobalState = __assign({}, models);
};
exports.registerModel = registerModel;
var Provider = /** @class */ (function (_super) {
    __extends(Provider, _super);
    function Provider() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = GlobalState;
        return _this;
    }
    Provider.prototype.render = function () {
        var children = this.props.children;
        Setter.classSetter = this.setState.bind(this);
        return (React.createElement(helper_1.GlobalContext.Provider, { value: __assign({}, GlobalState, { setState: this.setState.bind(this) }) }, children));
    };
    return Provider;
}(react_1.PureComponent));
exports.Provider = Provider;
var setPartialState = function (name, partialState) {
    var _a;
    GlobalState = __assign({}, GlobalState, (_a = {}, _a[name] = {
        actions: GlobalState[name].actions,
        state: __assign({}, GlobalState[name].state, partialState)
    }, _a));
    return GlobalState;
};
var getState = function (modelName) {
    return GlobalState[modelName].state;
};
exports.getState = getState;
var useStore = function (modelName) {
    // const _state = useContext(GlobalContext)
    var _a = react_1.useState(GlobalState[modelName].state), state = _a[0], setState = _a[1];
    uid += 1;
    var _hash = '' + uid;
    if (!Setter.functionSetter[modelName])
        Setter.functionSetter[modelName] = [];
    Setter.functionSetter[modelName][_hash] = { setState: setState };
    react_1.useEffect(function () {
        return function cleanup() {
            delete Setter.functionSetter[modelName][_hash];
        };
    });
    var updaters = {};
    var consumerAction = function (action) { return function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            var newState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, action.apply(void 0, [GlobalState[modelName].state,
                            consumerActions(GlobalState[modelName].actions)].concat(params))];
                    case 1:
                        newState = _a.sent();
                        if (newState) {
                            setPartialState(modelName, newState);
                            setState(GlobalState[modelName].state);
                            Setter.classSetter(GlobalState);
                            Object.keys(Setter.functionSetter[modelName]).map(function (key) {
                                return Setter.functionSetter[modelName][key].setState(GlobalState[modelName].state);
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    }; };
    var consumerActions = function (actions) {
        var ret = {};
        Object.keys(actions).map(function (key) {
            ret[key] = consumerAction(actions[key]);
        });
        return ret;
    };
    Object.keys(GlobalState[modelName].actions).map(function (key) {
        return (updaters[key] = react_1.useCallback(function (params) { return __awaiter(_this, void 0, void 0, function () {
            var newState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, GlobalState[modelName].actions[key](GlobalState[modelName].state, consumerActions(GlobalState[modelName].actions), params)];
                    case 1:
                        newState = _a.sent();
                        if (newState) {
                            setPartialState(modelName, newState);
                            setState(GlobalState[modelName].state);
                            Setter.classSetter(GlobalState);
                            Object.keys(Setter.functionSetter[modelName]).map(function (key) {
                                return Setter.functionSetter[modelName][key].setState(GlobalState[modelName].state);
                            });
                        }
                        return [2 /*return*/];
                }
            });
        }); }, []
        // [GlobalState[modelName]]
        ));
    });
    return [state, updaters];
};
exports.useStore = useStore;
var connect = function (modelName, mapProps) { return function (Component) {
    return /** @class */ (function (_super) {
        __extends(P, _super);
        function P() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        P.prototype.render = function () {
            var _this = this;
            return (React.createElement(helper_1.Consumer, null, function (models) {
                var _a = models, _b = "" + modelName, _c = _a[_b], state = _c.state, actions = _c.actions, setState = _a.setState;
                var consumerAction = function (action) { return function () {
                    var params = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        params[_i] = arguments[_i];
                    }
                    return __awaiter(_this, void 0, void 0, function () {
                        var newState;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, action.apply(void 0, [GlobalState[modelName].state,
                                        consumerActions(actions)].concat(params))];
                                case 1:
                                    newState = _a.sent();
                                    if (newState) {
                                        setPartialState(modelName, newState);
                                        setState(GlobalState);
                                        Object.keys(Setter.functionSetter[modelName]).map(function (key) {
                                            return Setter.functionSetter[modelName][key].setState(GlobalState[modelName].state);
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    });
                }; };
                var consumerActions = function (actions) {
                    var ret = {};
                    Object.keys(actions).map(function (key) {
                        ret[key] = consumerAction(actions[key]);
                    });
                    return ret;
                };
                return (React.createElement(Component, { state: mapProps ? mapProps(state) : state, actions: consumerActions(actions) }));
            }));
        };
        return P;
    }(react_1.PureComponent));
}; };
exports.connect = connect;

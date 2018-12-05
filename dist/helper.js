"use strict";
exports.__esModule = true;
var react_1 = require("react");
var initialProviderState = {};
var GlobalContext = react_1.createContext(initialProviderState);
exports.GlobalContext = GlobalContext;
var Consumer = GlobalContext.Consumer;
exports.Consumer = Consumer;

import { i as __toESM, n as __commonJSMin, t as require_react } from "./react-B35R_oEX.js";
//#region node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
	let state;
	const listeners = /* @__PURE__ */ new Set();
	const setState = (partial, replace) => {
		const nextState = typeof partial === "function" ? partial(state) : partial;
		if (!Object.is(nextState, state)) {
			const previousState = state;
			state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
			listeners.forEach((listener) => listener(state, previousState));
		}
	};
	const getState = () => state;
	const getInitialState = () => initialState;
	const subscribe = (listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};
	const destroy = () => {
		if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.");
		listeners.clear();
	};
	const api = {
		setState,
		getState,
		getInitialState,
		subscribe,
		destroy
	};
	const initialState = state = createState(setState, getState, api);
	return api;
};
var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
//#endregion
//#region node_modules/zustand/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
/**
* @license React
* use-sync-external-store-shim.development.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_use_sync_external_store_shim_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function() {
		"use strict";
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(/* @__PURE__ */ new Error());
		var React = require_react();
		var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
		function error(format) {
			for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
			printWarning("error", format, args);
		}
		function printWarning(level, format, args) {
			var stack = ReactSharedInternals.ReactDebugCurrentFrame.getStackAddendum();
			if (stack !== "") {
				format += "%s";
				args = args.concat([stack]);
			}
			var argsWithFormat = args.map(function(item) {
				return String(item);
			});
			argsWithFormat.unshift("Warning: " + format);
			Function.prototype.apply.call(console[level], console, argsWithFormat);
		}
		/**
		* inlined Object.is polyfill to avoid requiring consumers ship their own
		* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
		*/
		function is(x, y) {
			return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
		}
		var objectIs = typeof Object.is === "function" ? Object.is : is;
		var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue = React.useDebugValue;
		var didWarnOld18Alpha = false;
		var didWarnUncachedGetSnapshot = false;
		function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
			if (!didWarnOld18Alpha) {
				if (React.startTransition !== void 0) {
					didWarnOld18Alpha = true;
					error("You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release.");
				}
			}
			var value = getSnapshot();
			if (!didWarnUncachedGetSnapshot) {
				if (!objectIs(value, getSnapshot())) {
					error("The result of getSnapshot should be cached to avoid an infinite loop");
					didWarnUncachedGetSnapshot = true;
				}
			}
			var _useState = useState({ inst: {
				value,
				getSnapshot
			} }), inst = _useState[0].inst, forceUpdate = _useState[1];
			useLayoutEffect(function() {
				inst.value = value;
				inst.getSnapshot = getSnapshot;
				if (checkIfSnapshotChanged(inst)) forceUpdate({ inst });
			}, [
				subscribe,
				value,
				getSnapshot
			]);
			useEffect(function() {
				if (checkIfSnapshotChanged(inst)) forceUpdate({ inst });
				var handleStoreChange = function() {
					if (checkIfSnapshotChanged(inst)) forceUpdate({ inst });
				};
				return subscribe(handleStoreChange);
			}, [subscribe]);
			useDebugValue(value);
			return value;
		}
		function checkIfSnapshotChanged(inst) {
			var latestGetSnapshot = inst.getSnapshot;
			var prevValue = inst.value;
			try {
				return !objectIs(prevValue, latestGetSnapshot());
			} catch (error) {
				return true;
			}
		}
		function useSyncExternalStore$1(subscribe, getSnapshot, getServerSnapshot) {
			return getSnapshot();
		}
		var shim = !!!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined") ? useSyncExternalStore$1 : useSyncExternalStore;
		exports.useSyncExternalStore = React.useSyncExternalStore !== void 0 ? React.useSyncExternalStore : shim;
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(/* @__PURE__ */ new Error());
	})();
}));
//#endregion
//#region node_modules/zustand/node_modules/use-sync-external-store/shim/index.js
var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_use_sync_external_store_shim_development();
}));
//#endregion
//#region node_modules/zustand/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
/**
* @license React
* use-sync-external-store-shim/with-selector.development.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_with_selector_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function() {
		"use strict";
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(/* @__PURE__ */ new Error());
		var React = require_react();
		var shim = require_shim();
		/**
		* inlined Object.is polyfill to avoid requiring consumers ship their own
		* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
		*/
		function is(x, y) {
			return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
		}
		var objectIs = typeof Object.is === "function" ? Object.is : is;
		var useSyncExternalStore = shim.useSyncExternalStore;
		var useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue = React.useDebugValue;
		function useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
			var instRef = useRef(null);
			var inst;
			if (instRef.current === null) {
				inst = {
					hasValue: false,
					value: null
				};
				instRef.current = inst;
			} else inst = instRef.current;
			var _useMemo = useMemo(function() {
				var hasMemo = false;
				var memoizedSnapshot;
				var memoizedSelection;
				var memoizedSelector = function(nextSnapshot) {
					if (!hasMemo) {
						hasMemo = true;
						memoizedSnapshot = nextSnapshot;
						var _nextSelection = selector(nextSnapshot);
						if (isEqual !== void 0) {
							if (inst.hasValue) {
								var currentSelection = inst.value;
								if (isEqual(currentSelection, _nextSelection)) {
									memoizedSelection = currentSelection;
									return currentSelection;
								}
							}
						}
						memoizedSelection = _nextSelection;
						return _nextSelection;
					}
					var prevSnapshot = memoizedSnapshot;
					var prevSelection = memoizedSelection;
					if (objectIs(prevSnapshot, nextSnapshot)) return prevSelection;
					var nextSelection = selector(nextSnapshot);
					if (isEqual !== void 0 && isEqual(prevSelection, nextSelection)) return prevSelection;
					memoizedSnapshot = nextSnapshot;
					memoizedSelection = nextSelection;
					return nextSelection;
				};
				var maybeGetServerSnapshot = getServerSnapshot === void 0 ? null : getServerSnapshot;
				var getSnapshotWithSelector = function() {
					return memoizedSelector(getSnapshot());
				};
				return [getSnapshotWithSelector, maybeGetServerSnapshot === null ? void 0 : function() {
					return memoizedSelector(maybeGetServerSnapshot());
				}];
			}, [
				getSnapshot,
				getServerSnapshot,
				selector,
				isEqual
			]), getSelection = _useMemo[0], getServerSelection = _useMemo[1];
			var value = useSyncExternalStore(subscribe, getSelection, getServerSelection);
			useEffect(function() {
				inst.hasValue = true;
				inst.value = value;
			}, [value]);
			useDebugValue(value);
			return value;
		}
		exports.useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector;
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(/* @__PURE__ */ new Error());
	})();
}));
//#endregion
//#region node_modules/zustand/node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_with_selector_development();
}));
//#endregion
//#region node_modules/zustand/esm/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_with_selector = /* @__PURE__ */ __toESM(require_with_selector(), 1);
var { useDebugValue } = import_react.default;
var { useSyncExternalStoreWithSelector } = import_with_selector.default;
var didWarnAboutEqualityFn = false;
var identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
	if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
		console.warn("[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937");
		didWarnAboutEqualityFn = true;
	}
	const slice = useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getInitialState, selector, equalityFn);
	useDebugValue(slice);
	return slice;
}
var createImpl = (createState) => {
	if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && typeof createState !== "function") console.warn("[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.");
	const api = typeof createState === "function" ? createStore(createState) : createState;
	const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
	Object.assign(useBoundStore, api);
	return useBoundStore;
};
var create = (createState) => createState ? createImpl(createState) : createImpl;
var react = (createState) => {
	if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") console.warn("[DEPRECATED] Default export is deprecated. Instead use `import { create } from 'zustand'`.");
	return create(createState);
};
//#endregion
export { create, createStore, react as default, useStore };

//# sourceMappingURL=zustand.js.map
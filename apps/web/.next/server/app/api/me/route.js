"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/me/route";
exports.ids = ["app/api/me/route"];
exports.modules = {

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "pg":
/*!*********************!*\
  !*** external "pg" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("pg");

/***/ }),

/***/ "(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fme%2Froute&page=%2Fapi%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fme%2Froute.ts&appDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fme%2Froute&page=%2Fapi%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fme%2Froute.ts&appDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_seema_Documents_New_project_apps_web_app_api_me_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/me/route.ts */ \"(rsc)/./app/api/me/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/me/route\",\n        pathname: \"/api/me\",\n        filename: \"route\",\n        bundlePath: \"app/api/me/route\"\n    },\n    resolvedPagePath: \"/Users/seema/Documents/New project/apps/web/app/api/me/route.ts\",\n    nextConfigOutput,\n    userland: _Users_seema_Documents_New_project_apps_web_app_api_me_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/me/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL25leHRAMTQuMi41X3JlYWN0LWRvbUAxOC4zLjFfcmVhY3RAMTguMy4xX19yZWFjdEAxOC4zLjEvbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1hcHAtbG9hZGVyLmpzP25hbWU9YXBwJTJGYXBpJTJGbWUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRm1lJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGbWUlMkZyb3V0ZS50cyZhcHBEaXI9JTJGVXNlcnMlMkZzZWVtYSUyRkRvY3VtZW50cyUyRk5ldyUyMHByb2plY3QlMkZhcHBzJTJGd2ViJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnNlZW1hJTJGRG9jdW1lbnRzJTJGTmV3JTIwcHJvamVjdCUyRmFwcHMlMkZ3ZWImaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ2U7QUFDNUY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AYXBwL3dlYi8/ODY5ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvc2VlbWEvRG9jdW1lbnRzL05ldyBwcm9qZWN0L2FwcHMvd2ViL2FwcC9hcGkvbWUvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL21lL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvbWVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL21lL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL3NlZW1hL0RvY3VtZW50cy9OZXcgcHJvamVjdC9hcHBzL3dlYi9hcHAvYXBpL21lL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9tZS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fme%2Froute&page=%2Fapi%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fme%2Froute.ts&appDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/me/route.ts":
/*!*****************************!*\
  !*** ./app/api/me/route.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../lib/auth */ \"(rsc)/./lib/auth.ts\");\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../lib/db */ \"(rsc)/./lib/db.ts\");\n\n\n\nasync function GET() {\n    const session = await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.getSession)();\n    if (!session) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            authenticated: false\n        });\n    }\n    const pool = (0,_lib_db__WEBPACK_IMPORTED_MODULE_2__.getPool)();\n    const result = await pool.query(`\n    SELECT github_user_id, login\n    FROM github_oauth_tokens\n    WHERE github_user_id = $1\n    `, [\n        session.githubUserId\n    ]);\n    const row = result.rows[0];\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        authenticated: true,\n        githubUserId: session.githubUserId,\n        login: row?.login ?? null\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL21lL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBMkM7QUFDSTtBQUNMO0FBRW5DLGVBQWVHO0lBQ3BCLE1BQU1DLFVBQVUsTUFBTUgscURBQVVBO0lBQ2hDLElBQUksQ0FBQ0csU0FBUztRQUNaLE9BQU9KLHFEQUFZQSxDQUFDSyxJQUFJLENBQUM7WUFBRUMsZUFBZTtRQUFNO0lBQ2xEO0lBRUEsTUFBTUMsT0FBT0wsZ0RBQU9BO0lBQ3BCLE1BQU1NLFNBQVMsTUFBTUQsS0FBS0UsS0FBSyxDQUM3QixDQUFDOzs7O0lBSUQsQ0FBQyxFQUNEO1FBQUNMLFFBQVFNLFlBQVk7S0FBQztJQUd4QixNQUFNQyxNQUFNSCxPQUFPSSxJQUFJLENBQUMsRUFBRTtJQUMxQixPQUFPWixxREFBWUEsQ0FBQ0ssSUFBSSxDQUFDO1FBQ3ZCQyxlQUFlO1FBQ2ZJLGNBQWNOLFFBQVFNLFlBQVk7UUFDbENHLE9BQU9GLEtBQUtFLFNBQVM7SUFDdkI7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL0BhcHAvd2ViLy4vYXBwL2FwaS9tZS9yb3V0ZS50cz81ZmNjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0U2Vzc2lvbiB9IGZyb20gXCIuLi8uLi8uLi9saWIvYXV0aFwiO1xuaW1wb3J0IHsgZ2V0UG9vbCB9IGZyb20gXCIuLi8uLi8uLi9saWIvZGJcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVCgpOiBQcm9taXNlPE5leHRSZXNwb25zZT4ge1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2Vzc2lvbigpO1xuICBpZiAoIXNlc3Npb24pIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBhdXRoZW50aWNhdGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIGNvbnN0IHBvb2wgPSBnZXRQb29sKCk7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvb2wucXVlcnkoXG4gICAgYFxuICAgIFNFTEVDVCBnaXRodWJfdXNlcl9pZCwgbG9naW5cbiAgICBGUk9NIGdpdGh1Yl9vYXV0aF90b2tlbnNcbiAgICBXSEVSRSBnaXRodWJfdXNlcl9pZCA9ICQxXG4gICAgYCxcbiAgICBbc2Vzc2lvbi5naXRodWJVc2VySWRdLFxuICApO1xuXG4gIGNvbnN0IHJvdyA9IHJlc3VsdC5yb3dzWzBdO1xuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgIGF1dGhlbnRpY2F0ZWQ6IHRydWUsXG4gICAgZ2l0aHViVXNlcklkOiBzZXNzaW9uLmdpdGh1YlVzZXJJZCxcbiAgICBsb2dpbjogcm93Py5sb2dpbiA/PyBudWxsLFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJnZXRTZXNzaW9uIiwiZ2V0UG9vbCIsIkdFVCIsInNlc3Npb24iLCJqc29uIiwiYXV0aGVudGljYXRlZCIsInBvb2wiLCJyZXN1bHQiLCJxdWVyeSIsImdpdGh1YlVzZXJJZCIsInJvdyIsInJvd3MiLCJsb2dpbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/me/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth.ts":
/*!*********************!*\
  !*** ./lib/auth.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getSession: () => (/* binding */ getSession),\n/* harmony export */   setSessionCookie: () => (/* binding */ setSessionCookie)\n/* harmony export */ });\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/headers */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/headers.js\");\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./db */ \"(rsc)/./lib/db.ts\");\n\n\nconst SESSION_COOKIE = \"gh_session\";\nasync function getSession() {\n    const cookieStore = (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;\n    if (!sessionId) {\n        return null;\n    }\n    const pool = (0,_db__WEBPACK_IMPORTED_MODULE_1__.getPool)();\n    const result = await pool.query(`\n    SELECT session_id, github_user_id\n    FROM github_sessions\n    WHERE session_id = $1 AND expires_at > NOW()\n    `, [\n        sessionId\n    ]);\n    const row = result.rows[0];\n    if (!row) {\n        return null;\n    }\n    return {\n        sessionId: row.session_id,\n        githubUserId: Number(row.github_user_id)\n    };\n}\nfunction setSessionCookie(sessionId) {\n    const cookieStore = (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n    cookieStore.set(SESSION_COOKIE, sessionId, {\n        httpOnly: true,\n        sameSite: \"lax\",\n        secure: \"development\" === \"production\",\n        path: \"/\",\n        maxAge: 60 * 60 * 24 * 7\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQXVDO0FBQ1I7QUFFL0IsTUFBTUUsaUJBQWlCO0FBT2hCLGVBQWVDO0lBQ3BCLE1BQU1DLGNBQWNKLHFEQUFPQTtJQUMzQixNQUFNSyxZQUFZRCxZQUFZRSxHQUFHLENBQUNKLGlCQUFpQks7SUFDbkQsSUFBSSxDQUFDRixXQUFXO1FBQ2QsT0FBTztJQUNUO0lBRUEsTUFBTUcsT0FBT1AsNENBQU9BO0lBQ3BCLE1BQU1RLFNBQVMsTUFBTUQsS0FBS0UsS0FBSyxDQUM3QixDQUFDOzs7O0lBSUQsQ0FBQyxFQUNEO1FBQUNMO0tBQVU7SUFHYixNQUFNTSxNQUFNRixPQUFPRyxJQUFJLENBQUMsRUFBRTtJQUMxQixJQUFJLENBQUNELEtBQUs7UUFDUixPQUFPO0lBQ1Q7SUFFQSxPQUFPO1FBQ0xOLFdBQVdNLElBQUlFLFVBQVU7UUFDekJDLGNBQWNDLE9BQU9KLElBQUlLLGNBQWM7SUFDekM7QUFDRjtBQUVPLFNBQVNDLGlCQUFpQlosU0FBaUI7SUFDaEQsTUFBTUQsY0FBY0oscURBQU9BO0lBQzNCSSxZQUFZYyxHQUFHLENBQUNoQixnQkFBZ0JHLFdBQVc7UUFDekNjLFVBQVU7UUFDVkMsVUFBVTtRQUNWQyxRQUFRQyxrQkFBeUI7UUFDakNDLE1BQU07UUFDTkMsUUFBUSxLQUFLLEtBQUssS0FBSztJQUN6QjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGFwcC93ZWIvLi9saWIvYXV0aC50cz9iZjdlIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvb2tpZXMgfSBmcm9tIFwibmV4dC9oZWFkZXJzXCI7XG5pbXBvcnQgeyBnZXRQb29sIH0gZnJvbSBcIi4vZGJcIjtcblxuY29uc3QgU0VTU0lPTl9DT09LSUUgPSBcImdoX3Nlc3Npb25cIjtcblxuZXhwb3J0IHR5cGUgU2Vzc2lvbiA9IHtcbiAgc2Vzc2lvbklkOiBzdHJpbmc7XG4gIGdpdGh1YlVzZXJJZDogbnVtYmVyO1xufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlc3Npb24oKTogUHJvbWlzZTxTZXNzaW9uIHwgbnVsbD4ge1xuICBjb25zdCBjb29raWVTdG9yZSA9IGNvb2tpZXMoKTtcbiAgY29uc3Qgc2Vzc2lvbklkID0gY29va2llU3RvcmUuZ2V0KFNFU1NJT05fQ09PS0lFKT8udmFsdWU7XG4gIGlmICghc2Vzc2lvbklkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBwb29sID0gZ2V0UG9vbCgpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb29sLnF1ZXJ5KFxuICAgIGBcbiAgICBTRUxFQ1Qgc2Vzc2lvbl9pZCwgZ2l0aHViX3VzZXJfaWRcbiAgICBGUk9NIGdpdGh1Yl9zZXNzaW9uc1xuICAgIFdIRVJFIHNlc3Npb25faWQgPSAkMSBBTkQgZXhwaXJlc19hdCA+IE5PVygpXG4gICAgYCxcbiAgICBbc2Vzc2lvbklkXSxcbiAgKTtcblxuICBjb25zdCByb3cgPSByZXN1bHQucm93c1swXTtcbiAgaWYgKCFyb3cpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2Vzc2lvbklkOiByb3cuc2Vzc2lvbl9pZCBhcyBzdHJpbmcsXG4gICAgZ2l0aHViVXNlcklkOiBOdW1iZXIocm93LmdpdGh1Yl91c2VyX2lkKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlc3Npb25Db29raWUoc2Vzc2lvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgY29va2llU3RvcmUgPSBjb29raWVzKCk7XG4gIGNvb2tpZVN0b3JlLnNldChTRVNTSU9OX0NPT0tJRSwgc2Vzc2lvbklkLCB7XG4gICAgaHR0cE9ubHk6IHRydWUsXG4gICAgc2FtZVNpdGU6IFwibGF4XCIsXG4gICAgc2VjdXJlOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCIsXG4gICAgcGF0aDogXCIvXCIsXG4gICAgbWF4QWdlOiA2MCAqIDYwICogMjQgKiA3LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6WyJjb29raWVzIiwiZ2V0UG9vbCIsIlNFU1NJT05fQ09PS0lFIiwiZ2V0U2Vzc2lvbiIsImNvb2tpZVN0b3JlIiwic2Vzc2lvbklkIiwiZ2V0IiwidmFsdWUiLCJwb29sIiwicmVzdWx0IiwicXVlcnkiLCJyb3ciLCJyb3dzIiwic2Vzc2lvbl9pZCIsImdpdGh1YlVzZXJJZCIsIk51bWJlciIsImdpdGh1Yl91c2VyX2lkIiwic2V0U2Vzc2lvbkNvb2tpZSIsInNldCIsImh0dHBPbmx5Iiwic2FtZVNpdGUiLCJzZWN1cmUiLCJwcm9jZXNzIiwicGF0aCIsIm1heEFnZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./lib/db.ts":
/*!*******************!*\
  !*** ./lib/db.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getPool: () => (/* binding */ getPool)\n/* harmony export */ });\n/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pg */ \"pg\");\n/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pg__WEBPACK_IMPORTED_MODULE_0__);\n\nlet pool = null;\nfunction getPool() {\n    if (pool) {\n        return pool;\n    }\n    const connectionString = process.env.DATABASE_URL;\n    if (!connectionString) {\n        throw new Error(\"DATABASE_URL is required\");\n    }\n    pool = new pg__WEBPACK_IMPORTED_MODULE_0__.Pool({\n        connectionString\n    });\n    return pool;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZGIudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTBCO0FBRTFCLElBQUlDLE9BQW9CO0FBRWpCLFNBQVNDO0lBQ2QsSUFBSUQsTUFBTTtRQUNSLE9BQU9BO0lBQ1Q7SUFFQSxNQUFNRSxtQkFBbUJDLFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWTtJQUNqRCxJQUFJLENBQUNILGtCQUFrQjtRQUNyQixNQUFNLElBQUlJLE1BQU07SUFDbEI7SUFFQU4sT0FBTyxJQUFJRCxvQ0FBSUEsQ0FBQztRQUFFRztJQUFpQjtJQUNuQyxPQUFPRjtBQUNUIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGFwcC93ZWIvLi9saWIvZGIudHM/MWRmMCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb29sIH0gZnJvbSBcInBnXCI7XG5cbmxldCBwb29sOiBQb29sIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb29sKCk6IFBvb2wge1xuICBpZiAocG9vbCkge1xuICAgIHJldHVybiBwb29sO1xuICB9XG5cbiAgY29uc3QgY29ubmVjdGlvblN0cmluZyA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTDtcbiAgaWYgKCFjb25uZWN0aW9uU3RyaW5nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiREFUQUJBU0VfVVJMIGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgcG9vbCA9IG5ldyBQb29sKHsgY29ubmVjdGlvblN0cmluZyB9KTtcbiAgcmV0dXJuIHBvb2w7XG59XG4iXSwibmFtZXMiOlsiUG9vbCIsInBvb2wiLCJnZXRQb29sIiwiY29ubmVjdGlvblN0cmluZyIsInByb2Nlc3MiLCJlbnYiLCJEQVRBQkFTRV9VUkwiLCJFcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/db.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1"], () => (__webpack_exec__("(rsc)/../../node_modules/.pnpm/next@14.2.5_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fme%2Froute&page=%2Fapi%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fme%2Froute.ts&appDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fseema%2FDocuments%2FNew%20project%2Fapps%2Fweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
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
exports.id = "app/api/spots/[spotId]/socio-number/route";
exports.ids = ["app/api/spots/[spotId]/socio-number/route"];
exports.modules = {

/***/ "(rsc)/./app/api/spots/[spotId]/socio-number/route.ts":
/*!******************************************************!*\
  !*** ./app/api/spots/[spotId]/socio-number/route.ts ***!
  \******************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/firebase/admin */ \"(rsc)/./lib/firebase/admin.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__]);\n_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\nasync function GET(req, { params }) {\n    const { spotId } = await params;\n    const authHeader = req.headers.get(\"authorization\") ?? \"\";\n    const idToken = authHeader.replace(\"Bearer \", \"\");\n    if (!idToken) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: \"unauthorized\"\n    }, {\n        status: 401\n    });\n    let uid;\n    try {\n        const decoded = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminAuth)().verifyIdToken(idToken);\n        uid = decoded.uid;\n    } catch  {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const db = (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminDb)();\n    const snapshot = await db.collection(`spots/${spotId}/members`).orderBy(\"joinedAt\", \"asc\").get();\n    const index = snapshot.docs.findIndex((d)=>d.id === uid);\n    const number = index === -1 ? null : index + 1;\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        number\n    });\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3Nwb3RzL1tzcG90SWRdL3NvY2lvLW51bWJlci9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBd0Q7QUFDUTtBQUV6RCxlQUFlRyxJQUFJQyxHQUFnQixFQUFFLEVBQUVDLE1BQU0sRUFBMkM7SUFDN0YsTUFBTSxFQUFFQyxNQUFNLEVBQUUsR0FBRyxNQUFNRDtJQUV6QixNQUFNRSxhQUFhSCxJQUFJSSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxvQkFBb0I7SUFDdkQsTUFBTUMsVUFBVUgsV0FBV0ksT0FBTyxDQUFDLFdBQVc7SUFDOUMsSUFBSSxDQUFDRCxTQUFTLE9BQU9WLHFEQUFZQSxDQUFDWSxJQUFJLENBQUM7UUFBRUMsT0FBTztJQUFlLEdBQUc7UUFBRUMsUUFBUTtJQUFJO0lBRWhGLElBQUlDO0lBQ0osSUFBSTtRQUNGLE1BQU1DLFVBQVUsTUFBTWYsaUVBQVlBLEdBQUdnQixhQUFhLENBQUNQO1FBQ25ESyxNQUFNQyxRQUFRRCxHQUFHO0lBQ25CLEVBQUUsT0FBTTtRQUNOLE9BQU9mLHFEQUFZQSxDQUFDWSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFlLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3BFO0lBRUEsTUFBTUksS0FBS2hCLCtEQUFVQTtJQUNyQixNQUFNaUIsV0FBVyxNQUFNRCxHQUNwQkUsVUFBVSxDQUFDLENBQUMsTUFBTSxFQUFFZCxPQUFPLFFBQVEsQ0FBQyxFQUNwQ2UsT0FBTyxDQUFDLFlBQVksT0FDcEJaLEdBQUc7SUFFTixNQUFNYSxRQUFRSCxTQUFTSSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxDQUFDQyxJQUFNQSxFQUFFQyxFQUFFLEtBQUtYO0lBQ3RELE1BQU1ZLFNBQVNMLFVBQVUsQ0FBQyxJQUFJLE9BQU9BLFFBQVE7SUFFN0MsT0FBT3RCLHFEQUFZQSxDQUFDWSxJQUFJLENBQUM7UUFBRWU7SUFBTztBQUNwQyIsInNvdXJjZXMiOlsiL1VzZXJzL2F0YXJhc2hpL3Nwb3QtY2xvdWQvYXBwL2FwaS9zcG90cy9bc3BvdElkXS9zb2Npby1udW1iZXIvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0QWRtaW5BdXRoLCBnZXRBZG1pbkRiIH0gZnJvbSBcIkAvbGliL2ZpcmViYXNlL2FkbWluXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOiBOZXh0UmVxdWVzdCwgeyBwYXJhbXMgfTogeyBwYXJhbXM6IFByb21pc2U8eyBzcG90SWQ6IHN0cmluZyB9PiB9KSB7XG4gIGNvbnN0IHsgc3BvdElkIH0gPSBhd2FpdCBwYXJhbXM7XG5cbiAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmdldChcImF1dGhvcml6YXRpb25cIikgPz8gXCJcIjtcbiAgY29uc3QgaWRUb2tlbiA9IGF1dGhIZWFkZXIucmVwbGFjZShcIkJlYXJlciBcIiwgXCJcIik7XG4gIGlmICghaWRUb2tlbikgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwidW5hdXRob3JpemVkXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcblxuICBsZXQgdWlkOiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgY29uc3QgZGVjb2RlZCA9IGF3YWl0IGdldEFkbWluQXV0aCgpLnZlcmlmeUlkVG9rZW4oaWRUb2tlbik7XG4gICAgdWlkID0gZGVjb2RlZC51aWQ7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcInVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gIH1cblxuICBjb25zdCBkYiA9IGdldEFkbWluRGIoKTtcbiAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCBkYlxuICAgIC5jb2xsZWN0aW9uKGBzcG90cy8ke3Nwb3RJZH0vbWVtYmVyc2ApXG4gICAgLm9yZGVyQnkoXCJqb2luZWRBdFwiLCBcImFzY1wiKVxuICAgIC5nZXQoKTtcblxuICBjb25zdCBpbmRleCA9IHNuYXBzaG90LmRvY3MuZmluZEluZGV4KChkKSA9PiBkLmlkID09PSB1aWQpO1xuICBjb25zdCBudW1iZXIgPSBpbmRleCA9PT0gLTEgPyBudWxsIDogaW5kZXggKyAxO1xuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG51bWJlciB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJnZXRBZG1pbkF1dGgiLCJnZXRBZG1pbkRiIiwiR0VUIiwicmVxIiwicGFyYW1zIiwic3BvdElkIiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJnZXQiLCJpZFRva2VuIiwicmVwbGFjZSIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInVpZCIsImRlY29kZWQiLCJ2ZXJpZnlJZFRva2VuIiwiZGIiLCJzbmFwc2hvdCIsImNvbGxlY3Rpb24iLCJvcmRlckJ5IiwiaW5kZXgiLCJkb2NzIiwiZmluZEluZGV4IiwiZCIsImlkIiwibnVtYmVyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/spots/[spotId]/socio-number/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/firebase/admin.ts":
/*!*******************************!*\
  !*** ./lib/firebase/admin.ts ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getAdminAuth: () => (/* binding */ getAdminAuth),\n/* harmony export */   getAdminDb: () => (/* binding */ getAdminDb),\n/* harmony export */   getFirebaseAdminApp: () => (/* binding */ getFirebaseAdminApp)\n/* harmony export */ });\n/* harmony import */ var firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase-admin/app */ \"firebase-admin/app\");\n/* harmony import */ var firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase-admin/auth */ \"firebase-admin/auth\");\n/* harmony import */ var firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase-admin/firestore */ \"firebase-admin/firestore\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__, firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__]);\n([firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__, firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\nfunction getAdminConfig() {\n    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;\n    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;\n    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g, \"\\n\");\n    if (!projectId || !clientEmail || !privateKey) {\n        return null;\n    }\n    return {\n        credential: (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.cert)({\n            projectId,\n            clientEmail,\n            privateKey\n        })\n    };\n}\nfunction getFirebaseAdminApp() {\n    const existing = (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.getApps)()[0];\n    if (existing) {\n        return existing;\n    }\n    const config = getAdminConfig();\n    if (!config) {\n        throw new Error(\"Firebase Admin environment variables are not configured.\");\n    }\n    return (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(config);\n}\nfunction getAdminAuth() {\n    return (0,firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(getFirebaseAdminApp());\n}\nfunction getAdminDb() {\n    return (0,firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(getFirebaseAdminApp());\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZmlyZWJhc2UvYWRtaW4udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQWtFO0FBQ3BCO0FBQ1U7QUFFeEQsU0FBU0s7SUFDUCxNQUFNQyxZQUFZQyxRQUFRQyxHQUFHLENBQUNDLHlCQUF5QjtJQUN2RCxNQUFNQyxjQUFjSCxRQUFRQyxHQUFHLENBQUNHLDJCQUEyQjtJQUMzRCxNQUFNQyxhQUFhTCxRQUFRQyxHQUFHLENBQUNLLDBCQUEwQixFQUFFQyxRQUFRLFFBQVE7SUFFM0UsSUFBSSxDQUFDUixhQUFhLENBQUNJLGVBQWUsQ0FBQ0UsWUFBWTtRQUM3QyxPQUFPO0lBQ1Q7SUFFQSxPQUFPO1FBQ0xHLFlBQVlmLHdEQUFJQSxDQUFDO1lBQ2ZNO1lBQ0FJO1lBQ0FFO1FBQ0Y7SUFDRjtBQUNGO0FBRU8sU0FBU0k7SUFDZCxNQUFNQyxXQUFXaEIsMkRBQU9BLEVBQUUsQ0FBQyxFQUFFO0lBRTdCLElBQUlnQixVQUFVO1FBQ1osT0FBT0E7SUFDVDtJQUVBLE1BQU1DLFNBQVNiO0lBRWYsSUFBSSxDQUFDYSxRQUFRO1FBQ1gsTUFBTSxJQUFJQyxNQUFNO0lBQ2xCO0lBRUEsT0FBT2pCLGlFQUFhQSxDQUFDZ0I7QUFDdkI7QUFFTyxTQUFTRTtJQUNkLE9BQU9qQiw0REFBT0EsQ0FBQ2E7QUFDakI7QUFFTyxTQUFTSztJQUNkLE9BQU9qQixzRUFBWUEsQ0FBQ1k7QUFDdEIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2xpYi9maXJlYmFzZS9hZG1pbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjZXJ0LCBnZXRBcHBzLCBpbml0aWFsaXplQXBwIH0gZnJvbSBcImZpcmViYXNlLWFkbWluL2FwcFwiO1xuaW1wb3J0IHsgZ2V0QXV0aCB9IGZyb20gXCJmaXJlYmFzZS1hZG1pbi9hdXRoXCI7XG5pbXBvcnQgeyBnZXRGaXJlc3RvcmUgfSBmcm9tIFwiZmlyZWJhc2UtYWRtaW4vZmlyZXN0b3JlXCI7XG5cbmZ1bmN0aW9uIGdldEFkbWluQ29uZmlnKCkge1xuICBjb25zdCBwcm9qZWN0SWQgPSBwcm9jZXNzLmVudi5GSVJFQkFTRV9BRE1JTl9QUk9KRUNUX0lEO1xuICBjb25zdCBjbGllbnRFbWFpbCA9IHByb2Nlc3MuZW52LkZJUkVCQVNFX0FETUlOX0NMSUVOVF9FTUFJTDtcbiAgY29uc3QgcHJpdmF0ZUtleSA9IHByb2Nlc3MuZW52LkZJUkVCQVNFX0FETUlOX1BSSVZBVEVfS0VZPy5yZXBsYWNlKC9cXFxcbi9nLCBcIlxcblwiKTtcblxuICBpZiAoIXByb2plY3RJZCB8fCAhY2xpZW50RW1haWwgfHwgIXByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY3JlZGVudGlhbDogY2VydCh7XG4gICAgICBwcm9qZWN0SWQsXG4gICAgICBjbGllbnRFbWFpbCxcbiAgICAgIHByaXZhdGVLZXlcbiAgICB9KVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlyZWJhc2VBZG1pbkFwcCgpIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBnZXRBcHBzKClbMF07XG5cbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nO1xuICB9XG5cbiAgY29uc3QgY29uZmlnID0gZ2V0QWRtaW5Db25maWcoKTtcblxuICBpZiAoIWNvbmZpZykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZpcmViYXNlIEFkbWluIGVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgbm90IGNvbmZpZ3VyZWQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIGluaXRpYWxpemVBcHAoY29uZmlnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkbWluQXV0aCgpIHtcbiAgcmV0dXJuIGdldEF1dGgoZ2V0RmlyZWJhc2VBZG1pbkFwcCgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkbWluRGIoKSB7XG4gIHJldHVybiBnZXRGaXJlc3RvcmUoZ2V0RmlyZWJhc2VBZG1pbkFwcCgpKTtcbn1cbiJdLCJuYW1lcyI6WyJjZXJ0IiwiZ2V0QXBwcyIsImluaXRpYWxpemVBcHAiLCJnZXRBdXRoIiwiZ2V0RmlyZXN0b3JlIiwiZ2V0QWRtaW5Db25maWciLCJwcm9qZWN0SWQiLCJwcm9jZXNzIiwiZW52IiwiRklSRUJBU0VfQURNSU5fUFJPSkVDVF9JRCIsImNsaWVudEVtYWlsIiwiRklSRUJBU0VfQURNSU5fQ0xJRU5UX0VNQUlMIiwicHJpdmF0ZUtleSIsIkZJUkVCQVNFX0FETUlOX1BSSVZBVEVfS0VZIiwicmVwbGFjZSIsImNyZWRlbnRpYWwiLCJnZXRGaXJlYmFzZUFkbWluQXBwIiwiZXhpc3RpbmciLCJjb25maWciLCJFcnJvciIsImdldEFkbWluQXV0aCIsImdldEFkbWluRGIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/firebase/admin.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&page=%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&page=%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_atarashi_spot_cloud_app_api_spots_spotId_socio_number_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/spots/[spotId]/socio-number/route.ts */ \"(rsc)/./app/api/spots/[spotId]/socio-number/route.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_Users_atarashi_spot_cloud_app_api_spots_spotId_socio_number_route_ts__WEBPACK_IMPORTED_MODULE_3__]);\n_Users_atarashi_spot_cloud_app_api_spots_spotId_socio_number_route_ts__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/spots/[spotId]/socio-number/route\",\n        pathname: \"/api/spots/[spotId]/socio-number\",\n        filename: \"route\",\n        bundlePath: \"app/api/spots/[spotId]/socio-number/route\"\n    },\n    resolvedPagePath: \"/Users/atarashi/spot-cloud/app/api/spots/[spotId]/socio-number/route.ts\",\n    nextConfigOutput,\n    userland: _Users_atarashi_spot_cloud_app_api_spots_spotId_socio_number_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzcG90cyUyRiU1QnNwb3RJZCU1RCUyRnNvY2lvLW51bWJlciUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGc3BvdHMlMkYlNUJzcG90SWQlNUQlMkZzb2Npby1udW1iZXIlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZzcG90cyUyRiU1QnNwb3RJZCU1RCUyRnNvY2lvLW51bWJlciUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmF0YXJhc2hpJTJGc3BvdC1jbG91ZCUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZhdGFyYXNoaSUyRnNwb3QtY2xvdWQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ3VCO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRixxQyIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3Nwb3RzL1tzcG90SWRdL3NvY2lvLW51bWJlci9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3BvdHMvW3Nwb3RJZF0vc29jaW8tbnVtYmVyL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvc3BvdHMvW3Nwb3RJZF0vc29jaW8tbnVtYmVyXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9zcG90cy9bc3BvdElkXS9zb2Npby1udW1iZXIvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3Nwb3RzL1tzcG90SWRdL3NvY2lvLW51bWJlci9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&page=%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "firebase-admin/app":
/*!*************************************!*\
  !*** external "firebase-admin/app" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase-admin/app");;

/***/ }),

/***/ "firebase-admin/auth":
/*!**************************************!*\
  !*** external "firebase-admin/auth" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase-admin/auth");;

/***/ }),

/***/ "firebase-admin/firestore":
/*!*******************************************!*\
  !*** external "firebase-admin/firestore" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase-admin/firestore");;

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&page=%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fspots%2F%5BspotId%5D%2Fsocio-number%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
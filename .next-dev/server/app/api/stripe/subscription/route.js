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
exports.id = "app/api/stripe/subscription/route";
exports.ids = ["app/api/stripe/subscription/route"];
exports.modules = {

/***/ "(rsc)/./app/api/stripe/subscription/route.ts":
/*!**********************************************!*\
  !*** ./app/api/stripe/subscription/route.ts ***!
  \**********************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/firebase/admin */ \"(rsc)/./lib/firebase/admin.ts\");\n/* harmony import */ var _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/stripe/config */ \"(rsc)/./lib/stripe/config.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__]);\n_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\nasync function GET(request) {\n    const authorization = request.headers.get(\"authorization\");\n    if (!authorization?.startsWith(\"Bearer \")) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"missing_auth\"\n        }, {\n            status: 401\n        });\n    }\n    const spotId = request.nextUrl.searchParams.get(\"spotId\");\n    if (!spotId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"missing_spot_id\"\n        }, {\n            status: 400\n        });\n    }\n    try {\n        const decodedToken = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminAuth)().verifyIdToken(authorization.slice(\"Bearer \".length));\n        const memberDoc = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminDb)().doc(`spots/${spotId}/members/${decodedToken.uid}`).get();\n        if (!memberDoc.exists) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                nextBillingDate: null\n            });\n        }\n        const subscriptionId = String(memberDoc.data()?.stripeSubscriptionId ?? \"\");\n        if (!subscriptionId || !_lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                nextBillingDate: null\n            });\n        }\n        const subscription = await _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe.subscriptions.retrieve(subscriptionId);\n        // current_period_end は Stripe API バージョンによって型定義が揺れるため\n        // ランタイムで取得する\n        const periodEnd = subscription.current_period_end;\n        const nextBillingDate = typeof periodEnd === \"number\" ? new Date(periodEnd * 1000).toISOString() : null;\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            nextBillingDate\n        });\n    } catch  {\n        // Stripe未設定・サブスクリプション取得失敗は null を返して続行\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            nextBillingDate: null\n        });\n    }\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3N0cmlwZS9zdWJzY3JpcHRpb24vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUF3RDtBQUNRO0FBQ25CO0FBRXRDLGVBQWVJLElBQUlDLE9BQW9CO0lBQzVDLE1BQU1DLGdCQUFnQkQsUUFBUUUsT0FBTyxDQUFDQyxHQUFHLENBQUM7SUFFMUMsSUFBSSxDQUFDRixlQUFlRyxXQUFXLFlBQVk7UUFDekMsT0FBT1QscURBQVlBLENBQUNVLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQWUsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDcEU7SUFFQSxNQUFNQyxTQUFTUixRQUFRUyxPQUFPLENBQUNDLFlBQVksQ0FBQ1AsR0FBRyxDQUFDO0lBRWhELElBQUksQ0FBQ0ssUUFBUTtRQUNYLE9BQU9iLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFrQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN2RTtJQUVBLElBQUk7UUFDRixNQUFNSSxlQUFlLE1BQU1mLGlFQUFZQSxHQUFHZ0IsYUFBYSxDQUNyRFgsY0FBY1ksS0FBSyxDQUFDLFVBQVVDLE1BQU07UUFHdEMsTUFBTUMsWUFBWSxNQUFNbEIsK0RBQVVBLEdBQy9CbUIsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFUixPQUFPLFNBQVMsRUFBRUcsYUFBYU0sR0FBRyxFQUFFLEVBQ2pEZCxHQUFHO1FBRU4sSUFBSSxDQUFDWSxVQUFVRyxNQUFNLEVBQUU7WUFDckIsT0FBT3ZCLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7Z0JBQUVjLGlCQUFpQjtZQUFLO1FBQ25EO1FBRUEsTUFBTUMsaUJBQWlCQyxPQUFPTixVQUFVTyxJQUFJLElBQUlDLHdCQUF3QjtRQUV4RSxJQUFJLENBQUNILGtCQUFrQixDQUFDdEIsc0RBQU1BLEVBQUU7WUFDOUIsT0FBT0gscURBQVlBLENBQUNVLElBQUksQ0FBQztnQkFBRWMsaUJBQWlCO1lBQUs7UUFDbkQ7UUFFQSxNQUFNSyxlQUFlLE1BQU0xQixzREFBTUEsQ0FBQzJCLGFBQWEsQ0FBQ0MsUUFBUSxDQUFDTjtRQUN6RCxxREFBcUQ7UUFDckQsYUFBYTtRQUNiLE1BQU1PLFlBQVksYUFBcURDLGtCQUFrQjtRQUN6RixNQUFNVCxrQkFDSixPQUFPUSxjQUFjLFdBQ2pCLElBQUlFLEtBQUtGLFlBQVksTUFBTUcsV0FBVyxLQUN0QztRQUVOLE9BQU9uQyxxREFBWUEsQ0FBQ1UsSUFBSSxDQUFDO1lBQUVjO1FBQWdCO0lBQzdDLEVBQUUsT0FBTTtRQUNOLHVDQUF1QztRQUN2QyxPQUFPeEIscURBQVlBLENBQUNVLElBQUksQ0FBQztZQUFFYyxpQkFBaUI7UUFBSztJQUNuRDtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3N0cmlwZS9zdWJzY3JpcHRpb24vcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0QWRtaW5BdXRoLCBnZXRBZG1pbkRiIH0gZnJvbSBcIkAvbGliL2ZpcmViYXNlL2FkbWluXCI7XG5pbXBvcnQgeyBzdHJpcGUgfSBmcm9tIFwiQC9saWIvc3RyaXBlL2NvbmZpZ1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIGNvbnN0IGF1dGhvcml6YXRpb24gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKTtcblxuICBpZiAoIWF1dGhvcml6YXRpb24/LnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwibWlzc2luZ19hdXRoXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgfVxuXG4gIGNvbnN0IHNwb3RJZCA9IHJlcXVlc3QubmV4dFVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic3BvdElkXCIpO1xuXG4gIGlmICghc3BvdElkKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwibWlzc2luZ19zcG90X2lkXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZGVjb2RlZFRva2VuID0gYXdhaXQgZ2V0QWRtaW5BdXRoKCkudmVyaWZ5SWRUb2tlbihcbiAgICAgIGF1dGhvcml6YXRpb24uc2xpY2UoXCJCZWFyZXIgXCIubGVuZ3RoKVxuICAgICk7XG5cbiAgICBjb25zdCBtZW1iZXJEb2MgPSBhd2FpdCBnZXRBZG1pbkRiKClcbiAgICAgIC5kb2MoYHNwb3RzLyR7c3BvdElkfS9tZW1iZXJzLyR7ZGVjb2RlZFRva2VuLnVpZH1gKVxuICAgICAgLmdldCgpO1xuXG4gICAgaWYgKCFtZW1iZXJEb2MuZXhpc3RzKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBuZXh0QmlsbGluZ0RhdGU6IG51bGwgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uSWQgPSBTdHJpbmcobWVtYmVyRG9jLmRhdGEoKT8uc3RyaXBlU3Vic2NyaXB0aW9uSWQgPz8gXCJcIik7XG5cbiAgICBpZiAoIXN1YnNjcmlwdGlvbklkIHx8ICFzdHJpcGUpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG5leHRCaWxsaW5nRGF0ZTogbnVsbCB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBhd2FpdCBzdHJpcGUuc3Vic2NyaXB0aW9ucy5yZXRyaWV2ZShzdWJzY3JpcHRpb25JZCk7XG4gICAgLy8gY3VycmVudF9wZXJpb2RfZW5kIOOBryBTdHJpcGUgQVBJIOODkOODvOOCuOODp+ODs+OBq+OCiOOBo+OBpuWei+Wumue+qeOBjOaPuuOCjOOCi+OBn+OCgVxuICAgIC8vIOODqeODs+OCv+OCpOODoOOBp+WPluW+l+OBmeOCi1xuICAgIGNvbnN0IHBlcmlvZEVuZCA9IChzdWJzY3JpcHRpb24gYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikuY3VycmVudF9wZXJpb2RfZW5kO1xuICAgIGNvbnN0IG5leHRCaWxsaW5nRGF0ZSA9XG4gICAgICB0eXBlb2YgcGVyaW9kRW5kID09PSBcIm51bWJlclwiXG4gICAgICAgID8gbmV3IERhdGUocGVyaW9kRW5kICogMTAwMCkudG9JU09TdHJpbmcoKVxuICAgICAgICA6IG51bGw7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBuZXh0QmlsbGluZ0RhdGUgfSk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFN0cmlwZeacquioreWumuODu+OCteODluOCueOCr+ODquODl+OCt+ODp+ODs+WPluW+l+WkseaVl+OBryBudWxsIOOCkui/lOOBl+OBpue2muihjFxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG5leHRCaWxsaW5nRGF0ZTogbnVsbCB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldEFkbWluQXV0aCIsImdldEFkbWluRGIiLCJzdHJpcGUiLCJHRVQiLCJyZXF1ZXN0IiwiYXV0aG9yaXphdGlvbiIsImhlYWRlcnMiLCJnZXQiLCJzdGFydHNXaXRoIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwic3BvdElkIiwibmV4dFVybCIsInNlYXJjaFBhcmFtcyIsImRlY29kZWRUb2tlbiIsInZlcmlmeUlkVG9rZW4iLCJzbGljZSIsImxlbmd0aCIsIm1lbWJlckRvYyIsImRvYyIsInVpZCIsImV4aXN0cyIsIm5leHRCaWxsaW5nRGF0ZSIsInN1YnNjcmlwdGlvbklkIiwiU3RyaW5nIiwiZGF0YSIsInN0cmlwZVN1YnNjcmlwdGlvbklkIiwic3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9ucyIsInJldHJpZXZlIiwicGVyaW9kRW5kIiwiY3VycmVudF9wZXJpb2RfZW5kIiwiRGF0ZSIsInRvSVNPU3RyaW5nIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/stripe/subscription/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/firebase/admin.ts":
/*!*******************************!*\
  !*** ./lib/firebase/admin.ts ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getAdminAuth: () => (/* binding */ getAdminAuth),\n/* harmony export */   getAdminDb: () => (/* binding */ getAdminDb),\n/* harmony export */   getFirebaseAdminApp: () => (/* binding */ getFirebaseAdminApp)\n/* harmony export */ });\n/* harmony import */ var firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase-admin/app */ \"firebase-admin/app\");\n/* harmony import */ var firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase-admin/auth */ \"firebase-admin/auth\");\n/* harmony import */ var firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase-admin/firestore */ \"firebase-admin/firestore\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__, firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__]);\n([firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__, firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\nfunction getAdminConfig() {\n    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;\n    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;\n    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g, \"\\n\");\n    if (!projectId || !clientEmail || !privateKey) {\n        return null;\n    }\n    return {\n        credential: (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.cert)({\n            projectId,\n            clientEmail,\n            privateKey\n        })\n    };\n}\nfunction getFirebaseAdminApp() {\n    const existing = (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.getApps)()[0];\n    if (existing) {\n        return existing;\n    }\n    const config = getAdminConfig();\n    if (!config) {\n        throw new Error(\"Firebase Admin environment variables are not configured.\");\n    }\n    return (0,firebase_admin_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(config);\n}\nfunction getAdminAuth() {\n    return (0,firebase_admin_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(getFirebaseAdminApp());\n}\nfunction getAdminDb() {\n    return (0,firebase_admin_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(getFirebaseAdminApp());\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZmlyZWJhc2UvYWRtaW4udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQWtFO0FBQ3BCO0FBQ1U7QUFFeEQsU0FBU0s7SUFDUCxNQUFNQyxZQUFZQyxRQUFRQyxHQUFHLENBQUNDLHlCQUF5QjtJQUN2RCxNQUFNQyxjQUFjSCxRQUFRQyxHQUFHLENBQUNHLDJCQUEyQjtJQUMzRCxNQUFNQyxhQUFhTCxRQUFRQyxHQUFHLENBQUNLLDBCQUEwQixFQUFFQyxRQUFRLFFBQVE7SUFFM0UsSUFBSSxDQUFDUixhQUFhLENBQUNJLGVBQWUsQ0FBQ0UsWUFBWTtRQUM3QyxPQUFPO0lBQ1Q7SUFFQSxPQUFPO1FBQ0xHLFlBQVlmLHdEQUFJQSxDQUFDO1lBQ2ZNO1lBQ0FJO1lBQ0FFO1FBQ0Y7SUFDRjtBQUNGO0FBRU8sU0FBU0k7SUFDZCxNQUFNQyxXQUFXaEIsMkRBQU9BLEVBQUUsQ0FBQyxFQUFFO0lBRTdCLElBQUlnQixVQUFVO1FBQ1osT0FBT0E7SUFDVDtJQUVBLE1BQU1DLFNBQVNiO0lBRWYsSUFBSSxDQUFDYSxRQUFRO1FBQ1gsTUFBTSxJQUFJQyxNQUFNO0lBQ2xCO0lBRUEsT0FBT2pCLGlFQUFhQSxDQUFDZ0I7QUFDdkI7QUFFTyxTQUFTRTtJQUNkLE9BQU9qQiw0REFBT0EsQ0FBQ2E7QUFDakI7QUFFTyxTQUFTSztJQUNkLE9BQU9qQixzRUFBWUEsQ0FBQ1k7QUFDdEIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2xpYi9maXJlYmFzZS9hZG1pbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjZXJ0LCBnZXRBcHBzLCBpbml0aWFsaXplQXBwIH0gZnJvbSBcImZpcmViYXNlLWFkbWluL2FwcFwiO1xuaW1wb3J0IHsgZ2V0QXV0aCB9IGZyb20gXCJmaXJlYmFzZS1hZG1pbi9hdXRoXCI7XG5pbXBvcnQgeyBnZXRGaXJlc3RvcmUgfSBmcm9tIFwiZmlyZWJhc2UtYWRtaW4vZmlyZXN0b3JlXCI7XG5cbmZ1bmN0aW9uIGdldEFkbWluQ29uZmlnKCkge1xuICBjb25zdCBwcm9qZWN0SWQgPSBwcm9jZXNzLmVudi5GSVJFQkFTRV9BRE1JTl9QUk9KRUNUX0lEO1xuICBjb25zdCBjbGllbnRFbWFpbCA9IHByb2Nlc3MuZW52LkZJUkVCQVNFX0FETUlOX0NMSUVOVF9FTUFJTDtcbiAgY29uc3QgcHJpdmF0ZUtleSA9IHByb2Nlc3MuZW52LkZJUkVCQVNFX0FETUlOX1BSSVZBVEVfS0VZPy5yZXBsYWNlKC9cXFxcbi9nLCBcIlxcblwiKTtcblxuICBpZiAoIXByb2plY3RJZCB8fCAhY2xpZW50RW1haWwgfHwgIXByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY3JlZGVudGlhbDogY2VydCh7XG4gICAgICBwcm9qZWN0SWQsXG4gICAgICBjbGllbnRFbWFpbCxcbiAgICAgIHByaXZhdGVLZXlcbiAgICB9KVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlyZWJhc2VBZG1pbkFwcCgpIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBnZXRBcHBzKClbMF07XG5cbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nO1xuICB9XG5cbiAgY29uc3QgY29uZmlnID0gZ2V0QWRtaW5Db25maWcoKTtcblxuICBpZiAoIWNvbmZpZykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZpcmViYXNlIEFkbWluIGVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgbm90IGNvbmZpZ3VyZWQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIGluaXRpYWxpemVBcHAoY29uZmlnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkbWluQXV0aCgpIHtcbiAgcmV0dXJuIGdldEF1dGgoZ2V0RmlyZWJhc2VBZG1pbkFwcCgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkbWluRGIoKSB7XG4gIHJldHVybiBnZXRGaXJlc3RvcmUoZ2V0RmlyZWJhc2VBZG1pbkFwcCgpKTtcbn1cbiJdLCJuYW1lcyI6WyJjZXJ0IiwiZ2V0QXBwcyIsImluaXRpYWxpemVBcHAiLCJnZXRBdXRoIiwiZ2V0RmlyZXN0b3JlIiwiZ2V0QWRtaW5Db25maWciLCJwcm9qZWN0SWQiLCJwcm9jZXNzIiwiZW52IiwiRklSRUJBU0VfQURNSU5fUFJPSkVDVF9JRCIsImNsaWVudEVtYWlsIiwiRklSRUJBU0VfQURNSU5fQ0xJRU5UX0VNQUlMIiwicHJpdmF0ZUtleSIsIkZJUkVCQVNFX0FETUlOX1BSSVZBVEVfS0VZIiwicmVwbGFjZSIsImNyZWRlbnRpYWwiLCJnZXRGaXJlYmFzZUFkbWluQXBwIiwiZXhpc3RpbmciLCJjb25maWciLCJFcnJvciIsImdldEFkbWluQXV0aCIsImdldEFkbWluRGIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/firebase/admin.ts\n");

/***/ }),

/***/ "(rsc)/./lib/stripe/config.ts":
/*!******************************!*\
  !*** ./lib/stripe/config.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   BILLING_APPLICATION_FEE_PERCENT: () => (/* binding */ BILLING_APPLICATION_FEE_PERCENT),\n/* harmony export */   PLATFORM_FEE_PERCENT: () => (/* binding */ PLATFORM_FEE_PERCENT),\n/* harmony export */   STRIPE_PROCESSING_FEE_RATE: () => (/* binding */ STRIPE_PROCESSING_FEE_RATE),\n/* harmony export */   calcRevenue: () => (/* binding */ calcRevenue),\n/* harmony export */   getStripePriceId: () => (/* binding */ getStripePriceId),\n/* harmony export */   stripe: () => (/* binding */ stripe)\n/* harmony export */ });\n/* harmony import */ var stripe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stripe */ \"(rsc)/./node_modules/stripe/esm/stripe.esm.node.js\");\n\nconst stripe = process.env.STRIPE_SECRET_KEY && new stripe__WEBPACK_IMPORTED_MODULE_0__[\"default\"](process.env.STRIPE_SECRET_KEY, {\n    apiVersion: \"2025-08-27.basil\"\n});\n/**\n * SPOT利用料率 (%)\n * 「Stripe手数料控除後の純額」に対して課金する率。\n * 例: 決済¥100 → Stripe控除後¥96.4 → SPOT利用料¥9.64\n */ const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? \"10\");\n/**\n * Stripe決済手数料率 (小数)\n * 日本国内カード標準: 3.6%（固定手数料なし）\n * 環境変数 STRIPE_PROCESSING_FEE_RATE で上書き可能\n */ const STRIPE_PROCESSING_FEE_RATE = Number(process.env.STRIPE_PROCESSING_FEE_RATE ?? \"3.6\") / 100;\n/**\n * Stripeサブスクリプションに設定する application_fee_percent\n *\n * 設計方針:\n *   SPOT利用料 = (決済額 - Stripe手数料) × PLATFORM_FEE_PERCENT%\n *   振込予定額  = 決済額 - Stripe手数料 - SPOT利用料\n *\n * application_fee_percent を以下の式で設定すると、\n * Stripe側の自動分配がこの設計通りになる:\n *\n *   billingFee = PLATFORM_FEE + STRIPE_FEE × (1 - PLATFORM_FEE / 100)\n *\n * 例 (PLATFORM=10%, STRIPE=3.6%):\n *   = 10 + 3.6 × 0.9 = 13.24%\n *\n * → 振込予定額 = 決済額 × (1 - 0.1324) ≈ 86.76%\n *   ¥100決済 → 振込 ¥87 / ¥300 → ¥260 / ¥500 → ¥434\n */ const BILLING_APPLICATION_FEE_PERCENT = PLATFORM_FEE_PERCENT + STRIPE_PROCESSING_FEE_RATE * 100 * (1 - PLATFORM_FEE_PERCENT / 100);\nconst priceIdMap = {\n    100: process.env.STRIPE_PRICE_ID_100,\n    300: process.env.STRIPE_PRICE_ID_300,\n    500: process.env.STRIPE_PRICE_ID_500\n};\nfunction getStripePriceId(planAmount) {\n    return priceIdMap[planAmount];\n}\n/**\n * 決済額から各費用を計算するユーティリティ\n * UIの表示・API返却値の算出に使う\n */ function calcRevenue(grossAmount) {\n    const stripeFee = Math.round(grossAmount * STRIPE_PROCESSING_FEE_RATE);\n    const netAfterStripe = grossAmount - stripeFee;\n    const platformFee = Math.round(netAfterStripe * (PLATFORM_FEE_PERCENT / 100));\n    const payout = grossAmount - stripeFee - platformFee;\n    return {\n        grossAmount,\n        stripeFee,\n        netAfterStripe,\n        platformFee,\n        payout\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3RyaXBlL2NvbmZpZy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTRCO0FBR3JCLE1BQU1DLFNBQ1hDLFFBQVFDLEdBQUcsQ0FBQ0MsaUJBQWlCLElBQzdCLElBQUlKLDhDQUFNQSxDQUFDRSxRQUFRQyxHQUFHLENBQUNDLGlCQUFpQixFQUFFO0lBQ3hDQyxZQUFZO0FBQ2QsR0FBRztBQUVMOzs7O0NBSUMsR0FDTSxNQUFNQyx1QkFBdUJDLE9BQU9MLFFBQVFDLEdBQUcsQ0FBQ0csb0JBQW9CLElBQUksTUFBTTtBQUVyRjs7OztDQUlDLEdBQ00sTUFBTUUsNkJBQ1hELE9BQU9MLFFBQVFDLEdBQUcsQ0FBQ0ssMEJBQTBCLElBQUksU0FBUyxJQUFJO0FBRWhFOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNNLE1BQU1DLGtDQUNYSCx1QkFDQUUsNkJBQTZCLE1BQU8sS0FBSUYsdUJBQXVCLEdBQUUsRUFBRztBQUV0RSxNQUFNSSxhQUFxRDtJQUN6RCxLQUFLUixRQUFRQyxHQUFHLENBQUNRLG1CQUFtQjtJQUNwQyxLQUFLVCxRQUFRQyxHQUFHLENBQUNTLG1CQUFtQjtJQUNwQyxLQUFLVixRQUFRQyxHQUFHLENBQUNVLG1CQUFtQjtBQUN0QztBQUVPLFNBQVNDLGlCQUFpQkMsVUFBc0I7SUFDckQsT0FBT0wsVUFBVSxDQUFDSyxXQUFXO0FBQy9CO0FBRUE7OztDQUdDLEdBQ00sU0FBU0MsWUFBWUMsV0FBbUI7SUFDN0MsTUFBTUMsWUFBWUMsS0FBS0MsS0FBSyxDQUFDSCxjQUFjVDtJQUMzQyxNQUFNYSxpQkFBaUJKLGNBQWNDO0lBQ3JDLE1BQU1JLGNBQWNILEtBQUtDLEtBQUssQ0FBQ0MsaUJBQWtCZixDQUFBQSx1QkFBdUIsR0FBRTtJQUMxRSxNQUFNaUIsU0FBU04sY0FBY0MsWUFBWUk7SUFFekMsT0FBTztRQUFFTDtRQUFhQztRQUFXRztRQUFnQkM7UUFBYUM7SUFBTztBQUN2RSIsInNvdXJjZXMiOlsiL1VzZXJzL2F0YXJhc2hpL3Nwb3QtY2xvdWQvbGliL3N0cmlwZS9jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFN0cmlwZSBmcm9tIFwic3RyaXBlXCI7XG5pbXBvcnQgeyBQbGFuQW1vdW50IH0gZnJvbSBcIkAvbGliL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBzdHJpcGUgPVxuICBwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWSAmJlxuICBuZXcgU3RyaXBlKHByb2Nlc3MuZW52LlNUUklQRV9TRUNSRVRfS0VZLCB7XG4gICAgYXBpVmVyc2lvbjogXCIyMDI1LTA4LTI3LmJhc2lsXCJcbiAgfSk7XG5cbi8qKlxuICogU1BPVOWIqeeUqOaWmeeOhyAoJSlcbiAqIOOAjFN0cmlwZeaJi+aVsOaWmeaOp+mZpOW+jOOBrue0lOmhjeOAjeOBq+WvvuOBl+OBpuiqsumHkeOBmeOCi+eOh+OAglxuICog5L6LOiDmsbrmuIjCpTEwMCDihpIgU3RyaXBl5o6n6Zmk5b6MwqU5Ni40IOKGkiBTUE9U5Yip55So5paZwqU5LjY0XG4gKi9cbmV4cG9ydCBjb25zdCBQTEFURk9STV9GRUVfUEVSQ0VOVCA9IE51bWJlcihwcm9jZXNzLmVudi5QTEFURk9STV9GRUVfUEVSQ0VOVCA/PyBcIjEwXCIpO1xuXG4vKipcbiAqIFN0cmlwZeaxuua4iOaJi+aVsOaWmeeOhyAo5bCP5pWwKVxuICog5pel5pys5Zu95YaF44Kr44O844OJ5qiZ5rqWOiAzLjYl77yI5Zu65a6a5omL5pWw5paZ44Gq44GX77yJXG4gKiDnkrDlooPlpInmlbAgU1RSSVBFX1BST0NFU1NJTkdfRkVFX1JBVEUg44Gn5LiK5pu444GN5Y+v6IO9XG4gKi9cbmV4cG9ydCBjb25zdCBTVFJJUEVfUFJPQ0VTU0lOR19GRUVfUkFURSA9XG4gIE51bWJlcihwcm9jZXNzLmVudi5TVFJJUEVfUFJPQ0VTU0lOR19GRUVfUkFURSA/PyBcIjMuNlwiKSAvIDEwMDtcblxuLyoqXG4gKiBTdHJpcGXjgrXjg5bjgrnjgq/jg6rjg5fjgrfjg6fjg7PjgavoqK3lrprjgZnjgosgYXBwbGljYXRpb25fZmVlX3BlcmNlbnRcbiAqXG4gKiDoqK3oqIjmlrnph506XG4gKiAgIFNQT1TliKnnlKjmlpkgPSAo5rG65riI6aGNIC0gU3RyaXBl5omL5pWw5paZKSDDlyBQTEFURk9STV9GRUVfUEVSQ0VOVCVcbiAqICAg5oyv6L685LqI5a6a6aGNICA9IOaxuua4iOmhjSAtIFN0cmlwZeaJi+aVsOaWmSAtIFNQT1TliKnnlKjmlplcbiAqXG4gKiBhcHBsaWNhdGlvbl9mZWVfcGVyY2VudCDjgpLku6XkuIvjga7lvI/jgafoqK3lrprjgZnjgovjgajjgIFcbiAqIFN0cmlwZeWBtOOBruiHquWLleWIhumFjeOBjOOBk+OBruioreioiOmAmuOCiuOBq+OBquOCizpcbiAqXG4gKiAgIGJpbGxpbmdGZWUgPSBQTEFURk9STV9GRUUgKyBTVFJJUEVfRkVFIMOXICgxIC0gUExBVEZPUk1fRkVFIC8gMTAwKVxuICpcbiAqIOS+iyAoUExBVEZPUk09MTAlLCBTVFJJUEU9My42JSk6XG4gKiAgID0gMTAgKyAzLjYgw5cgMC45ID0gMTMuMjQlXG4gKlxuICog4oaSIOaMr+i+vOS6iOWumumhjSA9IOaxuua4iOmhjSDDlyAoMSAtIDAuMTMyNCkg4omIIDg2Ljc2JVxuICogICDCpTEwMOaxuua4iCDihpIg5oyv6L68IMKlODcgLyDCpTMwMCDihpIgwqUyNjAgLyDCpTUwMCDihpIgwqU0MzRcbiAqL1xuZXhwb3J0IGNvbnN0IEJJTExJTkdfQVBQTElDQVRJT05fRkVFX1BFUkNFTlQgPVxuICBQTEFURk9STV9GRUVfUEVSQ0VOVCArXG4gIFNUUklQRV9QUk9DRVNTSU5HX0ZFRV9SQVRFICogMTAwICogKDEgLSBQTEFURk9STV9GRUVfUEVSQ0VOVCAvIDEwMCk7XG5cbmNvbnN0IHByaWNlSWRNYXA6IFJlY29yZDxQbGFuQW1vdW50LCBzdHJpbmcgfCB1bmRlZmluZWQ+ID0ge1xuICAxMDA6IHByb2Nlc3MuZW52LlNUUklQRV9QUklDRV9JRF8xMDAsXG4gIDMwMDogcHJvY2Vzcy5lbnYuU1RSSVBFX1BSSUNFX0lEXzMwMCxcbiAgNTAwOiBwcm9jZXNzLmVudi5TVFJJUEVfUFJJQ0VfSURfNTAwXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyaXBlUHJpY2VJZChwbGFuQW1vdW50OiBQbGFuQW1vdW50KSB7XG4gIHJldHVybiBwcmljZUlkTWFwW3BsYW5BbW91bnRdO1xufVxuXG4vKipcbiAqIOaxuua4iOmhjeOBi+OCieWQhOiyu+eUqOOCkuioiOeul+OBmeOCi+ODpuODvOODhuOCo+ODquODhuOCo1xuICogVUnjga7ooajnpLrjg7tBUEnov5TljbTlgKTjga7nrpflh7rjgavkvb/jgYZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNSZXZlbnVlKGdyb3NzQW1vdW50OiBudW1iZXIpIHtcbiAgY29uc3Qgc3RyaXBlRmVlID0gTWF0aC5yb3VuZChncm9zc0Ftb3VudCAqIFNUUklQRV9QUk9DRVNTSU5HX0ZFRV9SQVRFKTtcbiAgY29uc3QgbmV0QWZ0ZXJTdHJpcGUgPSBncm9zc0Ftb3VudCAtIHN0cmlwZUZlZTtcbiAgY29uc3QgcGxhdGZvcm1GZWUgPSBNYXRoLnJvdW5kKG5ldEFmdGVyU3RyaXBlICogKFBMQVRGT1JNX0ZFRV9QRVJDRU5UIC8gMTAwKSk7XG4gIGNvbnN0IHBheW91dCA9IGdyb3NzQW1vdW50IC0gc3RyaXBlRmVlIC0gcGxhdGZvcm1GZWU7XG5cbiAgcmV0dXJuIHsgZ3Jvc3NBbW91bnQsIHN0cmlwZUZlZSwgbmV0QWZ0ZXJTdHJpcGUsIHBsYXRmb3JtRmVlLCBwYXlvdXQgfTtcbn1cbiJdLCJuYW1lcyI6WyJTdHJpcGUiLCJzdHJpcGUiLCJwcm9jZXNzIiwiZW52IiwiU1RSSVBFX1NFQ1JFVF9LRVkiLCJhcGlWZXJzaW9uIiwiUExBVEZPUk1fRkVFX1BFUkNFTlQiLCJOdW1iZXIiLCJTVFJJUEVfUFJPQ0VTU0lOR19GRUVfUkFURSIsIkJJTExJTkdfQVBQTElDQVRJT05fRkVFX1BFUkNFTlQiLCJwcmljZUlkTWFwIiwiU1RSSVBFX1BSSUNFX0lEXzEwMCIsIlNUUklQRV9QUklDRV9JRF8zMDAiLCJTVFJJUEVfUFJJQ0VfSURfNTAwIiwiZ2V0U3RyaXBlUHJpY2VJZCIsInBsYW5BbW91bnQiLCJjYWxjUmV2ZW51ZSIsImdyb3NzQW1vdW50Iiwic3RyaXBlRmVlIiwiTWF0aCIsInJvdW5kIiwibmV0QWZ0ZXJTdHJpcGUiLCJwbGF0Zm9ybUZlZSIsInBheW91dCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/stripe/config.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fsubscription%2Froute&page=%2Fapi%2Fstripe%2Fsubscription%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fsubscription%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fsubscription%2Froute&page=%2Fapi%2Fstripe%2Fsubscription%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fsubscription%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_atarashi_spot_cloud_app_api_stripe_subscription_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/stripe/subscription/route.ts */ \"(rsc)/./app/api/stripe/subscription/route.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_Users_atarashi_spot_cloud_app_api_stripe_subscription_route_ts__WEBPACK_IMPORTED_MODULE_3__]);\n_Users_atarashi_spot_cloud_app_api_stripe_subscription_route_ts__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/stripe/subscription/route\",\n        pathname: \"/api/stripe/subscription\",\n        filename: \"route\",\n        bundlePath: \"app/api/stripe/subscription/route\"\n    },\n    resolvedPagePath: \"/Users/atarashi/spot-cloud/app/api/stripe/subscription/route.ts\",\n    nextConfigOutput,\n    userland: _Users_atarashi_spot_cloud_app_api_stripe_subscription_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzdHJpcGUlMkZzdWJzY3JpcHRpb24lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnN0cmlwZSUyRnN1YnNjcmlwdGlvbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnN0cmlwZSUyRnN1YnNjcmlwdGlvbiUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmF0YXJhc2hpJTJGc3BvdC1jbG91ZCUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZhdGFyYXNoaSUyRnNwb3QtY2xvdWQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ2U7QUFDNUY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGLHFDIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2FwcC9hcGkvc3RyaXBlL3N1YnNjcmlwdGlvbi9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3RyaXBlL3N1YnNjcmlwdGlvbi9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3N0cmlwZS9zdWJzY3JpcHRpb25cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3N0cmlwZS9zdWJzY3JpcHRpb24vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3N0cmlwZS9zdWJzY3JpcHRpb24vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fsubscription%2Froute&page=%2Fapi%2Fstripe%2Fsubscription%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fsubscription%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

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

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

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

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/stripe","vendor-chunks/qs","vendor-chunks/object-inspect","vendor-chunks/get-intrinsic","vendor-chunks/side-channel-list","vendor-chunks/side-channel-weakmap","vendor-chunks/has-symbols","vendor-chunks/function-bind","vendor-chunks/side-channel-map","vendor-chunks/side-channel","vendor-chunks/get-proto","vendor-chunks/call-bind-apply-helpers","vendor-chunks/dunder-proto","vendor-chunks/math-intrinsics","vendor-chunks/call-bound","vendor-chunks/es-errors","vendor-chunks/gopd","vendor-chunks/es-define-property","vendor-chunks/hasown","vendor-chunks/es-object-atoms"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fsubscription%2Froute&page=%2Fapi%2Fstripe%2Fsubscription%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fsubscription%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
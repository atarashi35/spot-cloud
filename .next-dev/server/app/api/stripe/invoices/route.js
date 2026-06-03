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
exports.id = "app/api/stripe/invoices/route";
exports.ids = ["app/api/stripe/invoices/route"];
exports.modules = {

/***/ "(rsc)/./app/api/stripe/invoices/route.ts":
/*!******************************************!*\
  !*** ./app/api/stripe/invoices/route.ts ***!
  \******************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/firebase/admin */ \"(rsc)/./lib/firebase/admin.ts\");\n/* harmony import */ var _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/stripe/config */ \"(rsc)/./lib/stripe/config.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__]);\n_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\nasync function GET(request) {\n    const authorization = request.headers.get(\"authorization\");\n    if (!authorization?.startsWith(\"Bearer \")) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"missing_auth\"\n        }, {\n            status: 401\n        });\n    }\n    try {\n        const decodedToken = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminAuth)().verifyIdToken(authorization.slice(\"Bearer \".length));\n        const uid = decodedToken.uid;\n        // ユーザーの全メンバーシップを取得してcustomerIdを集める\n        const membershipsSnap = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminDb)().collectionGroup(\"members\").where(\"uid\", \"==\", uid).get();\n        if (membershipsSnap.empty || !_lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                invoices: []\n            });\n        }\n        const stripeClient = _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe;\n        const invoices = [];\n        await Promise.all(membershipsSnap.docs.map(async (doc)=>{\n            const data = doc.data();\n            const customerId = String(data.stripeCustomerId ?? \"\");\n            const spotId = doc.ref.parent.parent?.id ?? \"\";\n            if (!customerId) return;\n            const stripeInvoices = await stripeClient.invoices.list({\n                customer: customerId,\n                limit: 12\n            });\n            stripeInvoices.data.forEach((inv)=>{\n                invoices.push({\n                    id: inv.id ?? \"\",\n                    date: new Date((inv.created ?? 0) * 1000).toISOString(),\n                    amount: inv.amount_paid ?? 0,\n                    currency: inv.currency ?? \"jpy\",\n                    status: inv.status ?? \"unknown\",\n                    pdfUrl: inv.invoice_pdf ?? null,\n                    spotId\n                });\n            });\n        }));\n        invoices.sort((a, b)=>b.date.localeCompare(a.date));\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            invoices\n        });\n    } catch  {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"internal_error\"\n        }, {\n            status: 500\n        });\n    }\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3N0cmlwZS9pbnZvaWNlcy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQXdEO0FBQ1E7QUFDbkI7QUFZdEMsZUFBZUksSUFBSUMsT0FBb0I7SUFDNUMsTUFBTUMsZ0JBQWdCRCxRQUFRRSxPQUFPLENBQUNDLEdBQUcsQ0FBQztJQUUxQyxJQUFJLENBQUNGLGVBQWVHLFdBQVcsWUFBWTtRQUN6QyxPQUFPVCxxREFBWUEsQ0FBQ1UsSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBZSxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNwRTtJQUVBLElBQUk7UUFDRixNQUFNQyxlQUFlLE1BQU1aLGlFQUFZQSxHQUFHYSxhQUFhLENBQ3JEUixjQUFjUyxLQUFLLENBQUMsVUFBVUMsTUFBTTtRQUd0QyxNQUFNQyxNQUFNSixhQUFhSSxHQUFHO1FBRTVCLG1DQUFtQztRQUNuQyxNQUFNQyxrQkFBa0IsTUFBTWhCLCtEQUFVQSxHQUNyQ2lCLGVBQWUsQ0FBQyxXQUNoQkMsS0FBSyxDQUFDLE9BQU8sTUFBTUgsS0FDbkJULEdBQUc7UUFFTixJQUFJVSxnQkFBZ0JHLEtBQUssSUFBSSxDQUFDbEIsc0RBQU1BLEVBQUU7WUFDcEMsT0FBT0gscURBQVlBLENBQUNVLElBQUksQ0FBQztnQkFBRVksVUFBVSxFQUFFO1lBQUM7UUFDMUM7UUFFQSxNQUFNQyxlQUFlcEIsc0RBQU1BO1FBRTNCLE1BQU1tQixXQUEwQixFQUFFO1FBRWxDLE1BQU1FLFFBQVFDLEdBQUcsQ0FDZlAsZ0JBQWdCUSxJQUFJLENBQUNDLEdBQUcsQ0FBQyxPQUFPQztZQUM5QixNQUFNQyxPQUFPRCxJQUFJQyxJQUFJO1lBQ3JCLE1BQU1DLGFBQWFDLE9BQU9GLEtBQUtHLGdCQUFnQixJQUFJO1lBQ25ELE1BQU1DLFNBQVNMLElBQUlNLEdBQUcsQ0FBQ0MsTUFBTSxDQUFDQSxNQUFNLEVBQUVDLE1BQU07WUFFNUMsSUFBSSxDQUFDTixZQUFZO1lBRWpCLE1BQU1PLGlCQUFpQixNQUFNZCxhQUFhRCxRQUFRLENBQUNnQixJQUFJLENBQUM7Z0JBQ3REQyxVQUFVVDtnQkFDVlUsT0FBTztZQUNUO1lBRUFILGVBQWVSLElBQUksQ0FBQ1ksT0FBTyxDQUFDLENBQUNDO2dCQUMzQnBCLFNBQVNxQixJQUFJLENBQUM7b0JBQ1pQLElBQUlNLElBQUlOLEVBQUUsSUFBSTtvQkFDZFEsTUFBTSxJQUFJQyxLQUFLLENBQUNILElBQUlJLE9BQU8sSUFBSSxLQUFLLE1BQU1DLFdBQVc7b0JBQ3JEQyxRQUFRTixJQUFJTyxXQUFXLElBQUk7b0JBQzNCQyxVQUFVUixJQUFJUSxRQUFRLElBQUk7b0JBQzFCdEMsUUFBUThCLElBQUk5QixNQUFNLElBQUk7b0JBQ3RCdUMsUUFBUVQsSUFBSVUsV0FBVyxJQUFJO29CQUMzQm5CO2dCQUNGO1lBQ0Y7UUFDRjtRQUdGWCxTQUFTK0IsSUFBSSxDQUFDLENBQUNDLEdBQUdDLElBQU1BLEVBQUVYLElBQUksQ0FBQ1ksYUFBYSxDQUFDRixFQUFFVixJQUFJO1FBRW5ELE9BQU81QyxxREFBWUEsQ0FBQ1UsSUFBSSxDQUFDO1lBQUVZO1FBQVM7SUFDdEMsRUFBRSxPQUFNO1FBQ04sT0FBT3RCLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFpQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN0RTtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3N0cmlwZS9pbnZvaWNlcy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyBnZXRBZG1pbkF1dGgsIGdldEFkbWluRGIgfSBmcm9tIFwiQC9saWIvZmlyZWJhc2UvYWRtaW5cIjtcbmltcG9ydCB7IHN0cmlwZSB9IGZyb20gXCJAL2xpYi9zdHJpcGUvY29uZmlnXCI7XG5cbmV4cG9ydCB0eXBlIEludm9pY2VJdGVtID0ge1xuICBpZDogc3RyaW5nO1xuICBkYXRlOiBzdHJpbmc7XG4gIGFtb3VudDogbnVtYmVyO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBzdGF0dXM6IHN0cmluZztcbiAgcGRmVXJsOiBzdHJpbmcgfCBudWxsO1xuICBzcG90SWQ6IHN0cmluZztcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgY29uc3QgYXV0aG9yaXphdGlvbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJhdXRob3JpemF0aW9uXCIpO1xuXG4gIGlmICghYXV0aG9yaXphdGlvbj8uc3RhcnRzV2l0aChcIkJlYXJlciBcIikpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJtaXNzaW5nX2F1dGhcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBhd2FpdCBnZXRBZG1pbkF1dGgoKS52ZXJpZnlJZFRva2VuKFxuICAgICAgYXV0aG9yaXphdGlvbi5zbGljZShcIkJlYXJlciBcIi5sZW5ndGgpXG4gICAgKTtcblxuICAgIGNvbnN0IHVpZCA9IGRlY29kZWRUb2tlbi51aWQ7XG5cbiAgICAvLyDjg6bjg7zjgrbjg7zjga7lhajjg6Hjg7Pjg5Djg7zjgrfjg4Pjg5fjgpLlj5blvpfjgZfjgaZjdXN0b21lcklk44KS6ZuG44KB44KLXG4gICAgY29uc3QgbWVtYmVyc2hpcHNTbmFwID0gYXdhaXQgZ2V0QWRtaW5EYigpXG4gICAgICAuY29sbGVjdGlvbkdyb3VwKFwibWVtYmVyc1wiKVxuICAgICAgLndoZXJlKFwidWlkXCIsIFwiPT1cIiwgdWlkKVxuICAgICAgLmdldCgpO1xuXG4gICAgaWYgKG1lbWJlcnNoaXBzU25hcC5lbXB0eSB8fCAhc3RyaXBlKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBpbnZvaWNlczogW10gfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RyaXBlQ2xpZW50ID0gc3RyaXBlO1xuXG4gICAgY29uc3QgaW52b2ljZXM6IEludm9pY2VJdGVtW10gPSBbXTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgbWVtYmVyc2hpcHNTbmFwLmRvY3MubWFwKGFzeW5jIChkb2MpID0+IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGRvYy5kYXRhKCk7XG4gICAgICAgIGNvbnN0IGN1c3RvbWVySWQgPSBTdHJpbmcoZGF0YS5zdHJpcGVDdXN0b21lcklkID8/IFwiXCIpO1xuICAgICAgICBjb25zdCBzcG90SWQgPSBkb2MucmVmLnBhcmVudC5wYXJlbnQ/LmlkID8/IFwiXCI7XG5cbiAgICAgICAgaWYgKCFjdXN0b21lcklkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgc3RyaXBlSW52b2ljZXMgPSBhd2FpdCBzdHJpcGVDbGllbnQuaW52b2ljZXMubGlzdCh7XG4gICAgICAgICAgY3VzdG9tZXI6IGN1c3RvbWVySWQsXG4gICAgICAgICAgbGltaXQ6IDEyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0cmlwZUludm9pY2VzLmRhdGEuZm9yRWFjaCgoaW52OiAodHlwZW9mIHN0cmlwZUludm9pY2VzLmRhdGEpW251bWJlcl0pID0+IHtcbiAgICAgICAgICBpbnZvaWNlcy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBpbnYuaWQgPz8gXCJcIixcbiAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKChpbnYuY3JlYXRlZCA/PyAwKSAqIDEwMDApLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBhbW91bnQ6IGludi5hbW91bnRfcGFpZCA/PyAwLFxuICAgICAgICAgICAgY3VycmVuY3k6IGludi5jdXJyZW5jeSA/PyBcImpweVwiLFxuICAgICAgICAgICAgc3RhdHVzOiBpbnYuc3RhdHVzID8/IFwidW5rbm93blwiLFxuICAgICAgICAgICAgcGRmVXJsOiBpbnYuaW52b2ljZV9wZGYgPz8gbnVsbCxcbiAgICAgICAgICAgIHNwb3RJZFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGludm9pY2VzLnNvcnQoKGEsIGIpID0+IGIuZGF0ZS5sb2NhbGVDb21wYXJlKGEuZGF0ZSkpO1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgaW52b2ljZXMgfSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcImludGVybmFsX2Vycm9yXCIgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldEFkbWluQXV0aCIsImdldEFkbWluRGIiLCJzdHJpcGUiLCJHRVQiLCJyZXF1ZXN0IiwiYXV0aG9yaXphdGlvbiIsImhlYWRlcnMiLCJnZXQiLCJzdGFydHNXaXRoIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwiZGVjb2RlZFRva2VuIiwidmVyaWZ5SWRUb2tlbiIsInNsaWNlIiwibGVuZ3RoIiwidWlkIiwibWVtYmVyc2hpcHNTbmFwIiwiY29sbGVjdGlvbkdyb3VwIiwid2hlcmUiLCJlbXB0eSIsImludm9pY2VzIiwic3RyaXBlQ2xpZW50IiwiUHJvbWlzZSIsImFsbCIsImRvY3MiLCJtYXAiLCJkb2MiLCJkYXRhIiwiY3VzdG9tZXJJZCIsIlN0cmluZyIsInN0cmlwZUN1c3RvbWVySWQiLCJzcG90SWQiLCJyZWYiLCJwYXJlbnQiLCJpZCIsInN0cmlwZUludm9pY2VzIiwibGlzdCIsImN1c3RvbWVyIiwibGltaXQiLCJmb3JFYWNoIiwiaW52IiwicHVzaCIsImRhdGUiLCJEYXRlIiwiY3JlYXRlZCIsInRvSVNPU3RyaW5nIiwiYW1vdW50IiwiYW1vdW50X3BhaWQiLCJjdXJyZW5jeSIsInBkZlVybCIsImludm9pY2VfcGRmIiwic29ydCIsImEiLCJiIiwibG9jYWxlQ29tcGFyZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/stripe/invoices/route.ts\n");

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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Finvoices%2Froute&page=%2Fapi%2Fstripe%2Finvoices%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Finvoices%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Finvoices%2Froute&page=%2Fapi%2Fstripe%2Finvoices%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Finvoices%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_atarashi_spot_cloud_app_api_stripe_invoices_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/stripe/invoices/route.ts */ \"(rsc)/./app/api/stripe/invoices/route.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_Users_atarashi_spot_cloud_app_api_stripe_invoices_route_ts__WEBPACK_IMPORTED_MODULE_3__]);\n_Users_atarashi_spot_cloud_app_api_stripe_invoices_route_ts__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/stripe/invoices/route\",\n        pathname: \"/api/stripe/invoices\",\n        filename: \"route\",\n        bundlePath: \"app/api/stripe/invoices/route\"\n    },\n    resolvedPagePath: \"/Users/atarashi/spot-cloud/app/api/stripe/invoices/route.ts\",\n    nextConfigOutput,\n    userland: _Users_atarashi_spot_cloud_app_api_stripe_invoices_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzdHJpcGUlMkZpbnZvaWNlcyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGc3RyaXBlJTJGaW52b2ljZXMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZzdHJpcGUlMkZpbnZvaWNlcyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmF0YXJhc2hpJTJGc3BvdC1jbG91ZCUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZhdGFyYXNoaSUyRnNwb3QtY2xvdWQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ1c7QUFDeEY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGLHFDIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2FwcC9hcGkvc3RyaXBlL2ludm9pY2VzL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9zdHJpcGUvaW52b2ljZXMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9zdHJpcGUvaW52b2ljZXNcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3N0cmlwZS9pbnZvaWNlcy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2FwcC9hcGkvc3RyaXBlL2ludm9pY2VzL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Finvoices%2Froute&page=%2Fapi%2Fstripe%2Finvoices%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Finvoices%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/stripe","vendor-chunks/qs","vendor-chunks/object-inspect","vendor-chunks/get-intrinsic","vendor-chunks/side-channel-list","vendor-chunks/side-channel-weakmap","vendor-chunks/has-symbols","vendor-chunks/function-bind","vendor-chunks/side-channel-map","vendor-chunks/side-channel","vendor-chunks/get-proto","vendor-chunks/call-bind-apply-helpers","vendor-chunks/dunder-proto","vendor-chunks/math-intrinsics","vendor-chunks/call-bound","vendor-chunks/es-errors","vendor-chunks/gopd","vendor-chunks/es-define-property","vendor-chunks/hasown","vendor-chunks/es-object-atoms"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Finvoices%2Froute&page=%2Fapi%2Fstripe%2Finvoices%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Finvoices%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
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
exports.id = "app/api/stripe/spot-revenue/route";
exports.ids = ["app/api/stripe/spot-revenue/route"];
exports.modules = {

/***/ "(rsc)/./app/api/stripe/spot-revenue/route.ts":
/*!**********************************************!*\
  !*** ./app/api/stripe/spot-revenue/route.ts ***!
  \**********************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/firebase/admin */ \"(rsc)/./lib/firebase/admin.ts\");\n/* harmony import */ var _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/stripe/config */ \"(rsc)/./lib/stripe/config.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__]);\n_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n/**\n * GET /api/stripe/spot-revenue?spotId=xxx\n *\n * Stripe を直接クエリして SPOT の正確な収益情報を返す。\n * Firestore の socioCount は Webhook のズレで不正確になり得るため、\n * 運営者向けのダッシュボードではこのエンドポイントを使用する。\n *\n * 計算方針:\n *   Stripe手数料 = 決済総額 × STRIPE_PROCESSING_FEE_RATE\n *   SPOT利用料   = (決済総額 - Stripe手数料) × PLATFORM_FEE_PERCENT%\n *   振込予定額   = 決済総額 - Stripe手数料 - SPOT利用料\n *\n * レスポンス:\n *   socioCount       - アクティブなソシオ数（解約予定含む）\n *   cancelingCount   - 解約予定のソシオ数\n *   grossMonthly     - 月額決済総額\n *   estimatedStripeFee - 推定Stripe手数料（3.6%ベース、実際は変動あり）\n *   platformFee      - SPOT利用料\n *   netMonthly       - 振込予定額\n *   platformFeePercent - SPOT利用料率 (%)\n *   stripeFeePercent   - Stripe手数料率 (%)\n */ \n\n\nasync function GET(request) {\n    const authorization = request.headers.get(\"authorization\");\n    if (!authorization?.startsWith(\"Bearer \")) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"missing_auth\"\n        }, {\n            status: 401\n        });\n    }\n    const spotId = request.nextUrl.searchParams.get(\"spotId\");\n    if (!spotId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"missing_spot_id\"\n        }, {\n            status: 400\n        });\n    }\n    if (!_lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"stripe_not_configured\"\n        }, {\n            status: 503\n        });\n    }\n    try {\n        const decodedToken = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminAuth)().verifyIdToken(authorization.slice(\"Bearer \".length));\n        // SPOT の所有者確認\n        const spotDoc = await (0,_lib_firebase_admin__WEBPACK_IMPORTED_MODULE_1__.getAdminDb)().doc(`spots/${spotId}`).get();\n        if (!spotDoc.exists) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"spot_not_found\"\n            }, {\n                status: 404\n            });\n        }\n        if (spotDoc.data()?.ownerUid !== decodedToken.uid) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"forbidden\"\n            }, {\n                status: 403\n            });\n        }\n        // metadata.spotId で Stripe サブスクリプションを検索（Firestore非依存）\n        const searchResult = await _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.stripe.subscriptions.search({\n            query: `metadata['spotId']:'${spotId}'`,\n            limit: 100\n        });\n        const activeSubs = searchResult.data.filter((s)=>s.status === \"active\" || s.status === \"trialing\");\n        const cancelingSubs = activeSubs.filter((s)=>s.cancel_at_period_end);\n        // 決済総額の集計\n        let grossMonthly = 0;\n        for (const sub of activeSubs){\n            grossMonthly += Number(sub.metadata.planAmount ?? 0);\n        }\n        // 費用計算\n        // Stripe手数料を先に控除し、残額に対して PLATFORM_FEE_PERCENT% を課金\n        const { stripeFee: estimatedStripeFee, platformFee, payout: netMonthly } = (0,_lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.calcRevenue)(grossMonthly);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            socioCount: activeSubs.length,\n            cancelingCount: cancelingSubs.length,\n            grossMonthly,\n            estimatedStripeFee,\n            platformFee,\n            netMonthly,\n            platformFeePercent: _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.PLATFORM_FEE_PERCENT,\n            stripeFeePercent: _lib_stripe_config__WEBPACK_IMPORTED_MODULE_2__.STRIPE_PROCESSING_FEE_RATE * 100\n        });\n    } catch (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"internal_error\",\n            detail: error instanceof Error ? error.message : \"unknown\"\n        }, {\n            status: 500\n        });\n    }\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3N0cmlwZS9zcG90LXJldmVudWUvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQkMsR0FFdUQ7QUFDUTtBQU1uQztBQUV0QixlQUFlTyxJQUFJQyxPQUFvQjtJQUM1QyxNQUFNQyxnQkFBZ0JELFFBQVFFLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDO0lBRTFDLElBQUksQ0FBQ0YsZUFBZUcsV0FBVyxZQUFZO1FBQ3pDLE9BQU9aLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFlLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3BFO0lBRUEsTUFBTUMsU0FBU1IsUUFBUVMsT0FBTyxDQUFDQyxZQUFZLENBQUNQLEdBQUcsQ0FBQztJQUVoRCxJQUFJLENBQUNLLFFBQVE7UUFDWCxPQUFPaEIscURBQVlBLENBQUNhLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQWtCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3ZFO0lBRUEsSUFBSSxDQUFDVCxzREFBTUEsRUFBRTtRQUNYLE9BQU9OLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUF3QixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM3RTtJQUVBLElBQUk7UUFDRixNQUFNSSxlQUFlLE1BQU1sQixpRUFBWUEsR0FBR21CLGFBQWEsQ0FDckRYLGNBQWNZLEtBQUssQ0FBQyxVQUFVQyxNQUFNO1FBR3RDLGNBQWM7UUFDZCxNQUFNQyxVQUFVLE1BQU1yQiwrREFBVUEsR0FBR3NCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRVIsUUFBUSxFQUFFTCxHQUFHO1FBRTdELElBQUksQ0FBQ1ksUUFBUUUsTUFBTSxFQUFFO1lBQ25CLE9BQU96QixxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQWlCLEdBQUc7Z0JBQUVDLFFBQVE7WUFBSTtRQUN0RTtRQUVBLElBQUlRLFFBQVFHLElBQUksSUFBSUMsYUFBYVIsYUFBYVMsR0FBRyxFQUFFO1lBQ2pELE9BQU81QixxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQVksR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ2pFO1FBRUEsc0RBQXNEO1FBQ3RELE1BQU1jLGVBQWUsTUFBTXZCLHNEQUFNQSxDQUFDd0IsYUFBYSxDQUFDQyxNQUFNLENBQUM7WUFDckRDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRWhCLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDaUIsT0FBTztRQUNUO1FBRUEsTUFBTUMsYUFBYUwsYUFBYUgsSUFBSSxDQUFDUyxNQUFNLENBQ3pDLENBQUNDLElBQU1BLEVBQUVyQixNQUFNLEtBQUssWUFBWXFCLEVBQUVyQixNQUFNLEtBQUs7UUFFL0MsTUFBTXNCLGdCQUFnQkgsV0FBV0MsTUFBTSxDQUFDLENBQUNDLElBQU1BLEVBQUVFLG9CQUFvQjtRQUVyRSxVQUFVO1FBQ1YsSUFBSUMsZUFBZTtRQUNuQixLQUFLLE1BQU1DLE9BQU9OLFdBQVk7WUFDNUJLLGdCQUFnQkUsT0FBT0QsSUFBSUUsUUFBUSxDQUFDQyxVQUFVLElBQUk7UUFDcEQ7UUFFQSxPQUFPO1FBQ1AsbURBQW1EO1FBQ25ELE1BQU0sRUFBRUMsV0FBV0Msa0JBQWtCLEVBQUVDLFdBQVcsRUFBRUMsUUFBUUMsVUFBVSxFQUFFLEdBQ3RFM0MsK0RBQVdBLENBQUNrQztRQUVkLE9BQU92QyxxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO1lBQ3ZCb0MsWUFBWWYsV0FBV1osTUFBTTtZQUM3QjRCLGdCQUFnQmIsY0FBY2YsTUFBTTtZQUNwQ2lCO1lBQ0FNO1lBQ0FDO1lBQ0FFO1lBQ0FHLG9CQUFvQmhELG9FQUFvQkE7WUFDeENpRCxrQkFBa0JoRCwwRUFBMEJBLEdBQUc7UUFDakQ7SUFDRixFQUFFLE9BQU9VLE9BQU87UUFDZCxPQUFPZCxxREFBWUEsQ0FBQ2EsSUFBSSxDQUN0QjtZQUNFQyxPQUFPO1lBQ1B1QyxRQUFRdkMsaUJBQWlCd0MsUUFBUXhDLE1BQU15QyxPQUFPLEdBQUc7UUFDbkQsR0FDQTtZQUFFeEMsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2FwcC9hcGkvc3RyaXBlL3Nwb3QtcmV2ZW51ZS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEdFVCAvYXBpL3N0cmlwZS9zcG90LXJldmVudWU/c3BvdElkPXh4eFxuICpcbiAqIFN0cmlwZSDjgpLnm7TmjqXjgq/jgqjjg6rjgZfjgaYgU1BPVCDjga7mraPnorrjgarlj47nm4rmg4XloLHjgpLov5TjgZnjgIJcbiAqIEZpcmVzdG9yZSDjga4gc29jaW9Db3VudCDjga8gV2ViaG9vayDjga7jgrrjg6zjgafkuI3mraPnorrjgavjgarjgorlvpfjgovjgZ/jgoHjgIFcbiAqIOmBi+WWtuiAheWQkeOBkeOBruODgOODg+OCt+ODpeODnOODvOODieOBp+OBr+OBk+OBruOCqOODs+ODieODneOCpOODs+ODiOOCkuS9v+eUqOOBmeOCi+OAglxuICpcbiAqIOioiOeul+aWuemHnTpcbiAqICAgU3RyaXBl5omL5pWw5paZID0g5rG65riI57eP6aGNIMOXIFNUUklQRV9QUk9DRVNTSU5HX0ZFRV9SQVRFXG4gKiAgIFNQT1TliKnnlKjmlpkgICA9ICjmsbrmuIjnt4/poY0gLSBTdHJpcGXmiYvmlbDmlpkpIMOXIFBMQVRGT1JNX0ZFRV9QRVJDRU5UJVxuICogICDmjK/ovrzkuojlrprpoY0gICA9IOaxuua4iOe3j+mhjSAtIFN0cmlwZeaJi+aVsOaWmSAtIFNQT1TliKnnlKjmlplcbiAqXG4gKiDjg6zjgrnjg53jg7Pjgrk6XG4gKiAgIHNvY2lvQ291bnQgICAgICAgLSDjgqLjgq/jg4bjgqPjg5bjgarjgr3jgrfjgqrmlbDvvIjop6PntITkuojlrprlkKvjgoDvvIlcbiAqICAgY2FuY2VsaW5nQ291bnQgICAtIOino+e0hOS6iOWumuOBruOCveOCt+OCquaVsFxuICogICBncm9zc01vbnRobHkgICAgIC0g5pyI6aGN5rG65riI57eP6aGNXG4gKiAgIGVzdGltYXRlZFN0cmlwZUZlZSAtIOaOqOWumlN0cmlwZeaJi+aVsOaWme+8iDMuNiXjg5njg7zjgrnjgIHlrp/pmpvjga/lpInli5XjgYLjgorvvIlcbiAqICAgcGxhdGZvcm1GZWUgICAgICAtIFNQT1TliKnnlKjmlplcbiAqICAgbmV0TW9udGhseSAgICAgICAtIOaMr+i+vOS6iOWumumhjVxuICogICBwbGF0Zm9ybUZlZVBlcmNlbnQgLSBTUE9U5Yip55So5paZ546HICglKVxuICogICBzdHJpcGVGZWVQZXJjZW50ICAgLSBTdHJpcGXmiYvmlbDmlpnnjocgKCUpXG4gKi9cblxuaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0QWRtaW5BdXRoLCBnZXRBZG1pbkRiIH0gZnJvbSBcIkAvbGliL2ZpcmViYXNlL2FkbWluXCI7XG5pbXBvcnQge1xuICBQTEFURk9STV9GRUVfUEVSQ0VOVCxcbiAgU1RSSVBFX1BST0NFU1NJTkdfRkVFX1JBVEUsXG4gIGNhbGNSZXZlbnVlLFxuICBzdHJpcGVcbn0gZnJvbSBcIkAvbGliL3N0cmlwZS9jb25maWdcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCBhdXRob3JpemF0aW9uID0gcmVxdWVzdC5oZWFkZXJzLmdldChcImF1dGhvcml6YXRpb25cIik7XG5cbiAgaWYgKCFhdXRob3JpemF0aW9uPy5zdGFydHNXaXRoKFwiQmVhcmVyIFwiKSkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIm1pc3NpbmdfYXV0aFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gIH1cblxuICBjb25zdCBzcG90SWQgPSByZXF1ZXN0Lm5leHRVcmwuc2VhcmNoUGFyYW1zLmdldChcInNwb3RJZFwiKTtcblxuICBpZiAoIXNwb3RJZCkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIm1pc3Npbmdfc3BvdF9pZFwiIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gIH1cblxuICBpZiAoIXN0cmlwZSkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcInN0cmlwZV9ub3RfY29uZmlndXJlZFwiIH0sIHsgc3RhdHVzOiA1MDMgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGF3YWl0IGdldEFkbWluQXV0aCgpLnZlcmlmeUlkVG9rZW4oXG4gICAgICBhdXRob3JpemF0aW9uLnNsaWNlKFwiQmVhcmVyIFwiLmxlbmd0aClcbiAgICApO1xuXG4gICAgLy8gU1BPVCDjga7miYDmnInogIXnorroqo1cbiAgICBjb25zdCBzcG90RG9jID0gYXdhaXQgZ2V0QWRtaW5EYigpLmRvYyhgc3BvdHMvJHtzcG90SWR9YCkuZ2V0KCk7XG5cbiAgICBpZiAoIXNwb3REb2MuZXhpc3RzKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJzcG90X25vdF9mb3VuZFwiIH0sIHsgc3RhdHVzOiA0MDQgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNwb3REb2MuZGF0YSgpPy5vd25lclVpZCAhPT0gZGVjb2RlZFRva2VuLnVpZCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiZm9yYmlkZGVuXCIgfSwgeyBzdGF0dXM6IDQwMyB9KTtcbiAgICB9XG5cbiAgICAvLyBtZXRhZGF0YS5zcG90SWQg44GnIFN0cmlwZSDjgrXjg5bjgrnjgq/jg6rjg5fjgrfjg6fjg7PjgpLmpJzntKLvvIhGaXJlc3RvcmXpnZ7kvp3lrZjvvIlcbiAgICBjb25zdCBzZWFyY2hSZXN1bHQgPSBhd2FpdCBzdHJpcGUuc3Vic2NyaXB0aW9ucy5zZWFyY2goe1xuICAgICAgcXVlcnk6IGBtZXRhZGF0YVsnc3BvdElkJ106JyR7c3BvdElkfSdgLFxuICAgICAgbGltaXQ6IDEwMFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWN0aXZlU3VicyA9IHNlYXJjaFJlc3VsdC5kYXRhLmZpbHRlcihcbiAgICAgIChzKSA9PiBzLnN0YXR1cyA9PT0gXCJhY3RpdmVcIiB8fCBzLnN0YXR1cyA9PT0gXCJ0cmlhbGluZ1wiXG4gICAgKTtcbiAgICBjb25zdCBjYW5jZWxpbmdTdWJzID0gYWN0aXZlU3Vicy5maWx0ZXIoKHMpID0+IHMuY2FuY2VsX2F0X3BlcmlvZF9lbmQpO1xuXG4gICAgLy8g5rG65riI57eP6aGN44Gu6ZuG6KiIXG4gICAgbGV0IGdyb3NzTW9udGhseSA9IDA7XG4gICAgZm9yIChjb25zdCBzdWIgb2YgYWN0aXZlU3Vicykge1xuICAgICAgZ3Jvc3NNb250aGx5ICs9IE51bWJlcihzdWIubWV0YWRhdGEucGxhbkFtb3VudCA/PyAwKTtcbiAgICB9XG5cbiAgICAvLyDosrvnlKjoqIjnrpdcbiAgICAvLyBTdHJpcGXmiYvmlbDmlpnjgpLlhYjjgavmjqfpmaTjgZfjgIHmrovpoY3jgavlr77jgZfjgaYgUExBVEZPUk1fRkVFX1BFUkNFTlQlIOOCkuiqsumHkVxuICAgIGNvbnN0IHsgc3RyaXBlRmVlOiBlc3RpbWF0ZWRTdHJpcGVGZWUsIHBsYXRmb3JtRmVlLCBwYXlvdXQ6IG5ldE1vbnRobHkgfSA9XG4gICAgICBjYWxjUmV2ZW51ZShncm9zc01vbnRobHkpO1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcbiAgICAgIHNvY2lvQ291bnQ6IGFjdGl2ZVN1YnMubGVuZ3RoLFxuICAgICAgY2FuY2VsaW5nQ291bnQ6IGNhbmNlbGluZ1N1YnMubGVuZ3RoLFxuICAgICAgZ3Jvc3NNb250aGx5LFxuICAgICAgZXN0aW1hdGVkU3RyaXBlRmVlLFxuICAgICAgcGxhdGZvcm1GZWUsXG4gICAgICBuZXRNb250aGx5LFxuICAgICAgcGxhdGZvcm1GZWVQZXJjZW50OiBQTEFURk9STV9GRUVfUEVSQ0VOVCxcbiAgICAgIHN0cmlwZUZlZVBlcmNlbnQ6IFNUUklQRV9QUk9DRVNTSU5HX0ZFRV9SQVRFICogMTAwXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAge1xuICAgICAgICBlcnJvcjogXCJpbnRlcm5hbF9lcnJvclwiLFxuICAgICAgICBkZXRhaWw6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJ1bmtub3duXCJcbiAgICAgIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiZ2V0QWRtaW5BdXRoIiwiZ2V0QWRtaW5EYiIsIlBMQVRGT1JNX0ZFRV9QRVJDRU5UIiwiU1RSSVBFX1BST0NFU1NJTkdfRkVFX1JBVEUiLCJjYWxjUmV2ZW51ZSIsInN0cmlwZSIsIkdFVCIsInJlcXVlc3QiLCJhdXRob3JpemF0aW9uIiwiaGVhZGVycyIsImdldCIsInN0YXJ0c1dpdGgiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJzcG90SWQiLCJuZXh0VXJsIiwic2VhcmNoUGFyYW1zIiwiZGVjb2RlZFRva2VuIiwidmVyaWZ5SWRUb2tlbiIsInNsaWNlIiwibGVuZ3RoIiwic3BvdERvYyIsImRvYyIsImV4aXN0cyIsImRhdGEiLCJvd25lclVpZCIsInVpZCIsInNlYXJjaFJlc3VsdCIsInN1YnNjcmlwdGlvbnMiLCJzZWFyY2giLCJxdWVyeSIsImxpbWl0IiwiYWN0aXZlU3VicyIsImZpbHRlciIsInMiLCJjYW5jZWxpbmdTdWJzIiwiY2FuY2VsX2F0X3BlcmlvZF9lbmQiLCJncm9zc01vbnRobHkiLCJzdWIiLCJOdW1iZXIiLCJtZXRhZGF0YSIsInBsYW5BbW91bnQiLCJzdHJpcGVGZWUiLCJlc3RpbWF0ZWRTdHJpcGVGZWUiLCJwbGF0Zm9ybUZlZSIsInBheW91dCIsIm5ldE1vbnRobHkiLCJzb2Npb0NvdW50IiwiY2FuY2VsaW5nQ291bnQiLCJwbGF0Zm9ybUZlZVBlcmNlbnQiLCJzdHJpcGVGZWVQZXJjZW50IiwiZGV0YWlsIiwiRXJyb3IiLCJtZXNzYWdlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/stripe/spot-revenue/route.ts\n");

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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fspot-revenue%2Froute&page=%2Fapi%2Fstripe%2Fspot-revenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fspot-revenue%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fspot-revenue%2Froute&page=%2Fapi%2Fstripe%2Fspot-revenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fspot-revenue%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_atarashi_spot_cloud_app_api_stripe_spot_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/stripe/spot-revenue/route.ts */ \"(rsc)/./app/api/stripe/spot-revenue/route.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_Users_atarashi_spot_cloud_app_api_stripe_spot_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__]);\n_Users_atarashi_spot_cloud_app_api_stripe_spot_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/stripe/spot-revenue/route\",\n        pathname: \"/api/stripe/spot-revenue\",\n        filename: \"route\",\n        bundlePath: \"app/api/stripe/spot-revenue/route\"\n    },\n    resolvedPagePath: \"/Users/atarashi/spot-cloud/app/api/stripe/spot-revenue/route.ts\",\n    nextConfigOutput,\n    userland: _Users_atarashi_spot_cloud_app_api_stripe_spot_revenue_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzdHJpcGUlMkZzcG90LXJldmVudWUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnN0cmlwZSUyRnNwb3QtcmV2ZW51ZSUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnN0cmlwZSUyRnNwb3QtcmV2ZW51ZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmF0YXJhc2hpJTJGc3BvdC1jbG91ZCUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZhdGFyYXNoaSUyRnNwb3QtY2xvdWQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ2U7QUFDNUY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGLHFDIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9hdGFyYXNoaS9zcG90LWNsb3VkL2FwcC9hcGkvc3RyaXBlL3Nwb3QtcmV2ZW51ZS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3RyaXBlL3Nwb3QtcmV2ZW51ZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3N0cmlwZS9zcG90LXJldmVudWVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3N0cmlwZS9zcG90LXJldmVudWUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvYXRhcmFzaGkvc3BvdC1jbG91ZC9hcHAvYXBpL3N0cmlwZS9zcG90LXJldmVudWUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fspot-revenue%2Froute&page=%2Fapi%2Fstripe%2Fspot-revenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fspot-revenue%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/stripe","vendor-chunks/math-intrinsics","vendor-chunks/es-errors","vendor-chunks/qs","vendor-chunks/call-bind-apply-helpers","vendor-chunks/get-proto","vendor-chunks/object-inspect","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/function-bind","vendor-chunks/side-channel","vendor-chunks/side-channel-weakmap","vendor-chunks/side-channel-map","vendor-chunks/side-channel-list","vendor-chunks/hasown","vendor-chunks/get-intrinsic","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/call-bound"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstripe%2Fspot-revenue%2Froute&page=%2Fapi%2Fstripe%2Fspot-revenue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fspot-revenue%2Froute.ts&appDir=%2FUsers%2Fatarashi%2Fspot-cloud%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fatarashi%2Fspot-cloud&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
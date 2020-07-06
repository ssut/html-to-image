/* tslint:disable:max-line-length */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
import { getDataURLContent } from './utils';
// KNOWN ISSUE
// -----------
// Can not handle redirect-url, such as when access 'http://something.com/avatar.png'
// will redirect to 'http://something.com/65fc2ffcc8aea7ba65a1d1feda173540'
export default function getBlobFromURL(url, options) {
    return __awaiter(this, void 0, void 0, function () {
        var failed, resp, blob_1, dataUrl, content, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // cache bypass so we dont have CORS issues with cached images
                    // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
                    if (options.cacheBust) {
                        url += (/\?/.test(url) ? "&" : "?") + new Date().getTime(); // tslint:disable-line
                    }
                    failed = function (reason) {
                        var placeholder = "";
                        if (options.imagePlaceholder) {
                            var split = options.imagePlaceholder.split(/,/);
                            if (split && split[1]) {
                                placeholder = split[1];
                            }
                        }
                        var msg = "Failed to fetch resource: " + url;
                        if (reason) {
                            msg = typeof reason === "string" ? reason : reason.message;
                        }
                        if (msg) {
                            console.error(msg);
                        }
                        return placeholder;
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, window.fetch(url + "?" + Date.now(), {
                            method: 'GET',
                            mode: "cors",
                            credentials: "omit",
                            cache: "no-cache",
                        })];
                case 2:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.blob()];
                case 3:
                    blob_1 = _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var reader = new FileReader();
                            reader.addEventListener('error', reject);
                            reader.addEventListener('abort', reject);
                            reader.addEventListener('load', function () { return resolve(reader.result); }, false);
                            reader.readAsDataURL(blob_1);
                        })];
                case 4:
                    dataUrl = _a.sent();
                    content = getDataURLContent(dataUrl);
                    return [2 /*return*/, content];
                case 5:
                    e_1 = _a.sent();
                    return [2 /*return*/, failed(e_1)];
                case 6: return [2 /*return*/];
            }
        });
    });
}

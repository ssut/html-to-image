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
import { toArray, isDataUrl, toDataURL, getMimeType } from './utils';
import getBlobFromURL from './getBlobFromURL';
import embedResources from './embedResources';
function embedBackground(clonedNode, options) {
    var background = clonedNode.style.getPropertyValue('background');
    if (!background) {
        return Promise.resolve(clonedNode);
    }
    return Promise.resolve(background)
        .then(function (cssString) { return embedResources(cssString, null, options); })
        .then(function (cssString) {
        clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
        return clonedNode;
    });
}
function embedImageNode(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function () {
        var data, dataURL, node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(clonedNode instanceof HTMLImageElement) || isDataUrl(clonedNode.src)) {
                        return [2 /*return*/, clonedNode];
                    }
                    return [4 /*yield*/, getBlobFromURL(clonedNode.currentSrc, options)];
                case 1:
                    data = _a.sent();
                    dataURL = toDataURL(data, getMimeType(clonedNode.currentSrc));
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            clonedNode.addEventListener('load', function () { return resolve(clonedNode); });
                            clonedNode.addEventListener('abort', reject);
                            clonedNode.addEventListener('error', reject);
                            clonedNode.src = dataURL;
                        })];
                case 2:
                    node = _a.sent();
                    return [2 /*return*/, node];
            }
        });
    });
}
var a = {
    total: 0,
    count: 0,
};
function embedChildren(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function () {
        var children, deferreds, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    children = toArray(clonedNode.childNodes);
                    deferreds = children.map(function (child) { return embedImages(child, options); });
                    return [4 /*yield*/, Promise.all(deferreds).then(function () { return clonedNode; })
                        // a.count += 1
                    ];
                case 1:
                    resp = _a.sent();
                    // a.count += 1
                    console.info(a.count, a.total);
                    return [2 /*return*/, resp];
            }
        });
    });
}
export default function embedImages(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function () {
        var node;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(clonedNode instanceof Element)) {
                        return [2 /*return*/, clonedNode];
                    }
                    if (clonedNode.hasAttribute('srcset')) {
                        clonedNode.removeAttribute('srcset');
                    }
                    return [4 /*yield*/, embedBackground(clonedNode, options)];
                case 1:
                    node = _a.sent();
                    return [4 /*yield*/, embedImageNode(node, options)];
                case 2:
                    node = _a.sent();
                    return [4 /*yield*/, embedChildren(node, options)];
                case 3:
                    node = _a.sent();
                    return [2 /*return*/, node];
            }
        });
    });
}

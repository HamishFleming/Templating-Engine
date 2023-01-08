"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const ejs = require("ejs");
function render(content, data) {
    return ejs.render(content, data);
}
exports.render = render;
//# sourceMappingURL=template.js.map
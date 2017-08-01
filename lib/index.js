const sysPath = require('path');
const fs = require('fs');

class HtmlAngularjsCompiler {
  constructor(config) {
    this.config = config;
  }

  getModuleName() {
    if (!this.moduleName) {
      this.moduleName = walkPath('config.plugins.html-angularjs-brunch.module')(this) || 'templates'
    }
    return this.moduleName
  }

  compile(data, path, callback) {
    let error, result, moduleName = this.getModuleName();
    try {
      const parsedHtml = this.parseHtml(data);

      path = path.substring(path.indexOf('/') + 1, path.length);

      result = `;${moduleName}.run(['$templateCache', function($templateCache){$templateCache.put('${path}', '${parsedHtml}')}])`;
    }
    catch (err) {
      error = err;
    }
    finally {
      callback(error, result);
    }
  }

  parseHtml(str) {
    return String(str)
      .replace(/'/g, "\\'")
      .replace(/\n/g, '');
  }

  onCompile(compiled) {
    const filePaths = [];
    const pubDir = this.config.paths.public;
    const moduleName = this.getModuleName()

    for (let key in this.config.files.templates.joinTo) {
      filePaths.push(key);
    }

    Array.from(compiled).map((file) => {
      for (let filePath of Array.from(filePaths)) {
        if (file.path === `${pubDir}/${filePath}`) {
          const data = fs.readFileSync(file.path).toString();
          fs.writeFileSync(file.path, `;var ${moduleName} = angular.module('${moduleName}', []);${data};`);
        }
      }
    });
  }

  static assignBrunchMeta() {
    this.prototype.brunchPlugin = true;
    this.prototype.type = 'template';
    this.prototype.extension = 'html';
    this.prototype.pattern = /\.(?:html)$/;
  }
}

HtmlAngularjsCompiler.assignBrunchMeta()

module.exports = HtmlAngularjsCompiler

function walkPath(path) {
  const steps = Array.isArray(path) ? path : path.split('.')
  return (source) => steps.reduce((node, name) =>
    (node && name in node ? node[name] : undefined), source)
}

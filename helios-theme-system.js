const {
  buildThemeTemplateFromFile,
  createEmptyTheme,
  downloadQSS,
  generateFinalQSS,
  parseQssTheme,
} = require("./qss-theme-parser");

function createHeliosThemeSystem(qss) {
  const parsed = parseQssTheme(qss);
  let theme = { ...parsed.theme };

  return {
    keys: parsed.keys,
    theme,
    template: parsed.template,
    templatePlan: parsed.templatePlan,
    getTheme() {
      return { ...theme };
    },
    updateTheme(key, value) {
      if (!Object.prototype.hasOwnProperty.call(theme, key)) {
        return { ...theme };
      }

      theme = {
        ...theme,
        [key]: value,
      };

      this.theme = theme;
      return { ...theme };
    },
    generateFinalQSS() {
      return generateFinalQSS(parsed.template, theme);
    },
    downloadTheme() {
      downloadQSS(this.generateFinalQSS());
    },
  };
}

function createHeliosThemeSystemFromFile(filePath) {
  const parsed = buildThemeTemplateFromFile(filePath);
  let theme = { ...parsed.theme };

  return {
    keys: parsed.keys,
    theme,
    template: parsed.template,
    templatePlan: parsed.templatePlan,
    getTheme() {
      return { ...theme };
    },
    updateTheme(key, value) {
      if (!Object.prototype.hasOwnProperty.call(theme, key)) {
        return { ...theme };
      }

      theme = {
        ...theme,
        [key]: value,
      };

      this.theme = theme;
      return { ...theme };
    },
    generateFinalQSS() {
      return generateFinalQSS(parsed.template, theme);
    },
    downloadTheme() {
      downloadQSS(this.generateFinalQSS());
    },
  };
}

module.exports = {
  createEmptyTheme,
  createHeliosThemeSystem,
  createHeliosThemeSystemFromFile,
  downloadQSS,
  generateFinalQSS,
};

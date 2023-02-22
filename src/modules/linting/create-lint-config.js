export function createLintConfig({ rules = {}, plugins = [] } = {}) {
  const cache = {};

  plugins.forEach(({ name, rules = {} }) => {
    Object.entries(rules).forEach(([ruleName, fn]) => {
      cache[`bpmnlint-plugin-${name}/${ruleName}`] = fn;
    });
  });

  /**
   * A resolver that caches rules and configuration as part of the bundle,
   * making them accessible in the browser.
   *
   * @param {Object} cache
   */
  function Resolver() {}

  Resolver.prototype.resolveRule = function (pkg, ruleName) {
    const rule = cache[pkg + "/" + ruleName];

    if (!rule) {
      throw new Error("cannot resolve rule <" + pkg + "/" + ruleName + ">");
    }

    return rule;
  };

  Resolver.prototype.resolveConfig = function (pkg, configName) {
    throw new Error(
      "cannot resolve config <" + configName + "> in <" + pkg + ">"
    );
  };

  const resolver = new Resolver();
  const config = {
    rules: rules
  };

  const bundle = {
    resolver: resolver,
    config: config
  };
  return bundle;
}


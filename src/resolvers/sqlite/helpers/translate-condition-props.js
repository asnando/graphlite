// Parses the condition string translating all the schema properties to its
// column name. Example: Will translate: ${productNumber} to its real column name.
const translateConditionProps = (schema, condition = '') => {
  let parsedCondition = condition;
  const props = Array.from(condition.match(/\$\{\w+\}/g));
  props.forEach((propMarkup) => {
    const propName = propMarkup.replace(/(^\$\{)|(\}$)/g, '');
    const prop = schema.getProperty(propName);
    const propReplacer = new RegExp(`\\$\\{${propName}\\}`);
    const translatedPropertyName = `${prop.getPropertyTableAlias()}.${prop.getPropertyColumnName()}`;
    parsedCondition = parsedCondition.replace(propReplacer, translatedPropertyName);
  });
  return parsedCondition;
};

module.exports = translateConditionProps;

const translateSchemaPropsLiterals = (str, schema, queryOptions) => {
  const literals = Array.from(str.match(/\${\w+}/g));
  const tableAlias = schema.getTableAlias();
  literals.forEach((literal) => {
    const propName = literal.replace(/(^\$\{)|(\}$)/gi, '');
    const prop = schema.getProperty(propName);
    // eslint-disable-next-line no-param-reassign
    str = str.replace(literal, `${tableAlias}.${prop.getPropertyColumnName(queryOptions)}`);
  });
  return str;
};

module.exports = translateSchemaPropsLiterals;

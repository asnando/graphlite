module.exports = function pair(array, ignore = false, dflt) {
  return array.reduce((paired, value, index) => {
    if (!(index % 2)) {
      paired.push([value]);
    } else {
      paired[paired.length - 1].push(value);
    }
    return paired;
  }, []).map(array => {
    if (!ignore && array.length < 2) {
      array.push(dflt);
    }
    return array;
  });
}
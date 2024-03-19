const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // The Object.keys() static method returns an array of a given object's

  /**
 * Examples
 * const arr = ["a", "b", "c"];
console.log(Object.keys(arr)); // ['0', '1', '2']

// Array-like object
const obj = { 0: "a", 1: "b", 2: "c" };
console.log(Object.keys(obj)); // ['0', '1', '2']
 */

  Object.keys(obj).forEach((el) => {
    // here checking the is this a correct key which we define with the key which user provide,
    // if yes then we add it newObj
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
module.exports = filterObj;

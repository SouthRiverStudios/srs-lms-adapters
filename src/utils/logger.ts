export const log = function(message:string) {
  if (window && window.console) {
    console.log(Array.prototype.slice.call(arguments))
  }
}
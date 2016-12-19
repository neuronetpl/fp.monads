const jsc = require("jscheck");
const monads = require("../fp.monads");
const Task = monads.Task;

jest.useFakeTimers();

describe("Task test",()=>{

  let values=jsc.array(1000, jsc.any())();
  function getValue(index){
    return function(){
      return values[index];
    }
  }

  it("should create task :)",()=>{
    values.forEach((value)=>{

      let t = new Task((reject,resolve)=>{
        setTimeout(()=>{
          resolve(value);
        },200);
      });

      expect(t instanceof Task).toBe(true);

      let fn = jest.fn();
      let mapped = t.map((res)=>{
        fn();
        expect(res).toEqual(value);
        return res;
      }).map((res)=>{
        fn();
        expect(res).toEqual(value);
        return res;
      });

      expect(fn).toHaveBeenCalledTimes(0);

      jest.runAllTimers();

      mapped.fork((error)=>{
        throw error;
      },(result)=>{
        expect(fn).toHaveBeenCalledTimes(2);
        expect(result).toEqual(value);
      });

    });
  });

});

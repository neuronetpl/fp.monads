const jsc = require("jscheck");
const monads = require("../fp.monads");
const IO = monads.IO;
const Either = monads.Either;


describe("IO monad",()=>{

  let values=jsc.array(1000, jsc.any())();
  function getValue(index){
    return function(){
      return values[index];
    }
  }

  it("should create an IO monada and get proper values (run)",()=>{
    values.forEach((value,index)=>{
      let fn=getValue(index);
      let from=IO.from(fn);
      let newIO = new IO(fn);

      expect(from instanceof IO).toBe(true);
      expect(newIO instanceof IO).toBe(true);
      expect(from).toEqual(newIO);

      let resultFrom = from.run();
      let resultNew = newIO.run();
      expect(resultFrom).toEqual(value);
      expect(resultNew).toEqual(value);
    });
  });



  it("should not run (map) till IO.run fn",()=>{
    values.forEach((value,index)=>{
      let fn = getValue(index);

      expect(fn()).toEqual(value);
      let io=new IO(fn);

      let cntfn=jest.fn();

      let resBefore = io.map(cntfn).map(cntfn).map(cntfn);
      expect(cntfn).toHaveBeenCalledTimes(0);
      expect(resBefore instanceof IO).toBe(true);

      let count=0;
      let before=io.map((res)=>{
        count++;
        return res;
      }).map((res)=>{
        count++;
        return res;
      }).map((res)=>{
        count++;
        return res;
      });
      expect(before instanceof IO).toBe(true);
      expect(count).toEqual(0);
      let resAfter = before.run();
      expect(count).toEqual(3);
      expect(resAfter).toEqual(value);
    });
  });

  it("should return Either from IO operation (tryRun)",()=>{
    values.forEach((value,index)=>{
      let fn= getValue(index);
      expect(fn()).toEqual(value);
      let io = IO.from(fn);

      let count=0;
      let resultIO=io.map((res)=>{
        count++;
        return res;
      }).map((res)=>{
        count++;
        return res;
      }).map((res)=>{
        count++;
        return res;
      });
      expect(count).toEqual(0);
      let either = resultIO.tryRun();
      expect(count).toEqual(3);
      expect(either instanceof Either).toBe(true);
      expect(either.get()).toEqual(value);
      expect(either.value).toEqual(value);

      let throwingFn=function(){
        throw new Error(`${value}`);
      }

      let throwIO=new IO(throwingFn);
      let throwCount=0;
      let throwResult = throwIO.map((res)=>{
        throwCount++;
        return res;
      }).map((res)=>{
        throwCount++;
        return res;
      }).map((res)=>{
        throwCount++;
        return res;
      });

      expect(throwCount).toBe(0);
      let throwItToMeBaby = throwResult.tryRun();
      expect(throwItToMeBaby instanceof Either).toBe(true);
      expect(()=>throwItToMeBaby.get()).toThrow();
      expect(()=>throwItToMeBaby.value).toThrow();
      expect(throwItToMeBaby.merge().message).toEqual(`${value}`);

    });
  });


  it("should create IO.of value",()=>{
    values.forEach((value,index)=>{
      let io = IO.of(value);
      expect(io instanceof IO).toBe(true);
      let count=0;
      let runThis=io.map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      }).map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      }).map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      });
      expect(count).toEqual(0);
      let result=runThis.run();
      expect(count).toEqual(3);
      expect(result).toEqual(value);
    });
  });


  it("IO.chain",()=>{
    values.forEach((value,index)=>{
      let io = IO.of(value);
      expect(io instanceof IO).toBe(true);
      let count=0;
      let result=io.map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      }).map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      }).map((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      }).chain((res)=>{
        count++;
        expect(res).toEqual(value);
        return res;
      });

      expect(count).toEqual(4);
      expect(result).toEqual(value);
    });
  });

});

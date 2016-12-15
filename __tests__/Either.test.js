const jsc = require("jscheck");
const monads = require("../fp.monads");
const Container = monads.Container;
const Either = monads.Either;
const Left = monads.Left;
const Right = monads.Right;


describe("Either test",()=>{

  let values=jsc.array(1000, jsc.any())();

  it("should create Either.fromNullable",()=>{
    values.forEach((value)=>{

      let left = Either.left(value);
      let right = Either.right(value);
      let eitherNull=Either.fromNullable(null);

      expect(eitherNull instanceof Either).toBe(true);
      expect(eitherNull instanceof Left).toBe(true);
      expect(right instanceof Right).toBe(true);
      expect(left instanceof Left).toBe(true);

      expect(right.value).toEqual(value);
      expect(right.get()).toEqual(value);
      expect(()=>left.value).toThrow();
      expect(()=>left.get()).toThrow();

      let either = Either.fromNullable(value);
      if(value==null || typeof value=="undefined"){

        expect(either instanceof Left).toBe(true);
        expect( ()=>either.value ).toThrow();
        expect( ()=>either.get() ).toThrow();


      }else{

        expect(either instanceof Right).toBe(true);
        expect(either.value).toEqual(value);
        expect(either.get()).toEqual(value);

      }

    });

  });


  it("should map",()=>{
    values.forEach((value)=>{

      let either = Either.fromNullable(value);

      if(value==null || typeof value=="undefined"){

        let fn=jest.fn();
        either.map(fn).map(fn).map(fn);
        expect(fn).toHaveBeenCalledTimes(0);

        let result=either.map((val)=>"test");
        expect(result).toBe(either);

      }else{

        let fn=jest.fn();
        either.map(fn).map(fn).map(fn);
        expect(fn).toHaveBeenCalledTimes(3);

        either.map((val)=>{
          expect(val).toEqual(value);
          return val;
        }).map((val)=>{
          expect(val).toEqual(value);
          return val;
        });

        let result=either.map((val)=>"test");
        expect(result).toEqual(Either.right("test"));
      }

    });
  });


  it("should have proper states",()=>{
    values.forEach((value)=>{

      let either = Either.fromNullable(value);

      if(value==null || typeof value=="undefined"){

        expect(either.isLeft).toBe(true);
        expect(either.isRight).toBe(false);

      }else{

        expect(either.isLeft).toBe(false);
        expect(either.isRight).toBe(true);

      }

    });
  });



  it("should merge",()=>{

    values.forEach((value)=>{
      let either=Either.fromNullable(value);
      expect(either.merge()).toEqual(value);
    })

  });


  it("should join nested Eithers",()=>{
    values.forEach((_value)=>{

      function createNestedContainers(levels,current,value){
        let c = current || 0;
        let v = value || Either.fromNullable(_value);
        v = Either.fromNullable(v);//wrapping itself
        return levels==current ? value : createNestedContainers(levels,c+1,v);
      }

      let levels=20;
      let nested = createNestedContainers(levels);

      expect(nested instanceof Container).toBe(true);
      expect(nested.value instanceof Container).toBe(true);
      expect(nested instanceof Either).toBe(true);
      expect(nested.value instanceof Either).toBe(true);

      function checkLevels(levels,current,val){
        if(levels>current){
          expect(val.value instanceof Container).toBe(true);
          expect(val.value instanceof Either).toBe(true);
          checkLevels(levels,current+1,val.value);
        }else{
          if(typeof _value!="undefined" && _value!==null){
            expect(val.value).toEqual(_value);
          }else{
            expect(()=>val.value).toThrow();
            expect(()=>val.get()).toThrow();
          }
        }
      }
      checkLevels(levels,0,nested);

      expect(nested instanceof Container).toBe(true);

      let joined = nested.join();
      if(typeof _value!="undefined" && _value!==null){
        expect(joined.value).toEqual(_value);
      }else{
        expect(()=>joined.value).toThrow();
      }

    });
  });


  it("getOrElse",()=>{
    values.forEach((value)=>{
      let left = new Either.Left(value);
      let right = new Either.Right(value);

      expect(left.getOrElse(value)).toEqual(value);
      expect(left.getOrElse()).toBeUndefined();

      expect(right.getOrElse(value)).toEqual(value);
      expect(right.getOrElse("test")).toEqual(value);
    })
  });


  it("Either.getOrElseThrow",()=>{
    values.forEach((value)=>{
      let either = Either.fromNullable(value);

      if(typeof value=="undefined" || value==null){
        expect(()=>either.getOrElseThrow("error")).toThrow();
      }else{
        expect(either.getOrElseThrow("test")).toEqual(value);
      }

    });
  });


  it("Either.chain",()=>{
    values.forEach((value)=>{
      let right=new Either.Right(value);
      let result = right.chain((res)=>res);
      expect(result).toEqual(value);
      let left = new Either.Left(value);
      let resleft= left.chain((res)=>res);
      expect(resleft).toBe(left);
    });
  });


  it("orElse",()=>{
    values.forEach((value)=>{
      let right=new Either.Right(value);
      let result = right.orElse(()=>"else");
      expect(result).toEqual(right);

      let left = new Either.Left(value);
      let resleft = left.orElse(()=>value);
      expect(resleft).toEqual(value);
    });
  });


  it("filter",()=>{
    values.forEach((value)=>{
      let right = new Right(value);

      expect( right.filter(()=>true) ).toEqual(right);
      expect( right.filter(()=>true).value ).toEqual(value);

      expect( right.filter(()=>false) instanceof Left ).toBe(true);
      expect( ()=>right.filter(()=>false).value ).toThrow();

      let left = new Left(value);

      expect( left.filter(()=>true) instanceof Left ).toBe(true);
      expect( left.filter(()=>true) ).toBe(left);

    });
  });

});

const jsc = require("jscheck");
const monads = require("../fp.monads");
const Container = monads.Container;
const Maybe = monads.Maybe;
const Nothing = monads.Nothing;
const Just = monads.Just;

describe("Maybe monad",()=>{

  let values=jsc.array(1000, jsc.any())();

  it("should create maybe fromNullable",()=>{
    let nothing = Maybe.nothing();
    let just = Maybe.just("test");
    let maybe=Maybe.fromNullable(null);

    expect(maybe instanceof Maybe).toBe(true);
    expect(()=>maybe.value).toThrow();
    expect(()=>maybe.get()).toThrow();
  });



  it("should contain Left and Right class",()=>{

    expect(Maybe.Nothing).toBe(Nothing);
    expect(Maybe.Just).toBe(Just);

    expect(Maybe.isPrototypeOf(Maybe.Nothing)).toBe(true);
    expect(Maybe.isPrototypeOf(Maybe.Just)).toBe(true);

    expect(Container.isPrototypeOf(Maybe.Nothing)).toBe(true);
    expect(Container.isPrototypeOf(Maybe.Just)).toBe(true);

    let maybe = Maybe.fromNullable(null);
    expect(Maybe.isPrototypeOf(maybe.constructor.Nothing)).toBe(true);
    expect(Maybe.isPrototypeOf(maybe.constructor.Just)).toBe(true);

    expect(Container.isPrototypeOf(maybe.constructor.Nothing)).toBe(true);
    expect(Container.isPrototypeOf(maybe.constructor.Just)).toBe(true);

  });



  it("should create maybe from value and contain this value as Left or Right",()=>{

    values.forEach((value)=>{

      let maybe = Maybe.of(value);
      expect(maybe instanceof Maybe).toBe(true);
      expect(maybe instanceof Container).toBe(true);
      expect(maybe.value).toEqual(value);
      expect(maybe.get()).toEqual(value);

      let maybenull = Maybe.fromNullable(value);
      expect(maybenull instanceof Maybe).toBe(true);
      expect(maybenull instanceof Container).toBe(true);
      if(typeof value=="undefined" || value===null){

        expect(maybenull instanceof Maybe.Nothing).toBe(true);
        expect(()=>maybenull.value).toThrow();
        expect(()=>maybenull.get()).toThrow();

      }else{

        expect(maybenull instanceof Maybe.Just).toBe(true);
        expect(maybenull.value).toEqual(value);
        expect(maybenull.get()).toEqual(value);
      }

    });

  });




  function deform(v){ return "test"+JSON.stringify(v)+".test"; }

  it("should get the proper value from map",()=>{
    values.forEach((value,index)=>{

      let maybe = Maybe.just(value);
      expect(maybe.get()).toEqual(value);
      expect(maybe.value).toEqual(value);
      maybe.map((_val)=>{
        expect(_val).toEqual(value);
      });

      // just should execute even if the value is null
      let fn = jest.fn();
      maybe.map(fn).map(fn).map(fn);
      expect(fn).toHaveBeenCalledTimes(3);

      let deformed = deform(value);
      let result = maybe.map((_val)=>{
        return deformed;
      });
      expect(result.value).toBe(deformed);
      result.map((_val)=>{
        expect(_val).toBe(deformed);
      });

      let maybenull = Maybe.fromNullable(value);
      if(value===null || typeof value=="undefined"){
        expect(maybenull instanceof Nothing).toBe(true);

        let nullfn=jest.fn();
        maybenull.map(nullfn).map(nullfn).map(nullfn);
        expect(nullfn).toHaveBeenCalledTimes(0);

        expect(()=>maybenull.value).toThrow();
        expect(()=>maybenull.get()).toThrow();
      }

    });

  });



  it("should join nested Maybies",()=>{
    values.forEach((_value)=>{

      function createNestedContainers(levels,current,value){
        let c = current || 0;
        let v = value || Maybe.fromNullable(_value);
        v = Maybe.fromNullable(v);//wrapping itself
        return levels==current ? value : createNestedContainers(levels,c+1,v);
      }

      let levels=20;
      let nested = createNestedContainers(levels);

      expect(nested instanceof Container).toBe(true);
      expect(nested.value instanceof Container).toBe(true);
      expect(nested instanceof Maybe).toBe(true);
      expect(nested.value instanceof Maybe).toBe(true);

      function checkLevels(levels,current,val){
        if(levels>current){
          expect(val.value instanceof Container).toBe(true);
          expect(val.value instanceof Maybe).toBe(true);
          checkLevels(levels,current+1,val.value);
        }else{
          if(typeof _value!="undefined" && _value!==null){
            expect(val.value).toEqual(_value);
          }else{
            expect(()=>val.value).toThrow();
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



  it("should have proper states",()=>{

    let nothing = new Maybe.Nothing();
    let just = new Maybe.Just("test");

    expect(nothing.isNothing).toBe(true);
    expect(just.isNothing).toBe(false);

    expect(nothing.isJust).toBe(false);
    expect(just.isJust).toBe(true);

  });



  it("getOrElse",()=>{
    values.forEach((value)=>{
      let nothing = new Maybe.Nothing();
      let just = new Maybe.Just(value);

      expect(nothing.getOrElse(value)).toEqual(value);
      expect(nothing.getOrElse()).toBeUndefined();

      expect(just.getOrElse(value)).toEqual(value);
      expect(just.getOrElse("test")).toEqual(value);
    })
  });


  it("chain",()=>{
    values.forEach((value)=>{
      let just=new Maybe.Just(value);
      let result = just.chain((res)=>res);
      expect(result).toEqual(value);
      let nothing = new Maybe.Nothing();
      let resnothing= nothing.chain((res)=>res);
      expect(resnothing).toBe(nothing);
    });
  });


  it("orElse",()=>{
    values.forEach((value)=>{
      let just=new Maybe.Just(value);
      let result = just.orElse(()=>"else");
      expect(result).toEqual(just);

      let nothing = new Maybe.Nothing();
      let resnothing= nothing.orElse(()=>value);
      expect(resnothing).toEqual(value);
    });
  });


  it("filter",()=>{
    values.forEach((value)=>{
      let just = Maybe.just(value);

      expect( just.filter(()=>true) ).toEqual(just);
      expect( just.filter(()=>true).value ).toEqual(value);

      expect( just.filter(()=>false) instanceof Nothing ).toBe(true);
      expect( ()=>just.filter(()=>false).value ).toThrow();

      let nothing = Maybe.nothing();

      expect( nothing.filter(()=>true) instanceof Nothing ).toBe(true);
      expect( nothing.filter(()=>true) ).toBe(nothing);

    });
  });

});

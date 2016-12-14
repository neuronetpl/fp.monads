const jsc = require("jscheck");
const monads = require("../fp.monads");
const Container = monads.Container;

describe("Container class",()=>{

  let values=jsc.array(1000, jsc.any())();

  it("should create an Container",()=>{
    values.forEach((value,index)=>{
      let container = new Container(value);
      expect(container).toBeDefined();
      expect(container).toBeTruthy();
      expect(container instanceof Container).toBe(true);

      let containerOf = Container.of(value);
      expect(containerOf).toBeDefined();
      expect(containerOf).toBeTruthy();
      expect(containerOf instanceof Container).toBe(true);
    });
  });

  function deform(v){ return "test"+JSON.stringify(v)+".test"; }

  it("should get the proper value from new Container(val)",()=>{
    values.forEach((value,index)=>{

      let container = new Container(value);
      expect(container.get()).toEqual(value);
      expect(container.value).toEqual(value);
      container.map((_val)=>{
        expect(_val).toEqual(value);
      });

      let result = container.map((_val)=>{
        return deform(_val);
      });
      expect(result.value).toBe(deform(value));
      result.map((_val)=>{
        expect(_val).toBe(deform(value));
      });
    });

  });


  it("should get the proper value from Container.of(val)",()=>{
    values.forEach((value,index)=>{

      let container = Container.of(value);
      expect(container.get()).toEqual(value);
      expect(container.value).toEqual(value);
      container.map((_val)=>{
        expect(_val).toEqual(value);
      });

      let deformed = deform(value);
      let result = container.map((_val)=>{
        return deformed;
      });
      expect(result.value).toBe(deformed);
      result.map((_val)=>{
        expect(_val).toBe(deformed);
      });

    });
  });

  it("should map and return another Container with result",()=>{
    let values=jsc.array(1000, jsc.any())();
    values.forEach((value,index)=>{

      let container = Container.of(value);
      let result = container.map((_val)=>{
        return _val;
      });
      expect(result instanceof Container).toBe(true);
      result.map((_val)=>{
        expect(_val).toEqual(value);
      });

      let deformedValue = deform(value);
      let deformed = result.map((_val)=>{
        expect(_val).toEqual(value);
        return deformedValue;
      });
      expect(deformed.value).toEqual(deformedValue);
      expect(deformed.get()).toEqual(deformedValue);
      deformed.map((_val)=>{
        expect(_val).toEqual(deformedValue);
      });

    });
  });



  it("should join nested (flatten) Containers to one",()=>{
    values.forEach((_value)=>{

      function createNestedContainers(levels,current,value){
        let c = current || 0;
        let v = value || new Container(_value);
        v = new Container(v);//wrapping itself
        return levels==current ? value : createNestedContainers(levels,c+1,v);
      }

      let levels=20;
      let nested = createNestedContainers(levels);

      expect(nested instanceof Container).toBe(true);
      expect(nested.value instanceof Container).toBe(true);

      function checkLevels(levels,current,val){
        if(levels>current){
          expect(val.value instanceof Container).toBe(true);
          checkLevels(levels,current+1,val.value);
        }else{
          expect(val.value).toEqual(_value);
        }
      }
      checkLevels(levels,0,nested);

      let joined = nested.join();
      expect(joined.value).toEqual(_value);

    });

  });

  it("should convert Container.toString",()=>{
    values.forEach((value)=>{
      let container = Container.of(value);
      expect(typeof container.toString()).toBe("string");
    });
  });

});

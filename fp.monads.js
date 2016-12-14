const monads=(function(){

  class Container {

    constructor(value){
      this._value = value;
    }

    get value(){
      return this._value;
    }

    static of(value){
      return new Container(value);
    }

    map(f){
      return new Container(f(this.value));
    }

    join(){
      return this.value instanceof Container ? this.value.join() : this;
    }

    get(){
      return this.value;
    }

    toString(){
      return `Container (${this._value})`;
    }

  }


  class Maybe extends Container {

    constructor(){

    }

    static just(value){
      return new Just(value);
    }

    static nothing(){
      return new Nothing();
    }

    static fromNullable(value){
      return value !== null && typeof value !== "undefined" ? this.just(value) : this.nothing(value);
    }

    static of(value){
      return just(value);
    }

    get isNothing(){
      return false;
    }

    get isJust(){
      return false;
    }

    get Nothing(){
      return Nothing;
    }

    get Just(){
      return Just;
    }

  }

  class Nothing extends Maybe {

    map(f){
      return this;
    }

    get value(){
      throw new TypeError("Can't extract the value of a Nothing.");
    }

    getOrElse(other){
      return other;
    }

    orElse(f){
      return f();
    }

    filter(){
      return this.value;
    }

    get isNothing(){
      return true;
    }

    toString(){
      return `Maybe.Nothing`;
    }

  }

  class Just extends Maybe {

    map(f){
      return of(f(this.value));
    }

    getOrElse(){
      return this.value;
    }

    orElse(){
      return this;
    }

    filter(f){
      Maybe.fromNullable(f(this.value) ? this.value : null);
    }

    get isJust(){
      return true;
    }

    toString(){
      return `Maybe.Just (${this.value})`;
    }

  }


  class Either extends Container {


    static left(value){
      return new Left(value);
    }

    static right(value){
      return new Right(value);
    }

    static fromNullable(value){
      return value!==null && typeof value!="undefined" ? this.right(value) : this.left(value);
    }

    static of(value){
      return this.right(value);
    }

    static ['try'](f){
      return function(){
        try{
          return new Right(f.apply(null, arguments));
        }catch(e){
          return new Left(e);
        }
      }
    }

    get Left(){
      return Left;
    }

    get Right(){
      return Right;
    }

  }


  class Left extends Either{

    map(){
      return this;
    }

    get value(){
      throw new TypeError("Can't extract the value of a Left");
    }

    getOrElse(other){
      return other;
    }

    orElse(f){
      return f(this._value);
    }

    getOrElseThrow(error){
      throw new Error(error);
    }

    chain(f){
      return this;
    }

    filter(f){
      return this;
    }

    toString(){
      return `Either.Left`;
    }

  }

  class Right extends Either{

    map(f){
      return Either.of(f(this.value));
    }

    getOrElse(other){
      return this.value;
    }

    orElse(){
      return this;
    }

    chain(f){
      return f(this.value);
    }

    getOrElseThrow(error){
      return this.value;
    }

    filter(f){
      return Either.fromNullable( f(this.value) ? this.value : null );
    }

    toString(){
      return `Either.Right (${this.value})`;
    }

  }


  class IO {

    constructor(effect){
      if(typeof effect!="function"){
        throw "IO usage: function reuired";
      }
      this.effect=effect;
    }

    static of(value){
      return new IO( () => value );
    }

    static from(f){
      return new IO(f);
    }

    map(f){
      var self=this;
      return new IO(function(){
        return f(self.effect());
      });
    }

    chain(f){
      return f(this.effect());
    }

    run(){
      return this.effect();
    }

  }

  let delayed = typeof setImmediate !== 'undefined'?  setImmediate
              : typeof process !== 'undefined'?       process.nextTick
              : /* otherwise */                       setTimeout


  class Task {

    constructor(computation,cleanup){
      this.fork = computation;
      this.cleanup = cleanup || function() {};
    }

    of(b) {
      return new Task(function(_, resolve) {
        return resolve(b);
      });
    }

    rejected(a) {
      return new Task(function(reject) {
        return reject(a);
      });
    }

    map(f) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return reject(a);
        }, function(b) {
          return resolve(f(b));
        });
      }, cleanup);
    }

    chain(f) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return reject(a);
        }, function(b) {
          return f(b).fork(reject, resolve);
        });
      }, cleanup);
    }

    ap(that) {
      var forkThis = this.fork;
      var forkThat = that.fork;
      var cleanupThis = this.cleanup;
      var cleanupThat = that.cleanup;

      function cleanupBoth(state) {
        cleanupThis(state[0]);
        cleanupThat(state[1]);
      }

      return new Task(function(reject, resolve) {
        var func, funcLoaded = false;
        var val, valLoaded = false;
        var rejected = false;
        var allState;

        var thisState = forkThis(guardReject, guardResolve(function(x) {
          funcLoaded = true;
          func = x;
        }));

        var thatState = forkThat(guardReject, guardResolve(function(x) {
          valLoaded = true;
          val = x;
        }));

        function guardResolve(setter) {
          return function(x) {
            if (rejected) {
              return;
            }

            setter(x);
            if (funcLoaded && valLoaded) {
              delayed(function(){ cleanupBoth(allState) });
              return resolve(func(val));
            } else {
              return x;
            }
          }
        }

        function guardReject(x) {
          if (!rejected) {
            rejected = true;
            return reject(x);
          }
        }

        return allState = [thisState, thatState];
      }, cleanupBoth);
    }

    concat(that) {
      var forkThis = this.fork;
      var forkThat = that.fork;
      var cleanupThis = this.cleanup;
      var cleanupThat = that.cleanup;

      function cleanupBoth(state) {
        cleanupThis(state[0]);
        cleanupThat(state[1]);
      }

      return new Task(function(reject, resolve) {
        var done = false;
        var allState;
        var thisState = forkThis(guard(reject), guard(resolve));
        var thatState = forkThat(guard(reject), guard(resolve));

        return allState = [thisState, thatState];

        function guard(f) {
          return function(x) {
            if (!done) {
              done = true;
              delayed(function(){ cleanupBoth(allState) })
              return f(x);
            }
          };
        }
      }, cleanupBoth);

    }

    empty() {
      return new Task(function() {});
    }

    toString() {
      return 'Task';
    }

    orElse(f) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return f(a).fork(reject, resolve);
        }, function(b) {
          return resolve(b);
        });
      }, cleanup);
    }

    fold(f, g) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return resolve(f(a));
        }, function(b) {
          return resolve(g(b));
        });
      }, cleanup);
    }

    cata(pattern) {
      return this.fold(pattern.Rejected, pattern.Resolved);
    }

    swap() {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return resolve(a);
        }, function(b) {
          return reject(b);
        });
      }, cleanup);
    }

    bimap(f, g) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return reject(f(a));
        }, function(b) {
          return resolve(g(b));
        });
      }, cleanup);
    }

    rejectedMap(f) {
      var fork = this.fork;
      var cleanup = this.cleanup;

      return new Task(function(reject, resolve) {
        return fork(function(a) {
          return reject(f(a));
        }, function(b) {
          return resolve(b);
        });
      }, cleanup);
    }

  }

  function map(f){
    return function(functor) {
      return functor.map(f);
    }
  }

  function join(mma) {
    return mma.join();
  }

  function chain(f){
    return function(m){
      return m.map(f).join(); // or compose(join, map(f))(m)
    }
  }

  function maybe(x,f){
    return function(m){
      return m.isNothing ? x : f(m._value);
    }
  }

  function either(f, g) {
    return function(e){
      return e instanceof Left ? f(e._value) : g(e._value);
    }
  }

  return {
    Container,
    Maybe,
    Just,
    Nothing,
    Left,
    Right,
    Either,
    IO,
    Task,
    chain,
    map,
    join,
    maybe,
    either
  }

}());




if(typeof module!="undefined"){
  if(typeof module.exports != "undefined"){
    module.exports=monads
  }
}

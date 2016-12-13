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
    return f(this.value);
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

if(typeof module!="undefined"){
  if(typeof module.exports != "undefined"){
    module.exports={
      Container,Maybe,Just,Nothing,Left,Right,Either,IO
    };
  }
}

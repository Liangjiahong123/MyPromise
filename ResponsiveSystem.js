// 存储副作用函数的桶
const bucket = new WeakMap();

// 原始数据
const data = { ok: true, text: 'Hello Vue3' };

// 对原始数据的代理
const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },

  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
  }
});

function track(target, key) {
  // 如果没有副作用函数，则直接return
  if (!activeEffect) return target[key];
  // 根据target从桶中取得depsMap，它是一个Map类型: key --> effects
  let depsMap = bucket.get(target);
  // 如果depsMap不存在，则新建一个Map与target关联
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  // 再根据key从depsMap取得deps，它是一个Set类型，里面存储着与当前key相关联的副作用函数effects
  let deps = depsMap.get(key);
  // 如果deps不存在，则新建一个Set与key相关联
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 把当前激活的副作用函数添加到依赖集合deps中
  deps.add(activeEffect);
  // 将依赖集合添加到activeEffect.deps数组中
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  // 根据target从桶中取得depsMap
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  // 根据key取出所有副作用函数并执行
  const effects = depsMap.get(key);
  effects?.forEach((fn) => fn()); // 将副作用函数从桶中取出并执行
}

// 用于存储副作用函数
let activeEffect;
// effect变成一个用于注册的函数，传入的fn才是需要收集的副作用函数
function effect(fn) {
  const effectFn = () => {
    // 当effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    fn(); // 执行副作用函数
  };

  effectFn.deps = [];
  effectFn();
}

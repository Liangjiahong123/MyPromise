// 存储副作用函数的桶
const bucket = new WeakMap();

// 原始数据
const data = { foo: 1, bar: 2 };

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

  const effectsToRun = new Set();
  effects?.forEach((effectFn) => {
    // 如果trigger触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn);
    }
  });
  // 将副作用函数从桶中取出并执行
  effectsToRun.forEach((effectFn) => {
    // 如果传入了调度函数,则调用该调度函数,并将副作用函数作为参数传递,否则直接执行副作用函数
    const schedulerHandler = effectFn.options.scheduler;
    schedulerHandler ? schedulerHandler(effectFn) : effectFn();
  });
}

// 用于存储当前激活的副作用函数
let activeEffect;
// effect 栈
const effectStack = [];
// effect变成一个用于注册的函数，传入的fn才是需要收集的副作用函数
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    // 当effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    // 在调用副作用函数前先压入栈中
    effectStack.push(effectFn);
    // 执行副作用函数
    fn();
    // 执行完毕后讲当前副作用函数弹出栈
    effectStack.pop();
    // 把activeEffect还原为之前的值
    activeEffect = effectStack[effectStack.length - 1];
  };
  // 将options挂载到effectFn上
  effectFn.options = options;
  // 用于存储所有与该副作用函数相关的依赖集合
  effectFn.deps = [];
  effectFn();
}

function cleanup(effectFn) {
  // 遍历effectFn.deps
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]; // 获取依赖集合
    deps.delete(effectFn); // 将effectFn从依赖集合中移除
  }

  effectFn.deps.length = 0; // 重置effectFn.deps数组
}

// 任务队列
const jobQueue = new Set();
// promise实例,用于将任务添加到微任务队列
const p = Promise.resolve();
// 队列是否正在刷新的标志
let isFlushing = false;
function flushJob() {
  // 如果队列正在刷新,则什么都不做
  if (isFlushing) return;
  // 设置为true,代表正在刷新
  isFlushing = true;
  // 在微任务中刷新jobQueue队列
  p.then(() => {
    jobQueue.forEach((job) => job());
  }).finally(() => {
    // 结束后重置isFlushing
    isFlushing = false;
  });
}

// effect(
//   () => {
//     console.log(obj.foo);
//   },
//   {
//     scheduler(fn) {
//       jobQueue.add(fn);
//       flushJob();
//     }
//   }
// );

// obj.foo++;
// obj.foo++;
